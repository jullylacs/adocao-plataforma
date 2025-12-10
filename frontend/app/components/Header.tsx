"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./css/globals.css";
import "./css/pages.css";
import "./css/components.css";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    async function loadUser() {
      try {
        // Busca os dados do usuário logado pelo token
        const res = await fetch(`http://localhost:3003/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch (e) {
        console.error("Erro no loadUser:", e);
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
    setUser(null);
    router.push("/");
  }

  return (
    <header className="w-full bg-white/90 backdrop-blur shadow-sm sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-10 h-10 bg-[#419DB0] rounded-full flex items-center justify-center shadow">
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Happy<span className="text-[#419DB0]">Pet</span>
          </span>
        </Link>

        {/* NAV */}
        <nav className="flex items-center gap-4 text-[15px]">
          <Link
            href="/animals"
            className="font-medium text-gray-700 hover:text-[#419DB0] transition-colors duration-200"
          >
            🐾 Animais
          </Link>

          {/* Botões Entrar e Cadastrar-se quando não logado */}
          {!loading && !user && (
            <div className="flex gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-white bg-[#419DB0] hover:bg-[#337d8f] transition-all shadow-sm font-medium"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-lg border border-[#419DB0] text-[#419DB0] hover:bg-[#e0f7fb] transition-all shadow-sm font-medium"
              >
                Cadastrar-se
              </Link>
            </div>
          )}

          {/* Perfil do usuário quando logado */}
          {!loading && user && (
            <div className="flex items-center gap-3">
              {/* Círculo de perfil */}
              <div className="w-10 h-10 rounded-full bg-[#419DB0] flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="text-gray-600 font-medium">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-all shadow-sm font-medium text-sm"
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
