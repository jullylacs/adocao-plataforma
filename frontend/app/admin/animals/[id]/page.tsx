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
  owner?: { id: number; name: string; email: string } | null;
  interestedUser?: Array<{ id: number; name: string; email: string }> | null;
  reservations?: Array<{ id: number; status: string; created_at: Date }> | null; // 🔥 FIX: created_at em vez de createdAt
  appointments?: Array<{ id: number; date_time: Date; status: string }> | null; // 🔥 FIX: date_time em vez de date
  created_at: Date;
  updated_at: Date;
}

export default function AnimalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"interests" | "reservations" | "appointments">("interests");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    if (!token || role !== "admin") {
      alert("Acesso negado. Apenas administradores podem acessar.");
      router.push("/auth/login");
      return;
    }
    
    setIsAdmin(true);
    
    const animalId = params.id;
    if (!animalId || Array.isArray(animalId)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }
    
    fetchAnimalDetails(animalId as string, token);
  }, [router, params]);

  const fetchAnimalDetails = async (id: string, token: string) => {
    try {
      setLoading(true);
      
      const urlsToTry = [
        `http://localhost:3003/admin/animals/${id}`,
        `http://localhost:3003/animals/${id}`,
        `http://localhost:3003/api/animals/${id}`
      ];
      
      let response = null;
      
      for (const url of urlsToTry) {
        try {
          response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` },
            cache: "no-store"
          });
          if (response.ok) break;
        } catch (err) {
          continue;
        }
      }
      
      if (!response || !response.ok) {
        if (response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          router.push("/auth/login");
          return;
        }
        if (response?.status === 404) {
          throw new Error(`Animal com ID ${id} não encontrado`);
        }
        throw new Error(`Erro ${response?.status || "de conexão"}`);
      }
      
      const data = await response.json();
      let normalizedAnimal: Animal;
      
      if (data.animal) normalizedAnimal = data.animal;
      else if (data.data?.animal) normalizedAnimal = data.data.animal;
      else if (data.id) normalizedAnimal = data;
      else throw new Error("Estrutura de dados inesperada");
      
      // 🔥 NORMALIZAÇÃO DOS CAMPOS
      const processedAnimal: Animal = {
        id: normalizedAnimal.id,
        name: normalizedAnimal.name || 'Sem nome',
        species: normalizedAnimal.species || 'Não especificado',
        age: normalizedAnimal.age || 0,
        description: normalizedAnimal.description || 'Sem descrição',
        status: normalizedAnimal.status || 'available',
        mainPhotoUrl: normalizedAnimal.mainPhotoUrl || normalizedAnimal.mainPhotoUrl || null,
        photoUrls: normalizedAnimal.photoUrls || normalizedAnimal.photoUrls || [],
        owner: normalizedAnimal.owner || null,
        interestedUser: normalizedAnimal.interestedUser || [],
        reservations: normalizedAnimal.reservations || [],
        appointments: normalizedAnimal.appointments || [],
        created_at: normalizedAnimal.created_at || normalizedAnimal.created_at || new Date(),
        updated_at: normalizedAnimal.updated_at || normalizedAnimal.updated_at || new Date()
      };
      
      setAnimal(processedAnimal);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar detalhes do animal");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: "available" | "reserved" | "adopted") => {
    if (!animal || !confirm(`Alterar status para "${newStatus}"?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3003/admin/animals/${animal.id}/status`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setAnimal(prev => prev ? { ...prev, status: updated.status } : null);
        alert(`Status atualizado para ${newStatus}`);
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (err) {
      alert("Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    if (!animal || !confirm(`EXCLUIR PERMANENTEMENTE o animal "${animal.name}"?`)) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3003/admin/animals/${animal.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert("Animal excluído com sucesso!");
        router.push("/admin/animals");
      } else {
        const error = await response.json();
        alert(`Erro: ${error.message || "Não foi possível excluir"}`);
      }
    } catch (err) {
      alert("Erro ao excluir animal");
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR").slice(0, 5);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      case "adopted": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Disponível";
      case "reserved": return "Reservado";
      case "adopted": return "Adotado";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#419DB0] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando animal...</h2>
          <p className="text-gray-500 mt-2">ID: {params.id}</p>
        </div>
      </div>
    );
  }

  if (error || !animal) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">😿</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error || "Animal não encontrado"}</h2>
          <p className="text-gray-600 mb-6">O animal solicitado não pôde ser carregado.</p>
          <div className="flex flex-col gap-3">
            <Link href="/admin/animals" className="px-6 py-3 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition">
              ← Voltar para lista
            </Link>
            <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition">
              🔄 Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/animals" className="inline-flex items-center text-[#419DB0] hover:text-[#337d8f] mb-4">
            ← Voltar para animais
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{animal.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(animal.status)}`}>
                  {getStatusText(animal.status)}
                </span>
                <span className="text-gray-600">ID: {animal.id}</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">Criado em: {formatDate(animal.created_at)}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select 
                value={animal.status} 
                onChange={(e) => handleStatusChange(e.target.value as any)} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#419DB0]"
              >
                <option value="available">Disponível</option>
                <option value="reserved">Reservado</option>
                <option value="adopted">Adotado</option>
              </select>
              
              <Link 
                href={`/admin/animals/${animal.id}/edit`} 
                className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition flex items-center"
              >
                ✏️ Editar
              </Link>
              
              <button 
                onClick={handleDelete} 
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition flex items-center"
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {animal.mainPhotoUrl ? (
                <img 
                  src={animal.mainPhotoUrl} 
                  alt={animal.name} 
                  className="w-full h-64 md:h-96 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.jpg";
                  }}
                />
              ) : (
                <div className="w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">📷</div>
                    <p className="text-gray-500">Sem foto principal</p>
                  </div>
                </div>
              )}
            </div>

            {animal.photoUrls && animal.photoUrls.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Galeria de Fotos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {animal.photoUrls.map((url, index) => (
                    <img 
                      key={index} 
                      src={url} 
                      alt={`${animal.name} ${index + 1}`} 
                      className="w-full aspect-square object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Descrição</h3>
              <p className="text-gray-700 whitespace-pre-line">{animal.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações</h3>
              <div className="space-y-4">
                {[
                  { label: "Espécie", value: animal.species },
                  { label: "Idade", value: `${animal.age} anos` },
                  { 
                    label: "Dono", 
                    value: animal.owner ? animal.owner.name : "Sem dono", 
                    color: animal.owner ? "text-green-600" : "text-gray-500" 
                  },
                  { label: "Criado em", value: formatDate(animal.created_at) },
                  { label: "Atualizado em", value: formatDate(animal.updated_at) }
                ].map((item, i) => (
                  <div key={i}>
                    <label className="text-sm text-gray-500">{item.label}</label>
                    <p className={`font-medium ${item.color || "text-gray-900"}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    count: animal.interestedUser?.length || 0, 
                    label: "Interessados", 
                    bg: "bg-blue-50", 
                    text: "text-blue-600" 
                  },
                  { 
                    count: animal.reservations?.length || 0, 
                    label: "Reservas", 
                    bg: "bg-green-50", 
                    text: "text-green-600" 
                  },
                  { 
                    count: animal.appointments?.length || 0, 
                    label: "Agendamentos", 
                    bg: "bg-yellow-50", 
                    text: "text-yellow-600" 
                  },
                  { 
                    count: animal.age, 
                    label: "Anos", 
                    bg: "bg-purple-50", 
                    text: "text-purple-600" 
                  }
                ].map((stat, i) => (
                  <div key={i} className={`text-center p-4 ${stat.bg} rounded-lg`}>
                    <p className={`text-2xl font-bold ${stat.text}`}>{stat.count}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: "interests", label: "Interessados", count: animal.interestedUser?.length || 0 },
                { id: "reservations", label: "Reservas", count: animal.reservations?.length || 0 },
                { id: "appointments", label: "Agendamentos", count: animal.appointments?.length || 0 }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`py-3 px-1 font-medium text-sm border-b-2 ${activeTab === tab.id ? "border-[#419DB0] text-[#419DB0]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  {tab.label}
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? "bg-[#419DB0] text-white" : "bg-gray-200 text-gray-700"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="bg-white rounded-b-xl shadow-lg p-6">
            {activeTab === "interests" && (
              animal.interestedUser && animal.interestedUser.length > 0 ? (
                <div className="grid gap-4">
                  {animal.interestedUser.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{user.name?.charAt(0)?.toUpperCase() || "?"}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "Sem nome"}</p>
                          <p className="text-sm text-gray-600">{user.email || "Sem email"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Contatar</button>
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum interessado ainda</h3>
                  <p className="text-gray-500">Este animal ainda não tem pessoas interessadas.</p>
                </div>
              )
            )}

            {activeTab === "reservations" && (
              animal.reservations && animal.reservations.length > 0 ? (
                <div className="grid gap-4">
                  {animal.reservations.map((res) => (
                    <div key={res.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-semibold text-gray-900">Reserva #{res.id}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              res.status === 'approved' ? 'bg-green-100 text-green-800' : 
                              res.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {res.status === 'approved' ? 'Aprovada' : 
                               res.status === 'pending' ? 'Pendente' : 
                               res.status === 'rejected' ? 'Rejeitada' : 
                               res.status || 'Desconhecido'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Criada em: {formatDate(res.created_at)}</p>
                        </div>
                        <Link 
                          href={`/admin/reservations/${res.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma reserva</h3>
                  <p className="text-gray-500">Este animal ainda não tem reservas registradas.</p>
                </div>
              )
            )}

            {activeTab === "appointments" && (
              animal.appointments && animal.appointments.length > 0 ? (
                <div className="grid gap-4">
                  {animal.appointments.map((appt) => (
                    <div key={appt.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-semibold text-gray-900">Agendamento #{appt.id}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              appt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              appt.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appt.status === 'completed' ? 'Concluído' : 
                               appt.status === 'scheduled' ? 'Agendado' : 
                               appt.status === 'cancelled' ? 'Cancelado' : 
                               appt.status || 'Desconhecido'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">Data: {formatDate(appt.date_time)}</p>
                        </div>
                        <Link 
                          href={`/admin/appointments/${appt.id}`}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">🗓️</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum agendamento</h3>
                  <p className="text-gray-500">Este animal ainda não tem agendamentos registrados.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}