import "./css/globals.css";
import "./css/pages.css";
import "./css/components.css";
import React from "react";

export const metadata = {
  title: "Adoção de Animais",
  description: "Plataforma de adoção de animais",
  icons: {
    icon: "/logo pet-Photoroom.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo pet-Photoroom.png" type="image/png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <header className="w-full bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto py-4 flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="text-xl font-bold text-[#419DB0] flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              HappyPet
            </a>

            <nav className="space-x-6 text-sm font-medium flex items-center">
              {/* Link para Animais (visível para todos) */}
              <a href="/adotante/animals" className="hover:text-[#419DB0] transition-colors">
                Animais
              </a>

              {/* Botão Único - Sempre mostra "Entrar" */}
              <a
                href="/auth/login"
                className="bg-[#419DB0] text-white px-4 py-2 rounded-lg hover:bg-[#2e7a8a] transition-colors"
              >
                Entrar
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto py-6 w-full">
          {children}
        </main>

        <footer className="bg-gray-900 text-white py-8 mt-auto">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-0 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-x2 font-bold text-[#FFEBAF]">HappyPet</span>
            </div>

            <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
              Conectando animais a lares amorosos. Cada adoção é uma nova história.
            </p>

            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} HappyPet.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}