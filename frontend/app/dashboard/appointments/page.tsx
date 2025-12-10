"use client";

import { useEffect, useState } from "react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function loadAppointments() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:3003/appointments/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error("Erro ao carregar agendamentos", err);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  function statusColor(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "CONFIRMED":
        return "bg-green-100 text-green-700 border-green-300";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-600 border-gray-300";
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

      {/* HEADER */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Meus <span className="text-[#419DB0]">Agendamentos</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Acompanhe seus agendamentos de visitas e adoções 🐾
        </p>
      </div>

      {/* LISTA */}
      <div className="space-y-6">
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border bg-white shadow animate-pulse"
              >
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow border">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">
              Nenhum agendamento ainda
            </h3>
            <p className="text-gray-500">
              Assim que você fizer um agendamento, ele aparecerá aqui.
            </p>
          </div>
        )}

        {!loading &&
          appointments.map((a) => (
            <div
              key={a.id}
              className="bg-white border rounded-2xl shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  🐾 {a.animal?.name}
                </h2>

                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColor(
                    a.status
                  )}`}
                >
                  {a.status === "PENDING" && "Pendente"}
                  {a.status === "CONFIRMED" && "Confirmado"}
                  {a.status === "CANCELLED" && "Cancelado"}
                </span>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="flex items-center gap-2">
                  <span className="text-lg">📌</span> Tipo:{" "}
                  <b>{a.type === "VISIT" ? "Visita" : "Adoção / Reserva"}</b>
                </p>

                <p className="flex items-center gap-2">
                  <span className="text-lg">📅</span> Data:{" "}
                  {new Date(a.date_time).toLocaleString()}
                </p>

                <p className="flex items-center gap-2">
                  <span className="text-lg">📍</span> Local:{" "}
                  <b>{a.location}</b>
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
