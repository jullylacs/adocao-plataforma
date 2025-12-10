"use client";

import { useEffect, useState } from "react";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function loadReservations() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3003/reservations/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setReservations(data);
        }
      } catch (e) {
        console.error("Erro ao carregar reservas:", e);
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">
          Minhas <span className="text-[#419DB0]">Reservas</span>
        </h1>
        <p className="text-gray-600 mt-1">
          Aqui você pode acompanhar seus pedidos de adoção.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow p-6 animate-pulse border"
            >
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center border">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-700">Nenhuma reserva ainda</h2>
          <p className="text-gray-500 mt-1">
            Quando você reservar um animal, ele aparecerá aqui.
          </p>
        </div>
      )}

      {!loading && reservations.length > 0 && (
        <ul className="space-y-4">
          {reservations.map((res) => (
            <li
              key={res.id}
              className="
                bg-white border rounded-xl shadow-sm p-6
                hover:shadow-md transition cursor-pointer
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    🐾 {res.animal?.name}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        res.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : res.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {res.status}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 mt-2">
                    Criado em: {new Date(res.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
