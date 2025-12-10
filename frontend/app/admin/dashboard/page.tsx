"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🛡️ Proteção de rota para admin
  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    if (!token || role !== "admin") {
      router.push("/auth/login");
    }
  }, [router]);

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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* HEADER */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Meu <span className="text-[#419DB0]">Painel</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas informações e cadastros de produtos e animais.
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

          {/* AÇÕES PARA ADMIN */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Registrar Animal */}
            <a
              href="/admin/animals/register"
              className="
                bg-white border rounded-2xl shadow-md p-6 
                hover:shadow-lg transition flex items-center gap-4
              "
            >
              <div className="text-4xl">🐾</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Registrar Animal
                </h3>
                <p className="text-sm text-gray-600">
                  Cadastre novos animais para adoção.
                </p>
              </div>
            </a>

            {/* Card Listar Animais */}
            <a
              href="/admin/animals"
              className="
                bg-white border rounded-2xl shadow-md p-6 
                hover:shadow-lg transition flex items-center gap-4
              "
            >
              <div className="text-4xl">📋</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Listar Animais
                </h3>
                <p className="text-sm text-gray-600">
                  Veja todos os animais cadastrados.
                </p>
              </div>
            </a>

            {/* NOVO CARD: Gerenciar Adotantes */}
            <a
              href="/admin/adotante-admin"
              className="
                bg-white border rounded-2xl shadow-md p-6 
                hover:shadow-lg transition flex items-center gap-4
              "
            >
              <div className="text-4xl">👥</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Gerenciar Adotantes
                </h3>
                <p className="text-sm text-gray-600">
                  Visualize e gerencie os adotantes.
                </p>
              </div>
            </a>

          </div>

        </div>
      )}
    </div>
  );
}