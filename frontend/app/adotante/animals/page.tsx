"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Animal = {
  id: number;
  name: string;
  species: string;
  age: number;
  mainPhotoUrl?: string | null;
  status: "available" | "reserved" | "adopted";
  isInterested?: boolean;
};

export default function AnimalsPage() {
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadAnimals();
    loadUserInterests();
  }, []);

  async function loadAnimals() {
    try {
      const token = localStorage.getItem("token");
      
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch("http://localhost:3003/animals", {
        method: 'GET',
        headers,
        cache: 'no-cache',
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setError("Você precisa estar logado para ver os animais");
        } else if (res.status === 403) {
          setError("Você não tem permissão para acessar esta página");
        } else {
          setError(`Erro ${res.status}: ${res.statusText}`);
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      let animalsArray: Animal[] = [];
      
      if (Array.isArray(data)) {
        animalsArray = data;
      } else if (data?.animals?.length) {
        animalsArray = data.animals;
      } else if (data?.data?.length) {
        animalsArray = data.data;
      } else if (data?.items?.length) {
        animalsArray = data.items;
      }
      
      const formattedAnimals = animalsArray.map((animal: any) => ({
        id: animal.id,
        name: animal.name || 'Sem nome',
        species: animal.species || 'Não especificado',
        age: animal.age || 0,
        mainPhotoUrl: animal.mainPhotoUrl || animal.main_photo_url || null,
        status: animal.status || 'available',
        isInterested: false
      }));
      
      await loadAndUpdateInterests(formattedAnimals);
      
    } catch (err: any) {
      console.error("Erro ao carregar animais:", err);
      setError("Erro de conexão com o servidor: " + err.message);
      setLoading(false);
    }
  }

  async function loadUserInterests() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:3003/users/me/interested-animals", {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const interests = await res.json();
        const interestIds = interests.map((interest: any) => interest.id);
        localStorage.setItem('interestedAnimals', JSON.stringify(interestIds));
      }
    } catch (err) {
      console.error("Erro ao carregar interesses:", err);
    }
  }

  async function loadAndUpdateInterests(animals: Animal[]) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        finalizeAnimals(animals);
        return;
      }

      const res = await fetch("http://localhost:3003/users/me/interested-animals", {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        const interests = await res.json();
        const interestedAnimalIds = interests.map((animal: any) => animal.id);

        const updatedAnimals = animals.map(animal => ({
          ...animal,
          isInterested: interestedAnimalIds.includes(animal.id)
        }));

        finalizeAnimals(updatedAnimals);
        
        localStorage.setItem('interestedAnimals', JSON.stringify(interestedAnimalIds));
      } else {
        finalizeAnimals(animals);
      }
    } catch (err) {
      console.error("Erro ao verificar interesses:", err);
      finalizeAnimals(animals);
    }
  }

  function finalizeAnimals(animals: Animal[]) {
    const availableOnly = animals.filter(
      animal => animal.status === "available"
    );
    
    setAllAnimals(animals);
    setAvailableAnimals(availableOnly);
    setError(null);
    setLoading(false);
  }

  async function markInterest(animalId: number) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Faça login para marcar interesse.");
        window.location.href = '/auth/login';
        return;
      }

      // 🔥 CORREÇÃO AQUI: Usar endpoint correto
      const res = await fetch(`http://localhost:3003/users/me/interested-animals/${animalId}`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Sessão expirada. Faça login novamente.");
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          return;
        }
        
        let errorMessage = "Erro ao marcar interesse.";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
          console.log("Resposta de erro:", errorData);
        } catch {
          errorMessage = `Erro ${res.status}: ${res.statusText}`;
        }
        
        alert(errorMessage);
        return;
      }

      // Atualizar estado local
      const updatedAnimals = allAnimals.map(animal => 
        animal.id === animalId ? { ...animal, isInterested: true } : animal
      );
      
      const updatedAvailable = availableAnimals.map(animal =>
        animal.id === animalId ? { ...animal, isInterested: true } : animal
      );

      setAllAnimals(updatedAnimals);
      setAvailableAnimals(updatedAvailable);

      // Atualizar localStorage
      const currentInterests = JSON.parse(localStorage.getItem('interestedAnimals') || '[]');
      if (!currentInterests.includes(animalId)) {
        const newInterests = [...currentInterests, animalId];
        localStorage.setItem('interestedAnimals', JSON.stringify(newInterests));
      }

      // Verificar resposta
      try {
        const result = await res.json();
        console.log("Resposta da API:", result);
        
        if (result.message) {
          alert(result.message);
        } else {
          alert("Interesse registrado com sucesso!");
        }
      } catch {
        alert("Interesse registrado com sucesso!");
      }

      // Recarregar interesses
      loadUserInterests();
      
    } catch (err) {
      console.error("Erro completo:", err);
      alert("Erro de conexão. Tente novamente.");
    }
  }

  async function removeInterest(animalId: number) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Faça login para gerenciar interesses.");
        return;
      }

      // 🔥 CORREÇÃO AQUI: Endpoint para remover interesse
      const res = await fetch(`http://localhost:3003/users/me/interested-animals/${animalId}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const updatedAnimals = allAnimals.map(animal => 
          animal.id === animalId ? { ...animal, isInterested: false } : animal
        );
        
        const updatedAvailable = availableAnimals.map(animal =>
          animal.id === animalId ? { ...animal, isInterested: false } : animal
        );

        setAllAnimals(updatedAnimals);
        setAvailableAnimals(updatedAvailable);

        const currentInterests = JSON.parse(localStorage.getItem('interestedAnimals') || '[]');
        const newInterests = currentInterests.filter((id: number) => id !== animalId);
        localStorage.setItem('interestedAnimals', JSON.stringify(newInterests));

        alert("Interesse removido com sucesso!");
        loadUserInterests();
      } else {
        console.log("Endpoint DELETE não implementado. Atualizando apenas localmente.");
        // Fallback: atualizar apenas localmente se o endpoint não existir
        const updatedAnimals = allAnimals.map(animal => 
          animal.id === animalId ? { ...animal, isInterested: false } : animal
        );
        
        const updatedAvailable = availableAnimals.map(animal =>
          animal.id === animalId ? { ...animal, isInterested: false } : animal
        );

        setAllAnimals(updatedAnimals);
        setAvailableAnimals(updatedAvailable);

        const currentInterests = JSON.parse(localStorage.getItem('interestedAnimals') || '[]');
        const newInterests = currentInterests.filter((id: number) => id !== animalId);
        localStorage.setItem('interestedAnimals', JSON.stringify(newInterests));

        alert("Interesse removido localmente (backend não implementado)");
      }
    } catch (err) {
      console.error("Erro ao remover interesse:", err);
    }
  }

  const formatAge = (age: number) => {
    if (age < 1) {
      return `${Math.floor(age * 12)} meses`;
    }
    return `${age} ano${age !== 1 ? 's' : ''}`;
  };

  const displayAnimals = showAll ? allAnimals : availableAnimals;
  
  const interestedCount = allAnimals.filter(animal => animal.isInterested).length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Animais para Adoção</h1>
          <p className="text-gray-600">Encontre seu novo melhor amigo</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* BOTÃO PARA O DASHBOARD DO ADOTANTE - ADICIONADO NO TOPO */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => router.push('/adotante/dashboard')}
          className="px-6 py-3 bg-gradient-to-r from-[#419DB0] to-[#337d8f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:from-[#337d8f] hover:to-[#2a697a]"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Meu Dashboard
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-1">Animais para Adoção</h1>
        <p className="text-gray-500 text-sm mb-5">Encontre seu novo melhor amigo</p>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <span className="text-green-500 font-bold text-lg">{availableAnimals.length}</span>
            <span className="text-sm text-gray-600">disponíveis</span>
          </div>
          <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <span className="text-gray-600 font-bold text-lg">{allAnimals.length - availableAnimals.length}</span>
            <span className="text-sm text-gray-600">adotados/reservados</span>
          </div>
          {interestedCount > 0 && (
            <div className="flex items-center gap-2 bg-white border border-[#419DB0]/30 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-[#419DB0] font-bold text-lg">{interestedCount}</span>
              <span className="text-sm text-gray-600">interesses meus</span>
            </div>
          )}
        </div>
      </div>

      {allAnimals.length > availableAnimals.length && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showAll ? 'Mostrar apenas disponíveis' : `Ver todos (${allAnimals.length} animais)`}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
          </div>
          {error.includes("logado") && (
            <Link href="/auth/login" className="text-red-600 text-sm underline hover:text-red-800 mt-1 block">
              Clique aqui para fazer login
            </Link>
          )}
        </div>
      )}

      {availableAnimals.length === 0 && !showAll ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum animal disponível</h3>
          <p className="text-gray-500">Todos os nossos animais já encontraram um lar!</p>
          
          {allAnimals.length > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Ver animais já adotados ({allAnimals.length})
            </button>
          )}
        </div>
      ) : (
        <>
          {showAll && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">
                  Visualizando todos os animais ({displayAnimals.length})
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                {availableAnimals.length} disponíveis para adoção
              </p>
            </div>
          )}
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayAnimals.map((animal) => (
              <div
                key={animal.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col ${
                  animal.status !== "available" ? "opacity-70" : ""
                }`}
              >
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={animal.mainPhotoUrl || "/placeholder-animal.jpg"}
                    alt={animal.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-animal.jpg";
                    }}
                  />
                  <div className="absolute top-3 right-3">
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
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-800 truncate">{animal.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="mr-3">🐕 {animal.species}</span>
                      <span>📅 {formatAge(animal.age)}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-2">
                    <Link
                      href={`/adotante/animals/${animal.id}`}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-center"
                    >
                      Ver detalhes
                    </Link>
                    
                    {animal.status === "available" ? (
                      animal.isInterested ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-center p-2 bg-green-50 text-green-700 rounded-lg">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Interesse marcado</span>
                          </div>
                          <button
                            onClick={() => removeInterest(animal.id)}
                            className="w-full px-4 py-2 rounded-lg border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
                          >
                            Remover interesse
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => markInterest(animal.id)}
                          className="w-full px-4 py-3 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition-colors duration-200 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Tenho interesse
                        </button>
                      )
                    ) : (
                      <div className={`text-center p-3 rounded-lg ${
                        animal.status === "reserved" 
                          ? "bg-yellow-50 text-yellow-700" 
                          : "bg-gray-50 text-gray-500"
                      }`}>
                        <span className="font-medium">
                          {animal.status === "reserved" 
                            ? "Animal já reservado" 
                            : "Animal já adotado"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}