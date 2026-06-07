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
  status?: "available" | "reserved" | "adopted"; // 🔥 ADICIONEI STATUS
};

type UserMe = {
  id: number;
  name: string;
  email: string;
  role: "adotante" | "admin";
};

export default function AnimalsPage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const role = localStorage.getItem("role");
      const token = localStorage.getItem("token");
      
      if (!token || role !== "admin") {
        router.push("/auth/login");
        return false;
      }
      
      return true;
    };

    if (!checkAuth()) {
      setIsCheckingAuth(false);
      return;
    }

    async function loadAnimals() {
      try {
        const token = localStorage.getItem("token");
        
        // 🔥 TENTA A ROTA DE ADMIN PRIMEIRO
        const res = await fetch("http://localhost:3003/admin/animals", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          cache: "no-store",
        });

        // Se a rota admin falhar, tenta a rota pública
        if (!res.ok && res.status === 404) {
          const publicRes = await fetch("http://localhost:3003/animals", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            cache: "no-store",
          });
          
          if (!publicRes.ok) {
            if (publicRes.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              router.push("/auth/login");
              return;
            }
            setAnimals([]);
            return;
          }
          
          const data = await publicRes.json();
          processAnimalData(data);
        } else if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            router.push("/auth/login");
            return;
          }
          setAnimals([]);
          return;
        } else {
          const data = await res.json();
          processAnimalData(data);
        }
      } catch (err) {
        console.error("Erro ao carregar animais:", err);
        setAnimals([]);
      } finally {
        setLoadingAnimals(false);
        setIsCheckingAuth(false);
      }
    }

    function processAnimalData(data: any) {
      let animalsArray: Animal[] = [];
      
      if (Array.isArray(data)) {
        animalsArray = data;
      } else if (data && Array.isArray(data.items)) {
        animalsArray = data.items;
      } else if (data && Array.isArray(data.animals)) {
        animalsArray = data.animals;
      }
      
      // 🔥 CORRIGE O CAMPO DE FOTO (main_photo_url → mainPhotoUrl)
      const normalizedAnimals = animalsArray.map((animal: any) => ({
        id: animal.id,
        name: animal.name || 'Sem nome',
        species: animal.species || 'Não especificado',
        age: animal.age || 0,
        mainPhotoUrl: animal.mainPhotoUrl || animal.main_photo_url || null,
        status: animal.status || 'available'
      }));
      
      setAnimals(normalizedAnimals);
    }

    async function loadUserRole() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:3003/users/me", {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (res.ok) {
          const data: UserMe = await res.json();
          if (data.role === "admin") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar role:", err);
      }
    }

    loadAnimals();
    loadUserRole();
  }, [router]);

  // 🔥 FUNÇÃO PARA FORMATAR STATUS
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "reserved": return "bg-yellow-100 text-yellow-800";
      case "adopted": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "available": return "Disponível";
      case "reserved": return "Reservado";
      case "adopted": return "Adotado";
      default: return "Desconhecido";
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#419DB0] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");
  if (!token || role !== "admin") {
    return null;
  }

  const isEmpty = !loadingAnimals && animals.length === 0;

  if (loadingAnimals) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Animais para Adoção
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-semibold shadow hover:bg-gray-300 transition"
            >
              ← Dashboard
            </Link>
            {isAdmin && (
              <Link
                href="/admin/animals/register"
                className="px-4 py-2 rounded-lg bg-[#419DB0] text-white text-sm font-semibold shadow hover:bg-[#337d8f] transition"
              >
                Cadastrar animal
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#419DB0]"></div>
          <p className="text-gray-500">Carregando animais...</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-20 px-4">
        <h2 className="text-3xl font-bold text-gray-700 mb-2">
          Nenhum animal encontrado 😢
        </h2>
        <p className="text-gray-500 mb-6">
          Tente novamente mais tarde ou verifique o servidor.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/admin/dashboard"
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold shadow hover:bg-gray-300 transition"
          >
            ← Voltar ao Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin/animals/register"
              className="px-6 py-3 rounded-lg bg-[#419DB0] text-white font-semibold shadow hover:bg-[#337d8f] transition"
            >
              Cadastrar animal
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Gerenciamento de Animais
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-semibold shadow hover:bg-gray-300 transition"
          >
            ← Dashboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin/animals/register"
              className="px-4 py-2 rounded-lg bg-[#419DB0] text-white text-sm font-semibold shadow hover:bg-[#337d8f] transition"
            >
              Cadastrar animal
            </Link>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">🐾</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-2xl font-bold text-gray-800">{animals.length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">✅</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Disponíveis</p>
            <p className="text-2xl font-bold text-green-700">{animals.filter(a => a.status === "available").length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-xl">🏠</div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Reservados/Adotados</p>
            <p className="text-2xl font-bold text-yellow-700">{animals.filter(a => a.status !== "available").length}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {animals.map((animal) => (
          <Link
            key={animal.id}
            href={`/admin/animals/${animal.id}`}
            className="group bg-white shadow rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-1 border border-gray-100"
          >
            <div className="relative">
              <img
                src={animal.mainPhotoUrl ?? "/placeholder.jpg"}
                alt={animal.name}
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
              />
              <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(animal.status)}`}>
                {getStatusText(animal.status)}
              </span>
            </div>
            <div className="p-4">
              <h2 className="text-base font-bold text-gray-800 truncate">{animal.name}</h2>
              <p className="text-gray-500 text-sm mt-1">{animal.species} • {animal.age} anos</p>
              <span className="mt-3 inline-block text-[#419DB0] text-sm font-semibold group-hover:underline">
                Ver detalhes →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}