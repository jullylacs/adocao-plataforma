"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Animal = {
  id: string;
  name: string;
  species?: string;
  size?: string;
  age?: number;
  mainPhotoUrl?: string;
  description?: string;
};

export default function HomePage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrossel
  const carouselImages = [
    { src: "/img/carrossel/carousel-1.jpg", title: "Bem-vindo!", description: "Conheça nossos amigos que esperam por um lar." },
    { src: "/img/carrossel/carousel-2.png", title: "Adote com amor", description: "Cada adoção muda uma vida." },
    { src: "/img/carrossel/carousel-3.png", title: "Encontre seu amigo", description: "Conectamos pessoas e animais com carinho." },
    { src: "/img/carrossel/carousel-4.png", title: "Faça a diferença", description: "Um gesto de amor transforma vidas." },
    { src: "/img/carrossel/carousel-5.png", title: "Abrace a amizade", description: "Animais esperando por você." },
    { src: "/img/carrossel/carousel-6.png", title: "Novo lar", description: "Ajude um amigo a encontrar um lar." },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Scroll automático do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch de animais em destaque
  useEffect(() => {
    let mounted = true;
    async function fetchFeatured() {
      try {
        setIsLoading(true);
        const res = await fetch("/animals?limit=6", { cache: "no-store" });
        if (!res.ok) {
          if (mounted) setAnimals([]);
          return;
        }
        const data = await res.json();
        if (mounted) setAnimals(data.items ?? []);
      } catch (e) {
        if (mounted) setAnimals([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchFeatured();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="space-y-20 pb-10">
      {/* ================= HERO / BANNER ================= */}
      <section className="relative bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a] text-white py-24 px-6 overflow-hidden hero-particles">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-6xl mx-auto text-center z-10">
          <div className="float-animation">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Adote com <span className="text-[#FFEBAF]">amor</span> e mude uma vida
            </h1>
          </div>
          <p className="text-xl md:text-2xl opacity-95 mb-8 max-w-3xl mx-auto leading-relaxed">
            Conectamos animais que precisam de um lar com pessoas dispostas a dar todo o carinho e cuidado que eles merecem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/admin/animals" className="btn-primary glow-effect text-lg">
              🐾 Ver animais disponíveis
            </Link>
          </div>
        </div>
      </section>

      {/* ================= CARROSSEL ================= */}
      <section className="relative w-full max-w-6xl mx-auto overflow-hidden py-6">
        <div className="relative w-full h-80 md:h-96">
          {carouselImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-center text-white bg-black/30 p-4 rounded-lg">
                <h2 className="text-2xl font-bold">{slide.title}</h2>
                <p className="text-sm mt-1">{slide.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Botão anterior */}
        <button
          onClick={() =>
            setCurrentSlide((prev) =>
              prev === 0 ? carouselImages.length - 1 : prev - 1
            )
          }
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          ‹
        </button>

        {/* Botão próximo */}
        <button
          onClick={() =>
            setCurrentSlide((prev) => (prev + 1) % carouselImages.length)
          }
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
        >
          ›
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-gray-400"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ================= CARD COM TEXTO SOBRE ABANDONO DE ANIMAIS ================= */}
      <section className="px-6 max-w-7xl mx-auto">
        <div className="animal-card p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              O <span className="text-gradient">Problema</span> do Abandono Animal
            </h2>
            <div className="w-24 h-1 bg-[#419DB0] mx-auto mb-6"></div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-red-700 mb-2">⚠️ Abandono é Crime</h3>
              <p>
                O abandono de animais é crime no Brasil desde 1998, sujeito a prisão e multa. Em 2020, uma nova legislação endureceu as punições, aumentando a pena para até cinco anos de reclusão em casos de maus-tratos contra cães e gatos.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-blue-700 mb-2">📊 Cenário Atual</h3>
              <p>
                Apesar das leis, o país ainda enfrenta um grave cenário: é o 4º no ranking mundial de abandono, com cerca de:
              </p>
              <ul className="mt-2 space-y-1 pl-5 list-disc">
                <li><strong>177 mil</strong> cães em abrigos</li>
                <li><strong>20 milhões</strong> vivendo nas ruas</li>
                <li><strong>10 milhões</strong> de gatos abandonados</li>
                <li><strong>7,4 mil</strong> gatos em abrigos</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold text-yellow-700 mb-2">📈 Principais Razões do Abandono</h3>
              <ul className="space-y-2 pl-5 list-disc">
                <li><strong>9.2%</strong> - Mudança de residência</li>
                <li><strong>7.6%</strong> - Dificuldade de cuidar de animais doentes</li>
                <li><strong>7.2%</strong> - Chegada de filhos</li>
                <li><strong>7.1%</strong> - Crescimento inesperado do pet</li>
                <li><strong>6.4%</strong> - Mudanças na rotina dos tutores</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-700 mb-2">💡 Alternativas Éticas</h3>
              <p>
                No entanto, ao adquirir ou adotar um animal, o tutor assume a responsabilidade por sua vida. Caso não consiga mais cuidar, existem alternativas éticas, como abrigos, ONGs e adoção responsável — nunca o abandono.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 mt-8">
              <h3 className="text-xl font-bold text-purple-700 mb-2">🚀 Nossa Missão</h3>
              <p>
                Nosso projeto nasce para enfrentar esse problema: criar uma plataforma que conecte animais de rua a novos lares e facilite a adoção responsável, além de permitir o recebimento de doações, totalmente destinadas ao bem-estar dos animais.
              </p>
              <p className="mt-2">
                A solução também apoiará a equipe de desenvolvimento no planejamento, implementação e testes, garantindo que funcionalidades, interfaces e comportamentos do sistema atendam às necessidades dos usuários e aos objetivos do projeto.
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}