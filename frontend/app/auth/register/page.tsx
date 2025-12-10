"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3003/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });

      if (!res.ok) {
        setError("Erro ao cadastrar. Verifique os dados e tente novamente.");
        return;
      }

      const data = await res.json();

      // Salvar token
      localStorage.setItem("token", data.access_token);

      // 📌 Pegamos a role retornada pelo backend
      const userRole = data.user?.role;

      if (userRole) {
        // salvar role no navegador
        localStorage.setItem("role", userRole);

        // 📌 Mapa de redirecionamento por role (igual ao login)
        const roleRoutes: Record<string, string> = {
          admin: "/admin/dashboard",
          adotante: "/adotante/dashboard",
        };

        const route = roleRoutes[userRole];

        if (route) {
          router.push(route);
          return;
        }
      }

      // fallback caso role não exista
      router.push("/auth/login");

    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao registrar. Tente novamente.");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a] px-4 py-10"
    >
      <div
        className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl 
        p-8 border border-gray-200 animate-fadeIn"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#419DB0] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">Criar Conta 🐾</h1>
          <p className="text-gray-600 text-sm mt-1">
            Preencha os dados para começar
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome completo</label>
            <input
              type="text"
              required
              placeholder="Ex: Maria Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full mt-1 px-3 py-2 text-sm border rounded-lg 
                focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]
                outline-none transition
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="
                w-full mt-1 px-3 py-2 text-sm border rounded-lg 
                focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]
                outline-none transition
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full mt-1 px-3 py-2 text-sm border rounded-lg 
                focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]
                outline-none transition
              "
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full mt-1 px-3 py-2 text-sm border rounded-lg 
                focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]
                outline-none transition
              "
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="
              w-full py-2.5 rounded-lg text-white font-semibold text-sm 
              bg-[#419DB0] hover:bg-[#337d8f] shadow 
              transition-all
            "
          >
            Cadastrar
          </button>
        </form>

        {/* FOOTER */}
        <p className="text-sm text-center text-gray-600 mt-6">
          Já tem conta?{" "}
          <a
            href="/auth/login"
            className="text-[#419DB0] font-semibold hover:underline"
          >
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
