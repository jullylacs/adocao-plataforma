"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          Gerencie suas informações, reservas e agendamentos.
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

          {/* AÇÕES */}
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="/dashboard/reservations"
              className="
                bg-white border rounded-2xl shadow-md p-6 
                hover:shadow-lg transition flex items-center gap-4
              "
            >
              <div className="text-4xl">📌</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Minhas Reservas
                </h3>
                <p className="text-sm text-gray-600">
                  Acompanhe seus pedidos de adoção.
                </p>
              </div>
            </a>

            <a
              href="/dashboard/appointments"
              className="
                bg-white border rounded-2xl shadow-md p-6 
                hover:shadow-lg transition flex items-center gap-4
              "
            >
              <div className="text-4xl">📅</div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Meus Agendamentos
                </h3>
                <p className="text-sm text-gray-600">
                  Veja suas visitas e horários confirmados.
                </p>
              </div>
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
