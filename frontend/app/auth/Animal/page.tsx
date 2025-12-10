"use client";

import { useState } from "react";

export default function RegisterPet() {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("");
  const [raca, setRaca] = useState("");
  const [idade, setIdade] = useState("");
  const [descricao, setdescricao] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const novoPet = {
      nome,
      especie,
      raca,
      idade,
      descricao,
    };

    console.log("Dados do pet:", novoPet);

    alert("Pet cadastrado!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Cadastrar Pet</h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nome */}
          <div>
            <label className="text-sm font-medium">Nome do Pet</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              placeholder="Ex: Luna, Thor..."
            />
          </div>

          {/* Espécie */}
          <div>
            <label className="text-sm font-medium">Espécie</label>
            <select
              required
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
            >
              <option value="">Escolha a espécie</option>
              <option value="Cachorro">Cachorro</option>
              <option value="Gato">Gato</option>
              <option value="Pássaro">Pássaro</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          {/* Raça */}
          <div>
            <label className="text-sm font-medium">Raça</label>
            <input
              type="text"
              required
              value={raca}
              onChange={(e) => setRaca(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              placeholder="Ex: SRD, Poodle..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Idade</label>
            <input
              type="text"
              required
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              placeholder="Ex: 3 anos, 6 meses..."
            />
          </div>

           <div>
            <label className="text-sm font-medium">Descrição</label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setdescricao(e.target.value)}
              className="w-full p-2 border rounded-lg mt-1"
              placeholder="Ex: Um pet carinhoso, brincalhão e muito amigável... "
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >Registrar Pet</button>
        </form>
      </div>
    </div>
  );
}
