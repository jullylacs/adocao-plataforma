'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function NewReservationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const animalId = searchParams.get('animalId');
  const [animal, setAnimal] = useState<any>(null);
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

    const res = await fetch('http://localhost:3306/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ animalId: Number(animalId) }),
    });

    if (!res.ok) {
      setError('Erro ao criar reserva');
      return;
    }

    router.push('/dashboard/reservations');
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded shadow p-4">
      <h1 className="text-xl font-bold mb-2">Nova reserva</h1>
      {animal && (
        <p className="text-sm mb-2">
          Reservando: <strong>{animal.name}</strong>
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs text-gray-600">
          Ao confirmar, sua reserva será enviada como PENDENTE para análise do administrador.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded text-sm"
        >
          Confirmar reserva
        </button>
      </form>
    </div>
  );
}