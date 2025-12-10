"use client";

import { useEffect, useState } from "react";

type Animal = {
  id: number;
  name: string;
  species: string;
  age: number;
  description: string;
  mainPhotoUrl?: string | null;
  status: "available" | "reserved" | "adopted";
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [interestedAnimals, setInterestedAnimals] = useState<Animal[]>([]);
  const [loadingAnimals, setLoadingAnimals] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3003/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
          
          // Se for adotante, carregar animais de interesse
          if (data.role === "adotante") {
            loadInterestedAnimals(token, data.id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  async function loadInterestedAnimals(token: string, userId: number) {
    try {
      setLoadingAnimals(true);
      const res = await fetch("http://localhost:3003/users/me/interested-animals", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setInterestedAnimals(data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar animais de interesse:", err);
    } finally {
      setLoadingAnimals(false);
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Disponível";
      case "reserved": return "Reservado";
      case "adopted": return "Adotado";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      case "adopted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Meu <span className="text-[#419DB0]">Painel</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas informações e animais de interesse.
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-2xl shadow p-6 animate-pulse border">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
      )}

      {/* NOT LOGGED */}
      {!loading && !user && (
        <div className="bg-white rounded-2xl shadow p-10 text-center border">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-700">Acesso restrito</h2>
          <p className="text-gray-500 mt-2">
            Você precisa entrar para acessar o painel.
          </p>

          <a
            href="/auth/login"
            className="
              inline-block mt-6 px-6 py-2 rounded-lg bg-[#419DB0] 
              text-white font-semibold text-sm hover:bg-[#337d8f]
              transition shadow
            "
          >
            Fazer login
          </a>
        </div>
      )}

      {/* LOGGED USER DASHBOARD */}
      {!loading && user && (
        <div className="space-y-8">

          {/* CARD USUÁRIO */}
          <div className="bg-white shadow-md border rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              👤 Meu Perfil
            </h2>

            <div className="space-y-1 text-sm text-gray-700">
              <p>
                <b>Nome:</b> {user.name}
              </p>
              <p>
                <b>E-mail:</b> {user.email}
              </p>
              <p>
                <b>Papel:</b>{" "}
                <span className="uppercase font-semibold text-[#419DB0]">
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          {/* AÇÕES PARA ADOTANTE */}
          {user.role === "adotante" && (
            <>
              {/* BOTÃO VER ANIMAIS */}
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Ações para Adotante
                </h2>
                <div className="grid md:grid-cols-1 gap-6">
                  <a
                    href="/adotante/animals"
                    className="
                      bg-white border rounded-2xl shadow-md p-6 
                      hover:shadow-lg transition flex items-center gap-4
                      hover:border-[#419DB0]
                    "
                  >
                    <div className="text-4xl">🐾</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Ver Animais para Adoção
                      </h3>
                      <p className="text-sm text-gray-600">
                        Conheça os animais disponíveis para adoção e demonstre seu interesse.
                      </p>
                    </div>
                  </a>
                </div>
              </div>

              {/* MEUS ANIMAIS DE INTERESSE */}
              <div className="border-t pt-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Meus Animais de Interesse
                  </h2>
                </div>

                {loadingAnimals ? (
                  <div className="bg-white border rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#419DB0]"></div>
                      <p className="text-gray-600">Carregando seus interesses...</p>
                    </div>
                  </div>
                ) : interestedAnimals.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-8 text-center">
                    <div className="text-5xl mb-4">❤️</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Nenhum animal marcado como interesse
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Você ainda não demonstrou interesse em nenhum animal.
                    </p>
                    <a
                      href="/adotante/animals"
                      className="inline-block px-5 py-2 bg-[#419DB0] text-white rounded-lg hover:bg-[#337d8f] transition font-medium"
                    >
                      Explorar animais disponíveis
                    </a>
                  </div>
                ) : (
                  <div>
                    {/* GRADE DE ANIMAIS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {interestedAnimals.map((animal) => (
                        <div 
                          key={animal.id}
                          className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow transition-shadow"
                        >
                          {/* IMAGEM */}
                          <div className="relative h-40 overflow-hidden">
                            <img
                              src={animal.mainPhotoUrl || "/placeholder.jpg"}
                              alt={animal.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animal.status)}`}>
                                {getStatusText(animal.status)}
                              </span>
                            </div>
                          </div>

                          {/* CONTEÚDO */}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-800 mb-1 truncate">
                              {animal.name}
                            </h4>
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                              <span>{animal.species}</span>
                              <span>{animal.age} ano(s)</span>
                            </div>
                            
                            <a
                              href={`/adotante/animals/${animal.id}`}
                              className="block w-full text-center mt-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                              Ver detalhes
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}