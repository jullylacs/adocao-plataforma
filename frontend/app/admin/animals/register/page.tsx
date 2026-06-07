"use client";

import { useState, useEffect, useRef } from "react";
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
  const [photoInputMode, setPhotoInputMode] = useState<"url" | "file">("url");
  const [filePreview, setFilePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("token");

      if (!token || role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        setTimeout(() => { router.push("/auth/login"); }, 2000);
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFilePreview(result);
      setMainPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  function switchMode(mode: "url" | "file") {
    setPhotoInputMode(mode);
    setMainPhotoUrl("");
    setFilePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
      if (!name.trim()) { setError("Nome é obrigatório"); return; }
      if (!species.trim()) { setError("Espécie é obrigatória"); return; }
      if (!age || Number(age) <= 0) { setError("Idade deve ser um número positivo"); return; }
      if (!description.trim()) { setError("Descrição é obrigatória"); return; }

      const finalPhotoUrl = photoInputMode === "file" ? filePreview : mainPhotoUrl.trim();

      const response = await fetch("http://localhost:3003/admin/animals", {
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
          mainPhotoUrl: finalPhotoUrl || null,
          photoUrls: photoUrls
            ? photoUrls.split(",").map((url) => url.trim()).filter((url) => url)
            : [],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Sessão expirada. Faça login novamente.");
          return;
        }
        if (response.status === 403) {
          setError("Sem permissão. Apenas administradores podem cadastrar animais.");
          return;
        }
        const errBody = await response.json().catch(() => null);
        setError(errBody?.message ?? `Erro ${response.status} ao cadastrar animal.`);
        return;
      }

      await response.json();
      alert("✅ Animal cadastrado com sucesso!");
      router.push("/admin/animals");
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3003.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a]">
        <div className="text-center bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#419DB0] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Verificando permissões...</h2>
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
          <p className="text-gray-600 mb-6">Apenas administradores podem cadastrar animais.</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="w-full py-2.5 rounded-lg text-white font-semibold bg-[#419DB0] hover:bg-[#337d8f] transition"
          >
            Fazer Login como Admin
          </button>
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
            <p className="text-gray-600 text-sm mt-1">Preencha os dados para adicionar um novo animal</p>
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
            <p className="text-xs text-gray-500 mt-1">{description.length} caracteres</p>
          </div>

          {/* Foto principal com toggle URL / Arquivo */}
          <div>
            <label className="text-sm font-medium text-gray-700">Foto principal</label>

            {/* Tabs */}
            <div className="flex mt-1 rounded-lg overflow-hidden border border-gray-200">
              <button
                type="button"
                onClick={() => switchMode("url")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  photoInputMode === "url"
                    ? "bg-[#419DB0] text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                🔗 Link (URL)
              </button>
              <button
                type="button"
                onClick={() => switchMode("file")}
                className={`flex-1 py-2 text-xs font-semibold transition-colors border-l border-gray-200 ${
                  photoInputMode === "file"
                    ? "bg-[#419DB0] text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                📁 Upload de arquivo
              </button>
            </div>

            {/* URL input */}
            {photoInputMode === "url" && (
              <div className="mt-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/foto.jpg"
                  value={mainPhotoUrl}
                  onChange={(e) => setMainPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0] outline-none transition"
                />
              </div>
            )}

            {/* File upload input */}
            {photoInputMode === "file" && (
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="photo-file-input"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`w-full border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#419DB0] bg-[#419DB0]/10"
                      : filePreview
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-[#419DB0] hover:bg-[#419DB0]/5"
                  }`}
                >
                  {filePreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border shrink-0"
                      />
                      <div className="text-left">
                        <p className="text-sm font-medium text-green-700">Imagem selecionada</p>
                        <p className="text-xs text-gray-500 mt-0.5">Clique para trocar</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📷</div>
                      <p className="text-sm font-medium text-gray-600">
                        Clique para selecionar ou arraste a imagem aqui
                      </p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — máx. 5 MB</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Preview (URL mode) */}
            {photoInputMode === "url" && mainPhotoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={mainPhotoUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg border shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <p className="text-xs text-gray-500">Preview da imagem</p>
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
            <p className="text-xs text-gray-500 mt-1">Separe múltiplas URLs com vírgula</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <span className="text-red-500">❌</span>
              <div>
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-600">{error}</p>
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

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">Área restrita para administradores</p>
        </div>
      </div>
    </div>
  );
}
