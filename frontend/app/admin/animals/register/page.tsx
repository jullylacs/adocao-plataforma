"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterAnimalPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Cachorro");
  const [age, setAge] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [mainPhotoUrl, setMainPhotoUrl] = useState("");
  const [photoUrls, setPhotoUrls] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("token");

      if (!token || role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
        
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setError("");

      const role = localStorage.getItem("role");
      const token = localStorage.getItem("token");
      
      if (!token || role !== "admin") {
        setError("Permissão negada. Apenas administradores podem cadastrar animais.");
        return;
      }

      try {
        // Validações (mantenha as mesmas)
        if (!name.trim()) {
          setError("Nome é obrigatório");
          return;
        }
        
        if (!species.trim()) {
          setError("Espécie é obrigatória");
          return;
        }
        
        if (!age || Number(age) <= 0) {
          setError("Idade deve ser um número positivo");
          return;
        }
        
        if (!description.trim()) {
          setError("Descrição é obrigatória");
          return;
        }

        // ⭐⭐ TESTAR DIFERENTES ENDPOINTS ⭐⭐
        const endpoints = [
          "http://localhost:3003/admin/animals",
          "http://localhost:3003/api/animals", 
          "http://localhost:3003/animals/create",
          "http://localhost:3003/animals/register"
        ];

        let response = null;
        let lastError = null;
        let successfulEndpoint = "";

        // Tentar cada endpoint
        for (const endpoint of endpoints) {
          try {
            console.log(`Tentando endpoint: ${endpoint}`);
            
            response = await fetch(endpoint, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                name: name.trim(),
                species: species.trim(),
                age: Number(age),
                description: description.trim(),
                mainPhotoUrl: mainPhotoUrl.trim() || null,
                photoUrls: photoUrls
                  ? photoUrls.split(",").map((url) => url.trim()).filter(url => url)
                  : [],
              }),
            });

            if (response.ok) {
              successfulEndpoint = endpoint;
              break; // Parar se funcionou
            } else {
              console.log(`Endpoint ${endpoint} falhou: ${response.status}`);
            }
          } catch (err) {
            lastError = err;
            continue;
          }
        }

        // Verificar se algum endpoint funcionou
        if (!response || !response.ok) {
          setError(`Nenhum endpoint funcionou. Verifique as rotas do backend.`);
          return;
        }

        const data = await response.json();
        alert(`✅ Animal cadastrado com sucesso! (Via: ${successfulEndpoint})`);
        router.push("/admin/animals");
        
      } catch (err) {
        setError("Erro de conexão com o servidor. Tente novamente.");
      }
    }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a]">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#419DB0] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Verificando permissões...</h2>
          <p className="text-gray-600 mt-2">Verificando se você é administrador</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a]">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Apenas administradores podem cadastrar animais.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Role atual: <span className="font-semibold">{localStorage.getItem("role") || "Não identificado"}</span>
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full py-2.5 rounded-lg text-white font-semibold bg-[#419DB0] hover:bg-[#337d8f] transition"
            >
              Fazer Login como Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a] px-4 py-10">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Cadastrar Animal 🐶🐱</h1>
            <p className="text-gray-600 text-sm mt-1">
              Preencha os dados para adicionar um novo animal
            </p>
          </div>
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
            👑 ADMIN
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome *</label>
            <input
              type="text"
              required
              placeholder="Ex: Bob, Luna, Thor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Espécie *</label>
            <select
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
              required
            >
              <option value="Cachorro">🐕 Cachorro</option>
              <option value="Gato">🐈 Gato</option>
              <option value="Pássaro">🐦 Pássaro</option>
              <option value="Roedor">🐹 Roedor</option>
              <option value="Outro">❓ Outro</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Idade (anos) *</label>
            <input
              type="number"
              required
              min="0"
              max="30"
              placeholder="Ex: 3"
              value={age}
              onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">Idade em anos completos</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Descrição *</label>
            <textarea
              required
              placeholder="Descreva o animal: personalidade, histórico de saúde, necessidades especiais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length} caracteres
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Foto principal (URL)</label>
            <input
              type="url"
              placeholder="https://exemplo.com/foto.jpg"
              value={mainPhotoUrl}
              onChange={(e) => setMainPhotoUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
            />
            {mainPhotoUrl && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <img
                  src={mainPhotoUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Outras fotos (URLs separadas por vírgula)</label>
            <input
              type="text"
              placeholder="https://exemplo.com/foto1.jpg, https://exemplo.com/foto2.jpg"
              value={photoUrls}
              onChange={(e) => setPhotoUrls(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separe múltiplas URLs com vírgula
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <span className="text-red-500 mr-2">❌</span>
                <div>
                  <p className="text-sm font-medium text-red-800">Erro</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard")}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm bg-[#419DB0] hover:bg-[#337d8f] shadow transition-all"
            >
              Cadastrar Animal
            </button>
          </div>
        </form>

        {/* Footer limpo e simples */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Área restrita para administradores
          </p>
        </div>
      </div>
    </div>
  );
}