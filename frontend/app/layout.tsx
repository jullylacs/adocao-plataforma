import "./css/globals.css";
import "./css/pages.css";
import "./css/components.css";
import React from "react";
import Header from "./components/Header";

export const metadata = {
  title: "HappyPet – Adoção de Animais",
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
        <Header />

        <main className="flex-1 w-full">
          {children}
        </main>

        <footer className="bg-gray-900 text-white pt-12 pb-6 mt-auto">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-10 mb-10">
              {/* Marca */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-[#419DB0] rounded-full flex items-center justify-center shadow">
                    <span className="text-white text-sm font-bold">HP</span>
                  </div>
                  <span className="text-lg font-extrabold text-[#FFEBAF] tracking-tight">HappyPet</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Conectando animais a lares amorosos. Cada adoção é uma nova história de amor e esperança.
                </p>
              </div>

              {/* Navegação */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Navegação</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/" className="text-gray-400 hover:text-[#5ab8cc] transition-colors">Início</a>
                  </li>
                  <li>
                    <a href="/adotante/animals" className="text-gray-400 hover:text-[#5ab8cc] transition-colors">Ver Animais</a>
                  </li>
                  <li>
                    <a href="/auth/login" className="text-gray-400 hover:text-[#5ab8cc] transition-colors">Entrar</a>
                  </li>
                  <li>
                    <a href="/auth/register" className="text-gray-400 hover:text-[#5ab8cc] transition-colors">Cadastrar-se</a>
                  </li>
                </ul>
              </div>

              {/* Causa */}
              <div>
                <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Nossa Causa</h4>
                <p className="text-gray-400 text-sm leading-relaxed">
                  O abandono animal é um problema sério no Brasil. Juntos podemos mudar essa realidade, adotando com responsabilidade e amor.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} HappyPet. Feito com ❤️ para os animais.
              </p>
              <p className="text-gray-600 text-xs">Adote. Não compre.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
