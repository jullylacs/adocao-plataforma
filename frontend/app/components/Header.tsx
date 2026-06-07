"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    async function loadUser() {
      try {
        const res = await fetch(`http://localhost:3003/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { localStorage.removeItem("token"); setUser(null); return; }
        setUser(await res.json());
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    router.push("/");
  }

  const isAdmin = user?.role === "admin";

  return (
    <header className="w-full bg-white/95 backdrop-blur shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition shrink-0">
          <div className="w-9 h-9 bg-[#419DB0] rounded-full flex items-center justify-center shadow">
            <span className="text-white text-sm font-extrabold">HP</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Happy<span className="text-[#419DB0]">Pet</span>
          </span>
        </Link>

        {/* Nav principal */}
        <nav className="flex items-center gap-1 text-sm font-medium">

          {/* Links para todos */}
          <Link
            href="/adotante/animals"
            className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#419DB0] hover:bg-[#419DB0]/8 transition-all"
          >
            🐾 Animais
          </Link>

          {/* Links para admin logado */}
          {!loading && isAdmin && (
            <>
              <Link
                href="/admin/animals/register"
                className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#419DB0] hover:bg-[#419DB0]/8 transition-all"
              >
                ➕ Cadastrar Animal
              </Link>
              <Link
                href="/admin/animals"
                className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#419DB0] hover:bg-[#419DB0]/8 transition-all"
              >
                📋 Gerenciar
              </Link>
              <Link
                href="/admin/dashboard"
                className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#419DB0] hover:bg-[#419DB0]/8 transition-all"
              >
                Painel
              </Link>
            </>
          )}

          {/* Links para adotante logado */}
          {!loading && user && !isAdmin && (
            <Link
              href="/adotante/dashboard"
              className="px-3 py-2 rounded-lg text-gray-700 hover:text-[#419DB0] hover:bg-[#419DB0]/8 transition-all"
            >
              Meu Painel
            </Link>
          )}

          {/* Não logado */}
          {!loading && !user && (
            <div className="flex gap-2 ml-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-white bg-[#419DB0] hover:bg-[#337d8f] transition-all shadow-sm"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-lg border border-[#419DB0] text-[#419DB0] hover:bg-[#e0f7fb] transition-all shadow-sm"
              >
                Cadastrar-se
              </Link>
            </div>
          )}

          {/* Usuário logado — avatar + nome + sair */}
          {!loading && user && (
            <div className="flex items-center gap-2 ml-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow shrink-0 ${isAdmin ? "bg-violet-500" : "bg-[#419DB0]"}`}>
                {user.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-gray-800 font-semibold text-sm">{user.name?.split(" ")[0]}</span>
                <span className={`text-xs font-medium ${isAdmin ? "text-violet-500" : "text-[#419DB0]"}`}>
                  {isAdmin ? "Admin" : "Adotante"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-1 px-3 py-1.5 rounded-lg text-red-500 border border-red-200 hover:bg-red-50 transition-all text-xs font-semibold"
              >
                Sair
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
