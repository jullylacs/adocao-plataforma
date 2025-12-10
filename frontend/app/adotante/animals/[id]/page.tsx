"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Animal = {
  id: number;
  name: string;
  species: string;
  age: number;
  description: string;
  mainPhotoUrl?: string | null;
  status: "available" | "reserved" | "adopted";
};

// REMOVIDO: campo type, location - apenas date e time são necessários
type AppointmentForm = {
  date: string;
  time: string;
};

export default function AnimalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const animalId = params?.id;

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [loading, setLoading] = useState(true);
  const [interested, setInterested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  // REMOVIDO: location e type - apenas date e time
  const [appointment, setAppointment] = useState<AppointmentForm>({
    date: "",
    time: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log("Animal ID from params:", animalId);
    console.log("Type of animalId:", typeof animalId);

    async function fetchAnimal() {
      try {
        if (!animalId || animalId === "undefined") {
          setError("ID do animal inválido");
          setLoading(false);
          return;
        }

        const id = Number(animalId);
        if (isNaN(id)) {
          setError("ID do animal não é um número válido");
          setLoading(false);
          return;
        }

        console.log(`Buscando animal com ID: ${id}...`);
        
        const res = await fetch(`http://localhost:3003/animals/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store"
        });

        console.log("Response status:", res.status);

        if (!res.ok) {
          const errorText = await res.text();
          console.error("Erro na resposta:", errorText);
          
          if (res.status === 404) {
            setError("Animal não encontrado");
          } else {
            setError(`Erro ${res.status}: ${errorText}`);
          }
          setAnimal(null);
          return;
        }

        const data: Animal = await res.json();
        console.log("Dados recebidos:", data);
        setAnimal(data);
        
        // Verificar se usuário já demonstrou interesse
        await checkIfInterested(id);
        
      } catch (err) {
        console.error("Erro ao conectar à API de animal:", err);
        setError("Erro de conexão com o servidor");
      } finally {
        setLoading(false);
      }
    }

    fetchAnimal();
  }, [animalId]);

  async function checkIfInterested(animalId: number) {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("http://localhost:3003/users/me/interested-animals", {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (res.ok) {
        const interestedAnimals = await res.json();
        const isAlreadyInterested = interestedAnimals.some(
          (animal: any) => animal.id === animalId
        );
        setInterested(isAlreadyInterested);
      }
    } catch (err) {
      console.error("Erro ao verificar interesses:", err);
    }
  }

  async function markInterest() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Faça login para marcar interesse.");
        router.push("/auth/login");
        return;
      }

      const res = await fetch(`http://localhost:3003/users/me/interested-animals/${animalId}`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || "Erro ao marcar interesse.");
        return;
      }

      setInterested(true);
      alert("Interesse registrado com sucesso!");
      
      // Recarregar interesses
      if (animal) {
        await checkIfInterested(animal.id);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao marcar interesse.");
    }
  }

  async function removeInterest() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`http://localhost:3003/users/me/interested-animals/${animalId}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setInterested(false);
        alert("Interesse removido com sucesso!");
        
        if (animal) {
          await checkIfInterested(animal.id);
        }
      } else {
        alert("Erro ao remover interesse.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao remover interesse.");
    }
  }

  const handleAppointmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VALIDAÇÃO SIMPLIFICADA: apenas data e hora são obrigatórios
    if (!appointment.date || !appointment.time) {
      alert("Por favor, preencha a data e horário da visita");
      return;
    }

    // Validar se a data é futura
    const selectedDate = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    if (selectedDate <= now) {
      alert("Por favor, selecione uma data e horário futuros");
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Faça login para agendar um encontro");
        router.push("/auth/login");
        return;
      }

      // Verificar se animal é válido
      if (!animal) {
        alert("Animal não encontrado");
        return;
      }

      // Formatar data para ISO string
      const dateTime = new Date(`${appointment.date}T${appointment.time}:00`);
      const isoDateTime = dateTime.toISOString();
      
      console.log("Enviando agendamento:", {
        animalId: animal.id,
        date_time: isoDateTime,
        location: "Abrigo Principal", // Valor padrão fixo
        type: "adoption_visit" // Valor padrão fixo
      });

      // Criar agendamento com valores padrão
      const res = await fetch(`http://localhost:3003/appointments`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animalId: animal.id,
          date_time: isoDateTime,
          location: "Abrigo Principal", // Valor fixo
          type: "adoption_visit" // Valor fixo
        }),
      });

      if (!res.ok) {
        let errorMessage = "Erro ao agendar encontro";
        
        try {
          const errorData = await res.json();
          console.error("Erro do backend:", errorData);
          
          // Mapear mensagens de erro específicas
          if (errorData.message?.includes("agendamento pendente")) {
            errorMessage = "Você já tem um agendamento pendente para este animal";
          } else if (errorData.message?.includes("não está disponível")) {
            errorMessage = "Este animal não está disponível para adoção";
          } else if (errorData.message?.includes("conflito de horário")) {
            errorMessage = "Já existe um agendamento próximo a este horário para este animal";
          } else {
            errorMessage = errorData.message || `Erro ${res.status}: ${res.statusText}`;
          }
        } catch {
          errorMessage = `Erro ${res.status}: ${res.statusText}`;
        }
        
        alert(errorMessage);
        return;
      }

      const result = await res.json();
      console.log("Agendamento criado:", result);
      
      setSuccess(true);
      // Resetar apenas os campos que existem no formulário
      setAppointment({
        date: "",
        time: "",
      });
      
      alert("Agendamento solicitado com sucesso! Aguarde a confirmação do abrigo.");
      setShowAppointmentForm(false);
      
    } catch (err) {
      console.error("Erro ao agendar:", err);
      alert("Erro ao agendar encontro. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  // Data mínima: amanhã
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Data máxima: 30 dias a partir de hoje
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-center">
        <p className="text-gray-500">Carregando informações do animal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <Link
            href="/adotante/dashboard"
            className="inline-flex items-center text-[#419DB0] hover:text-[#337d8f] font-medium"
          >
            ← Voltar para o Dashboard
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center text-red-700 font-medium mb-4">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-center">
        <div className="mb-6">
          <Link
            href="/adotante/dashboard"
            className="inline-flex items-center text-[#419DB0] hover:text-[#337d8f] font-medium"
          >
            ← Voltar para o Dashboard
          </Link>
        </div>
        <p className="text-gray-500">Animal não encontrado 😢</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* BOTÃO VOLTAR AO DASHBOARD */}
      <div className="mb-6">
        <Link
          href="/adotante/dashboard"
          className="inline-flex items-center text-[#419DB0] hover:text-[#337d8f] font-medium"
        >
          ← Voltar para o Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* LADO ESQUERDO: IMAGEM */}
        <div className="md:w-1/2 flex justify-center items-start">
          <img
            src={animal.mainPhotoUrl ?? "/placeholder.jpg"}
            alt={animal.name}
            className="w-full h-auto max-h-[500px] object-cover rounded-2xl shadow-lg"
          />
        </div>

        {/* LADO DIREITO: INFORMAÇÕES E INTERAÇÕES */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-gray-800">{animal.name}</h1>

          <div className="flex flex-col gap-2">
            <p className="text-gray-600"><strong>Espécie:</strong> {animal.species}</p>
            <p className="text-gray-600"><strong>Idade:</strong> {animal.age} anos</p>
            <p className={`text-sm font-semibold ${
              animal.status === "available"
                ? "text-green-600"
                : animal.status === "reserved"
                ? "text-yellow-600"
                : "text-red-600"
            }`}>
              <strong>Status:</strong>{" "}
              {animal.status === "available"
                ? "Disponível"
                : animal.status === "reserved"
                ? "Reservado"
                : "Adotado"}
            </p>
          </div>

          <div className="mt-4 text-gray-700">
            <h2 className="text-xl font-semibold mb-2">Descrição</h2>
            <p>{animal.description}</p>
          </div>

          {/* BOTÕES DE INTERAÇÃO */}
          <div className="mt-6 space-y-3">
            {animal.status === "available" && (
              <>
                {!interested ? (
                  <button
                    onClick={markInterest}
                    className="w-full px-6 py-3 rounded-lg bg-[#419DB0] text-white font-semibold hover:bg-[#337d8f] transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Tenho Interesse
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Interesse registrado</span>
                    </div>
                    <button
                      onClick={removeInterest}
                      className="w-full px-6 py-3 rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50 transition"
                    >
                      Remover Interesse
                    </button>
                  </div>
                )}

                {!showAppointmentForm ? (
                  <button
                    onClick={() => setShowAppointmentForm(true)}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Agendar Visita
                  </button>
                ) : (
                  <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Agendar Visita</h3>
                      <button
                        onClick={() => setShowAppointmentForm(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSubmitAppointment} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data da Visita *
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={appointment.date}
                          onChange={handleAppointmentChange}
                          min={minDate}
                          max={maxDateStr}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Selecione uma data entre {tomorrow.toLocaleDateString('pt-BR')} e {maxDate.toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horário *
                        </label>
                        <input
                          type="time"
                          name="time"
                          value={appointment.time}
                          onChange={handleAppointmentChange}
                          min="09:00"
                          max="17:00"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#419DB0] focus:border-[#419DB0]"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Horário de funcionamento: 09:00 às 17:00
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="font-medium text-blue-800 mb-1">Informações do Agendamento</p>
                        <p className="text-blue-700">
                          • Local: Abrigo Principal (padrão)<br/>
                          • Tipo: Visita para Conhecer o Animal (padrão)<br/>
                          • Status Inicial: Pendente de confirmação
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAppointmentForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          disabled={submitting}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 px-4 py-2 bg-[#419DB0] text-white rounded-lg hover:bg-[#337d8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <span className="flex items-center justify-center">
                              <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Solicitando...
                            </span>
                          ) : "Solicitar Agendamento"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            )}

            {animal.status === "reserved" && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                <p className="text-yellow-700 font-medium">
                  ⏳ Este animal está em processo de adoção por outra pessoa.
                </p>
              </div>
            )}

            {animal.status === "adopted" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-medium">
                  ✅ Este animal já foi adotado e encontrou um lar!
                </p>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-2">📋 Processo de Adoção</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. Demonstre interesse no animal</li>
              <li>2. Agende uma visita para conhecê-lo</li>
              <li>3. Preencha o formulário de adoção</li>
              <li>4. Aguarde a análise e aprovação</li>
              <li>5. Finalize a adoção e leve seu novo amigo para casa!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}