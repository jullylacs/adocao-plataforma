"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Animal {
  id: number;
  name: string;
  species: string;
  age: number;
  description: string;
  status: "available" | "reserved" | "adopted";
  mainPhotoUrl: string | null;
  photoUrls: string[] | null;
  breed?: string;
}

export default function EditAnimalPage() {
  const router = useRouter();
  const params = useParams();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    age: "",
    description: "",
    status: "available" as "available" | "reserved" | "adopted",
    mainPhotoUrl: "",
    photoUrls: "",
  });

  useEffect(() => {
    // Verificar autenticação
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "admin") {
      alert("Acesso negado. Apenas administradores podem editar.");
      router.push("/auth/login");
      return;
    }

    // Buscar animal para edição
    const animalId = params.id;
    if (!animalId || Array.isArray(animalId)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }

    fetchAnimalForEdit(animalId as string, token);
  }, [router, params]);

  const fetchAnimalForEdit = async (id: string, token: string) => {
    try {
      console.log(`📝 Buscando animal ${id} para edição...`);
      
      // 🔥 TENTA ROTA ADMIN PRIMEIRO
      const urlsToTry = [
        `http://localhost:3003/admin/animals/${id}`,
        `http://localhost:3003/animals/${id}`,
        `http://localhost:3003/api/animals/${id}`
      ];
      
      let response = null;
      let data = null;
      
      for (const url of urlsToTry) {
        try {
          response = await fetch(url, {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          continue;
        }
      }
      
      if (!response || !response.ok) {
        if (response?.status === 404) {
          throw new Error("Animal não encontrado");
        }
        throw new Error(`Erro ${response?.status || 'de conexão'}`);
      }
      
      // Normalizar dados
      const animalData = data.animal || data.data?.animal || data;
      
      setAnimal(animalData);
      
      // 🔥 CONVERTER photoUrls DE ARRAY PARA STRING (separada por vírgulas)
      const photoUrlsString = Array.isArray(animalData.photoUrls) 
        ? animalData.photoUrls.join(', ')
        : (Array.isArray(animalData.photo_urls) 
          ? animalData.photo_urls.join(', ') 
          : '');
      
      // Preencher formulário
      setFormData({
        name: animalData.name || "",
        species: animalData.species || "",
        age: animalData.age?.toString() || "",
        description: animalData.description || "",
        status: animalData.status || "available",
        mainPhotoUrl: animalData.mainPhotoUrl || animalData.main_photo_url || "",
        photoUrls: photoUrlsString,
      });
      
    } catch (err: any) {
      console.error("❌ Erro ao buscar animal:", err);
      setError(err.message || "Erro ao carregar animal");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!animal) return;
    
    // Validação básica
    if (!formData.name.trim()) {
      alert("Nome é obrigatório");
      return;
    }
    
    if (!formData.species.trim()) {
      alert("Espécie é obrigatória");
      return;
    }
    
    const ageNum = parseInt(formData.age);
    if (!formData.age || ageNum <= 0 || ageNum > 30) {
      alert("Idade deve ser um número entre 1 e 30");
      return;
    }

    try {
      setSaving(true);
      
      const token = localStorage.getItem("token");
      const animalId = params.id;
      
      // 🔥 CONVERTER photoUrls DE VOLTA PARA ARRAY
      const photoUrlsArray = formData.photoUrls
        .split(',')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const requestBody = {
        name: formData.name,
        species: formData.species,
        age: ageNum,
        description: formData.description,
        status: formData.status,
        mainPhotoUrl: formData.mainPhotoUrl.trim() || null,
        photoUrls: photoUrlsArray.length > 0 ? photoUrlsArray : null,
      };
      
      console.log("📤 Enviando dados:", requestBody);
      
      // 🔥 TENTA PATCH (atualização parcial) primeiro, se não PUT (substituição completa)
      const methodsToTry = ['PATCH'];
      let response = null;
      
      for (const method of methodsToTry) {
        try {
          response = await fetch(`http://localhost:3003/admin/animals/${animalId}`, {
            method: method,
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });
          
          if (response.ok) {
            console.log(`✅ Animal atualizado com ${method}`);
            break;
          }
        } catch (err) {
          continue;
        }
      }
      
      if (!response || !response.ok) {
        const errorData = await response?.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response?.status || 'de conexão'}`);
      }
      
      const updatedAnimal = await response.json();
      console.log("✅ Animal atualizado:", updatedAnimal);
      
      alert("Animal atualizado com sucesso!");
      
      // Redirecionar para página de detalhes
      router.push(`/admin/animals/${animalId}`);
      
    } catch (err: any) {
      console.error("❌ Erro ao salvar:", err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Descartar alterações?")) {
      router.push(`/admin/animals/${params.id}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#419DB0] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando animal para edição...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !animal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || "Animal não encontrado"}
          </h2>
          <p className="text-gray-600 mb-6">
            Não foi possível carregar o animal para edição.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/admin/animals/${params.id}`}
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
            >
              ← Voltar para detalhes
            </Link>
            <Link
              href="/admin/animals"
              className="px-6 py-3 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition"
            >
              Ver lista de animais
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link
                href={`/admin/animals/${animal.id}`}
                className="inline-flex items-center text-[#419DB0] hover:text-[#337d8f] mb-2"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar para detalhes
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Editar Animal</h1>
              <p className="text-gray-600 mt-1">
                Editando: <span className="font-semibold">{animal.name}</span> (ID: {animal.id})
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700">
                <strong>Atenção:</strong> As alterações serão salvas no banco de dados imediatamente.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Animal *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                  placeholder="Ex: Rex, Luna, Thor"
                  required
                />
              </div>

              {/* Espécie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espécie *
                </label>
                <select
                  name="species"
                  value={formData.species}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                  required
                >
                  <option value="">Selecione uma espécie</option>
                  <option value="Cachorro">Cachorro</option>
                  <option value="Gato">Gato</option>
                  <option value="Pássaro">Pássaro</option>
                  <option value="Roedor">Roedor</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Idade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Idade (anos) *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="0"
                  max="30"
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                  placeholder="Ex: 2 (ou 1.5 para 1 ano e meio)"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                >
                  <option value="available">Disponível para adoção</option>
                  <option value="reserved">Reservado</option>
                  <option value="adopted">Adotado</option>
                </select>
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="space-y-6">
              {/* Raça */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raça
                </label>
                <input
                  type="text"
                  name="breed"
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                  placeholder="Ex: Labrador, Siames, SRD"
                />
              </div>

              {/* URL da Foto Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Foto Principal
                </label>
                <input
                  type="url"
                  name="mainPhotoUrl"
                  value={formData.mainPhotoUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent"
                  placeholder="https://exemplo.com/foto.jpg"
                />
                {formData.mainPhotoUrl && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <img
                      src={formData.mainPhotoUrl}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* URLs de Fotos Adicionais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs de Fotos Adicionais (separadas por vírgula)
                </label>
                <textarea
                  name="photoUrls"
                  value={formData.photoUrls}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent resize-none text-sm"
                  placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Insira URLs separadas por vírgula. Deixe vazio se não houver fotos adicionais.
                </p>
              </div>
            </div>
          </div>

          {/* Descrição (full width) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0] focus:border-transparent resize-none"
              placeholder="Descreva o animal: personalidade, histórico de saúde, necessidades especiais..."
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.description.length} caracteres
            </p>
          </div>

          {/* Form Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              disabled={saving}
            >
              Cancelar
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Resetar para valores originais
                  if (animal && confirm("Restaurar valores originais?")) {
                    const originalPhotoUrls = Array.isArray(animal.photoUrls) 
                      ? animal.photoUrls.join(', ')
                      : '';
                    
                    setFormData({
                      name: animal.name || "",
                      species: animal.species || "",
                      age: animal.age?.toString() || "",
                      description: animal.description || "",
                      status: animal.status || "available",
                      mainPhotoUrl: animal.mainPhotoUrl || "",
                      photoUrls: originalPhotoUrls,
                    });
                  }
                }}
                className="px-6 py-3 rounded-lg border border-yellow-300 text-yellow-700 font-semibold hover:bg-yellow-50 transition"
                disabled={saving}
              >
                Restaurar Original
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Informações do Sistema */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Informações Técnicas
              </p>
              <p className="text-sm text-gray-500">
                Animal ID: {animal.id} • API: PATCH /admin/animals/{animal.id}
              </p>
            </div>
            <div className="text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Status: {formData.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}