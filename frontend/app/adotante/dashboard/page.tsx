"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    if (!token) { setLoading(false); return; }

    fetch("http://localhost:3003/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setUser(data);
          if (data.role === "adotante") loadInterestedAnimals(token);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function loadInterestedAnimals(token: string) {
    setLoadingAnimals(true);
    try {
      const res = await fetch("http://localhost:3003/users/me/interested-animals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setInterestedAnimals(await res.json() ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnimals(false);
    }
  }

  const statusLabel: Record<string, string> = {
    available: "Disponível",
    reserved: "Reservado",
    adopted: "Adotado",
  };
  const statusColor: Record<string, string> = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-yellow-100 text-yellow-800",
    adopted: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fadeIn">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Meu <span className="text-[#419DB0]">Painel</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Gerencie seus interesses e encontre seu novo amigo.</p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl shadow p-6 animate-pulse border mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Not logged */}
      {!loading && !user && (
        <div className="bg-white rounded-2xl shadow p-10 text-center border">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-700">Acesso restrito</h2>
          <p className="text-gray-500 mt-2 text-sm">Você precisa entrar para acessar o painel.</p>
          <a
            href="/auth/login"
            className="inline-block mt-6 px-6 py-2.5 rounded-lg bg-[#419DB0] text-white font-semibold text-sm hover:bg-[#337d8f] transition shadow"
          >
            Fazer login
          </a>
        </div>
      )}

      {/* Dashboard */}
      {!loading && user && (
        <div className="space-y-8">

          {/* Profile card */}
          <div className="bg-white shadow border rounded-2xl p-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#419DB0] to-[#2e7a8a] flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-800 truncate">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#419DB0]/10 text-[#2e7a8a] text-xs font-bold uppercase tracking-wider">
              {user.role}
            </span>
          </div>

          {/* Quick action */}
          {user.role === "adotante" && (
            <>
              <a
                href="/adotante/animals"
                className="group flex items-center gap-5 bg-white border rounded-2xl shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#419DB0] to-[#2e7a8a] flex items-center justify-center text-2xl shadow flex-shrink-0">
                  🐾
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 group-hover:text-[#419DB0] transition-colors">
                    Ver Animais para Adoção
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Conheça os animais disponíveis e demonstre seu interesse.
                  </p>
                </div>
                <span className="ml-auto text-gray-300 group-hover:text-[#419DB0] text-xl transition-colors">→</span>
              </a>

              {/* Interested animals */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-800">Meus Animais de Interesse</h2>
                  {interestedAnimals.length > 0 && (
                    <span className="text-sm text-gray-500">{interestedAnimals.length} animal(is)</span>
                  )}
                </div>

                {loadingAnimals ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-white border rounded-xl overflow-hidden animate-pulse">
                        <div className="h-40 bg-gray-200" />
                        <div className="p-4 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : interestedAnimals.length === 0 ? (
                  <div className="bg-white border rounded-2xl p-10 text-center">
                    <div className="text-5xl mb-3">❤️</div>
                    <h3 className="font-semibold text-gray-700 mb-1">Nenhum interesse registrado</h3>
                    <p className="text-gray-500 text-sm mb-5">
                      Você ainda não demonstrou interesse em nenhum animal.
                    </p>
                    <a
                      href="/adotante/animals"
                      className="inline-block px-5 py-2.5 bg-[#419DB0] text-white rounded-lg hover:bg-[#337d8f] transition font-medium text-sm"
                    >
                      Explorar animais disponíveis
                    </a>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {interestedAnimals.map((animal) => (
                      <div key={animal.id} className="bg-white border rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="relative h-40">
                          <img
                            src={animal.mainPhotoUrl || "/placeholder.jpg"}
                            alt={animal.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                          />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[animal.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {statusLabel[animal.status] ?? animal.status}
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-800 truncate">{animal.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {animal.species} • {animal.age} ano(s)
                          </p>
                          <Link
                            href={`/adotante/animals/${animal.id}`}
                            className="block w-full text-center mt-3 px-3 py-1.5 text-sm bg-gray-50 border text-gray-700 rounded-lg hover:bg-[#419DB0] hover:text-white hover:border-[#419DB0] transition-colors"
                          >
                            Ver detalhes
                          </Link>
                        </div>
                      </div>
                    ))}
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
