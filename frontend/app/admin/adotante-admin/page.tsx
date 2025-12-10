"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  name: string;
  email: string;
  role: 'adotante' | 'admin';
  createdAt: string;
  interestedAnimalsCount: number;
  adoptedAnimalsCount: number;
  interestedAnimals?: Animal[];
  adoptedAnimals?: Animal[];
};

type Animal = {
  id: number;
  name: string;
  species: string;
  age: number;
  mainPhotoUrl?: string | null;
  status: "available" | "reserved" | "adopted";
};

export default function AdotanteAdminPage() {
  const [adotanteUsers, setAdotanteUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInterestedModal, setShowInterestedModal] = useState(false);
  const [showAdoptedModal, setShowAdoptedModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadAdotanteUsers();
  }, []);

  async function loadAdotanteUsers() {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Você precisa estar logado para acessar esta página");
        setLoading(false);
        router.push('/auth/login');
        return;
      }

      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // Verificar se é admin
      const meRes = await fetch("http://localhost:3003/users/me", {
        headers,
      });

      if (!meRes.ok) {
        if (meRes.status === 401 || meRes.status === 403) {
          setError("Você não tem permissão para acessar esta página");
          setLoading(false);
          return;
        }
      }

      const meData = await meRes.json();
      if (meData.role !== 'admin') {
        setError("Apenas administradores podem acessar esta página");
        setLoading(false);
        return;
      }

      // Buscar todos os usuários
      const res = await fetch("http://localhost:3003/users", {
        headers,
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Sessão expirada. Faça login novamente");
          localStorage.removeItem('token');
          router.push('/auth/login');
        } else if (res.status === 403) {
          setError("Você não tem permissão para acessar esta página");
        } else {
          setError(`Erro ${res.status}: ${res.statusText}`);
        }
        setLoading(false);
        return;
      }
      
      const allUsers = await res.json();
      
      // Filtrar apenas usuários adotantes
      const adotanteUsersData = allUsers.filter((user: any) => user.role === 'adotante');
      
      // Para cada adotante, buscar animais interessados e adotados
      const usersWithDetails = await Promise.all(
        adotanteUsersData.map(async (user: any) => {
          try {
            // Buscar animais interessados
            const interestedRes = await fetch(`http://localhost:3003/users/all/${user.id}/interested-animals`, {
              headers,
            });
            
            let interestedAnimals = [];
            if (interestedRes.ok) {
              interestedAnimals = await interestedRes.json();
            }

            // Buscar animais adotados
            const adoptedRes = await fetch(`http://localhost:3003/users/all/${user.id}/adopted-animals`, {
              headers,
            });
            
            let adoptedAnimals = [];
            if (adoptedRes.ok) {
              adoptedAnimals = await adoptedRes.json();
            }

            return {
              id: user.id,
              name: user.name || 'Sem nome',
              email: user.email,
              role: user.role || 'adotante',
              createdAt: user.createdAt || user.created_at,
              interestedAnimalsCount: interestedAnimals.length,
              adoptedAnimalsCount: adoptedAnimals.length,
              interestedAnimals,
              adoptedAnimals,
            };
          } catch (err) {
            console.error(`Erro ao buscar detalhes do usuário ${user.id}:`, err);
            return {
              id: user.id,
              name: user.name || 'Sem nome',
              email: user.email,
              role: user.role || 'adotante',
              createdAt: user.createdAt || user.created_at,
              interestedAnimalsCount: 0,
              adoptedAnimalsCount: 0,
              interestedAnimals: [],
              adoptedAnimals: [],
            };
          }
        })
      );

      setAdotanteUsers(usersWithDetails);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar adotantes:", err);
      setError("Erro de conexão com o servidor: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }

  const formatAge = (age: number) => {
    if (age < 1) {
      return `${Math.floor(age * 12)} meses`;
    }
    return `${age} ano${age !== 1 ? 's' : ''}`;
  };

  // Filtrar usuários por busca
  const filteredUsers = adotanteUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const totalInterests = adotanteUsers.reduce((acc, user) => acc + user.interestedAnimalsCount, 0);
  const totalAdoptions = adotanteUsers.reduce((acc, user) => acc + user.adoptedAnimalsCount, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Gestão de Adotantes</h1>
          <p className="text-gray-600">Carregando informações dos adotantes...</p>
        </div>
        
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Cabeçalho com navegação */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Gestão de Adotantes</h1>
            <p className="text-gray-600">
              Visualize todos os adotantes cadastrados e seus interesses
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
            
            <button
              onClick={loadAdotanteUsers}
              className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar
            </button>
          </div>
        </div>

        {/* Estatísticas simplificadas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Adotantes</p>
                <p className="text-2xl font-bold text-gray-800">{adotanteUsers.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.623a10.953 10.953 0 01-1.67.624 6 6 0 01-3-3 6 6 0 013-3 6 6 0 013 3 6 6 0 01-3 3 10.953 10.953 0 01-1.67-.624" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interesses Marcados</p>
                <p className="text-2xl font-bold text-green-600">{totalInterests}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Animais Adotados</p>
                <p className="text-2xl font-bold text-orange-600">{totalAdoptions}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar adotante por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-transparent outline-none transition-all"
          />
          <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          {error.includes("logado") && (
            <button
              onClick={() => router.push('/auth/login')}
              className="text-red-600 text-sm underline hover:text-red-800 mt-1"
            >
              Clique aqui para fazer login
            </button>
          )}
        </div>
      )}

      {/* Lista de Adotantes */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            Adotantes Cadastrados ({filteredUsers.length})
          </h2>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "Nenhum adotante encontrado" : "Nenhum adotante cadastrado"}
            </h3>
            <p className="text-gray-500">
              {searchTerm ? "Tente buscar com outros termos" : "Não há usuários adotantes no sistema."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adotante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interesses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adoções
                  </th>
                  {/* COLUNA DE AÇÕES REMOVIDA */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      if (user.interestedAnimalsCount > 0) {
                        setShowInterestedModal(true);
                      } else if (user.adoptedAnimalsCount > 0) {
                        setShowAdoptedModal(true);
                      }
                    }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400 mt-1">ID: {user.id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(user.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.interestedAnimalsCount > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.interestedAnimalsCount}
                        </span>
                        {user.interestedAnimalsCount > 0 && (
                          <span className="ml-2 text-sm text-green-600">
                            (clique para ver)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          user.adoptedAnimalsCount > 0 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.adoptedAnimalsCount}
                        </span>
                        {user.adoptedAnimalsCount > 0 && (
                          <span className="ml-2 text-sm text-orange-600">
                            (clique para ver)
                          </span>
                        )}
                      </div>
                    </td>
                    {/* CÉLULA DE AÇÕES REMOVIDA */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Animais Interessados */}
      {showInterestedModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Animais de Interesse - {selectedUser.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Email: {selectedUser.email} | ID: {selectedUser.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowInterestedModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {selectedUser.interestedAnimalsCount === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🐾</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhum interesse marcado
                  </h3>
                  <p className="text-gray-500">
                    Este adotante ainda não marcou interesse em nenhum animal.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedUser.interestedAnimals?.map((animal) => (
                    <div
                      key={animal.id}
                      className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="h-48 bg-gray-100">
                        {animal.mainPhotoUrl ? (
                          <img
                            src={animal.mainPhotoUrl}
                            alt={animal.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-animal.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <span className="text-5xl">🐕</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg text-gray-800 truncate">{animal.name}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              animal.status === "available"
                                ? "bg-green-100 text-green-800"
                                : animal.status === "reserved"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {animal.status === "available"
                              ? "Disponível"
                              : animal.status === "reserved"
                                ? "Reservado"
                                : "Adotado"}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-2">🐕</span>
                            <span>{animal.species}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span>{formatAge(animal.age)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">🆔</span>
                            <span>ID: {animal.id}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link
                            href={`/admin/animals/${animal.id}`}
                            className="block w-full text-center px-3 py-2 bg-[#419DB0] text-white text-sm font-medium rounded hover:bg-[#337d8f] transition-colors"
                            target="_blank"
                          >
                            Ver Detalhes do Animal
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: {selectedUser.interestedAnimalsCount} animais
                </div>
                <button
                  onClick={() => setShowInterestedModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Animais Adotados */}
      {showAdoptedModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Animais Adotados - {selectedUser.name}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Email: {selectedUser.email} | ID: {selectedUser.id}
                  </p>
                </div>
                <button
                  onClick={() => setShowAdoptedModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {selectedUser.adoptedAnimalsCount === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏡</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhuma adoção realizada
                  </h3>
                  <p className="text-gray-500">
                    Este adotante ainda não adotou nenhum animal.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedUser.adoptedAnimals?.map((animal) => (
                    <div
                      key={animal.id}
                      className="bg-green-50 rounded-lg shadow-md border border-green-100 hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      <div className="h-48 bg-green-100">
                        {animal.mainPhotoUrl ? (
                          <img
                            src={animal.mainPhotoUrl}
                            alt={animal.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder-animal.jpg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-green-50">
                            <span className="text-5xl">🐕</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-lg text-gray-800 truncate">{animal.name}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            ✅ Adotado
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span className="mr-2">🐕</span>
                            <span>{animal.species}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">📅</span>
                            <span>{formatAge(animal.age)}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">🆔</span>
                            <span>ID: {animal.id}</span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Link
                            href={`/admin/animals/${animal.id}`}
                            className="block w-full text-center px-3 py-2 bg-[#419DB0] text-white text-sm font-medium rounded hover:bg-[#337d8f] transition-colors"
                            target="_blank"
                          >
                            Ver Detalhes do Animal
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total: {selectedUser.adoptedAnimalsCount} adoções
                </div>
                <button
                  onClick={() => setShowAdoptedModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}