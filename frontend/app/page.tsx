"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Animal = {
  id: string;
  name: string;
  species?: string;
  age?: number;
  mainPhotoUrl?: string;
  description?: string;
};

export default function HomePage() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carouselImages = [
    {
      src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1280&h=640&fit=crop&q=85",
      title: "Adote. Não compre.",
      description: "Milhares de animais aguardam um lar amoroso — seja a diferença.",
    },
    {
      src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1280&h=640&fit=crop&q=85",
      title: "Todo animal merece amor",
      description: "Encontre seu novo companheiro e transforme duas vidas de uma vez.",
    },
    {
      src: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1280&h=640&fit=crop&q=85",
      title: "Felicidade de quatro patas",
      description: "Um cão ou gato pode mudar completamente a sua rotina — para melhor.",
    },
    {
      src: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1280&h=640&fit=crop&q=85",
      title: "Pequenos, mas cheios de vida",
      description: "Cada animal tem uma personalidade única esperando ser descoberta.",
    },
    {
      src: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1280&h=640&fit=crop&q=85",
      title: "Um novo começo",
      description: "Dar um lar a um animal abandonado é um dos maiores gestos de amor.",
    },
    {
      src: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1280&h=640&fit=crop&q=85",
      title: "Eles esperam por você",
      description: "Venha conhecer nossos amigos e encontre seu parceiro ideal.",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchFeatured() {
      try {
        setIsLoading(true);
        const res = await fetch("http://localhost:3003/animals?limit=6", { cache: "no-store" });
        if (!res.ok) {
          if (mounted) setAnimals([]);
          return;
        }
        const data = await res.json();
        if (mounted) setAnimals(data.items ?? []);
      } catch {
        if (mounted) setAnimals([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    fetchFeatured();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="pb-16">

      {/* ── HERO ── */}
      <section className="relative bg-gradient-to-br from-[#419DB0] via-[#5ab8cc] to-[#2e7a8a] text-white py-28 px-6 overflow-hidden hero-particles">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <div className="float-animation">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight tracking-tight">
              Adote com <span className="text-[#FFEBAF]">amor</span> e mude uma vida
            </h1>
          </div>
          <p className="text-lg md:text-xl opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Conectamos animais que precisam de um lar com pessoas dispostas a dar todo o carinho que eles merecem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/adotante/animals" className="btn-primary glow-effect text-base px-8 py-4">
              🐾 Ver animais disponíveis
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-4 rounded-full font-semibold border-2 border-white text-white hover:bg-white hover:text-[#419DB0] transition-all duration-300 text-base"
            >
              Criar conta grátis
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {[
              { value: "20M+", label: "Animais nas ruas" },
              { value: "177k", label: "Em abrigos" },
              { value: "100%", label: "Com amor" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-[#FFEBAF]">{s.value}</p>
                <p className="text-xs text-white/80 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARROSSEL ── */}
      <section className="max-w-6xl mx-auto px-6 mt-14">
        <div className="relative w-full h-80 md:h-[420px] rounded-2xl overflow-hidden shadow-2xl">
          {carouselImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={slide.src}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Gradiente inferior forte + lateral suave */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />

              {/* Texto centralizado na parte inferior */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-8">
                <div className="max-w-lg">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg leading-tight mb-1">
                    {slide.title}
                  </h2>
                  <p className="text-sm md:text-base text-white/85 drop-shadow font-medium">
                    {slide.description}
                  </p>
                </div>
              </div>

              {/* Contador de slide */}
              <div className="absolute top-4 right-4 z-10 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                {index + 1} / {carouselImages.length}
              </div>
            </div>
          ))}

          {/* Botão anterior */}
          <button
            onClick={() => setCurrentSlide((p) => (p === 0 ? carouselImages.length - 1 : p - 1))}
            className="absolute top-1/2 left-3 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Slide anterior"
          >
            ‹
          </button>

          {/* Botão próximo */}
          <button
            onClick={() => setCurrentSlide((p) => (p + 1) % carouselImages.length)}
            className="absolute top-1/2 right-3 -translate-y-1/2 z-20 w-10 h-10 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Próximo slide"
          >
            ›
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-4 right-6 z-20 flex gap-1.5">
            {carouselImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? "bg-white w-7" : "bg-white/45 w-1.5 hover:bg-white/70"
                }`}
                aria-label={`Ir para slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── ANIMAIS EM DESTAQUE ── */}
      {!isLoading && animals.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Animais em <span className="text-gradient">Destaque</span>
            </h2>
            <p className="text-gray-500">Conheça alguns amigos esperando por um lar</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {animals.map((animal) => (
              <Link
                key={animal.id}
                href={`/adotante/animals/${animal.id}`}
                className="animal-card shadow-md hover:shadow-xl block"
              >
                <div className="relative h-48 bg-gray-100">
                  <img
                    src={animal.mainPhotoUrl || "/placeholder.jpg"}
                    alt={animal.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg"; }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-800 truncate">{animal.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {animal.species}{animal.age ? ` • ${animal.age} anos` : ""}
                  </p>
                  <span className="mt-3 inline-block text-[#419DB0] text-sm font-semibold">
                    Saiba mais →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/adotante/animals" className="btn-primary inline-block">
              Ver todos os animais
            </Link>
          </div>
        </section>
      )}

      {/* ── INFORMAÇÕES ── */}
      <section className="max-w-5xl mx-auto px-6 mt-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            O <span className="text-gradient">Problema</span> do Abandono Animal
          </h2>
          <div className="w-16 h-1 bg-[#419DB0] mx-auto mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-red-50 p-5 rounded-xl border-l-4 border-red-500">
            <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ Abandono é Crime</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              No Brasil, o abandono de animais é crime desde 1998. Em 2020, a pena foi aumentada para até 5 anos de reclusão em casos de maus-tratos contra cães e gatos.
            </p>
          </div>

          <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-500">
            <h3 className="text-lg font-bold text-blue-700 mb-2">📊 Cenário Atual</h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-2">
              O Brasil é o 4º no ranking mundial de abandono, com aproximadamente:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 pl-4 list-disc">
              <li><strong>177 mil</strong> cães em abrigos</li>
              <li><strong>20 milhões</strong> vivendo nas ruas</li>
              <li><strong>10 milhões</strong> de gatos abandonados</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-5 rounded-xl border-l-4 border-yellow-500">
            <h3 className="text-lg font-bold text-yellow-700 mb-2">📈 Principais Razões</h3>
            <ul className="text-sm text-gray-700 space-y-1 pl-4 list-disc">
              <li><strong>9.2%</strong> – Mudança de residência</li>
              <li><strong>7.6%</strong> – Dificuldade de cuidar de animais doentes</li>
              <li><strong>7.2%</strong> – Chegada de filhos</li>
              <li><strong>7.1%</strong> – Crescimento inesperado do pet</li>
            </ul>
          </div>

          <div className="bg-green-50 p-5 rounded-xl border-l-4 border-green-500">
            <h3 className="text-lg font-bold text-green-700 mb-2">💡 Alternativas Éticas</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Ao adotar um animal, o tutor assume responsabilidade pela sua vida. Caso não consiga mais cuidar, existem alternativas como abrigos, ONGs e adoção responsável — nunca o abandono.
            </p>
          </div>
        </div>

        <div className="mt-5 bg-[#419DB0]/10 p-6 rounded-xl border border-[#419DB0]/20">
          <h3 className="text-xl font-bold text-[#2e7a8a] mb-2">🚀 Nossa Missão</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            O HappyPet nasceu para enfrentar esse problema: criar uma plataforma que conecte animais de rua a novos lares e facilite a adoção responsável, com toda a transparência e cuidado que os animais merecem.
          </p>
        </div>
      </section>
    </div>
  );
}
