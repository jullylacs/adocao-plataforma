'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function NewAppointmentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const animalId = searchParams.get('animalId');
  const [animal, setAnimal] = useState<any>(null);
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('ONG Central');
  const [type, setType] = useState<'visit' | 'pickup'>('visit');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnimal() {
      if (!animalId) return;
      const res = await fetch(`http://localhost:3003/animals/${animalId}`);
      if (res.ok) {
        const data = await res.json();
        setAnimal(data);
      }
    }
    loadAnimal();
  }, [animalId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Você precisa estar logado');
      return;
    }

    const res = await fetch('http://localhost:3306/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ animalId: Number(animalId), date_time: dateTime, location, type }),
    });

    if (!res.ok) {
      setError('Erro ao criar agendamento');
      return;
    }

    router.push('/dashboard/appointments');
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-4">
      <h1 className="text-xl font-bold mb-2">Novo agendamento</h1>
      {animal && (
        <p className="text-sm mb-2">
          Agendando para: <strong>{animal.name}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1 text-sm">
          <label>Data e hora</label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1 text-sm">
          <label>Local</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="space-y-1 text-sm">
          <label>Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="visit">Visita</option>
            <option value="pickup">Retirada / Adoção</option>
          </select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded text-sm"
        >
          Confirmar agendamento
        </button>
      </form>
    </div>
  );
}