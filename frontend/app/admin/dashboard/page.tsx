"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    fetch("http://localhost:3003/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setUser(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const actions = [
    {
      href: "/admin/animals/register",
      icon: "🐾",
      label: "Registrar Animal",
      desc: "Cadastre novos animais para adoção.",
      color: "from-[#419DB0] to-[#2e7a8a]",
    },
    {
      href: "/admin/animals",
      icon: "📋",
      label: "Listar Animais",
      desc: "Veja e gerencie todos os animais.",
      color: "from-violet-500 to-purple-600",
    },
    {
      href: "/admin/adotante-admin",
      icon: "👥",
      label: "Gerenciar Adotantes",
      desc: "Visualize e gerencie os adotantes.",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fadeIn">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Painel <span className="text-[#419DB0]">Administrativo</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Gerencie animais e adotantes da plataforma.</p>
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
                {user.name?.[0]?.toUpperCase() ?? "A"}
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

          {/* Action cards */}
          <div>
            <h2 className="text-base font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Ações rápidas
            </h2>
            <div className="grid md:grid-cols-3 gap-5">
              {actions.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  className="group bg-white border rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl shadow`}>
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-[#419DB0] transition-colors">
                      {a.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{a.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
