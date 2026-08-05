"use client";

import { useState } from "react";

export default function Home() {
  const [local, setLocal] = useState("");
  const [nichoInput, setNichoInput] = useState("");
  const [resultados, setResultados] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const lidarComBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");
    setResultados(null);

    const nichos = nichoInput.split(",").map((n) => n.trim()).filter(Boolean);

    try {
      // Adicionamos um parametro de tempo para burlar qualquer cache antigo da Vercel
      const resposta = await fetch(`/api/search?t=${Date.now()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ local, nichos }),
      });

      const textoResposta = await resposta.text();

      // Se a resposta comecar com HTML (o sinal '<'), pegamos o erro do servidor por extenso
      if (textoResposta.trim().startsWith("<")) {
        throw new Error("O servidor devolveu uma pagina HTML de erro em vez de dados. Verifique os logs.");
      }

      const dados = JSON.parse(textoResposta);

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro desconhecido na busca.");
      }

      setResultados(dados);
    } catch (err: any) {
      setErro(err.message || "Erro ao conectar com a API.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>MapsHunter</h1>
      <p>Encontre empresas locais por subnicho.</p>

      <form onSubmit={lidarComBusca} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="Digite a localização (ex: Centro, Goiânia)"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <input
          type="text"
          placeholder="Subnichos separados por vírgula (ex: pizzaria, Hamburgueria)"
          value={nichoInput}
          onChange={(e) => setNichoInput(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
          required
        />
        <button type="submit" disabled={carregando} style={{ padding: "10px", fontSize: "16px", cursor: "pointer" }}>
          {carregando ? "Buscando..." : "Buscar Empresas"}
        </button>
      </form>

      {erro && <p style={{ color: "red", marginTop: "20px", fontWeight: "bold" }}>{erro}</p>}

      {resultados && (
        <div style={{ marginTop: "30px" }}>
          <h3>Resultados Encontrados ({resultados.quantidade}):</h3>
          <ul style={{ paddingLeft: "20px" }}>
            {resultados.empresas?.map((emp: any, idx: number) => (
              <li key={idx} style={{ marginBottom: "15px" }}>
                <strong>{emp.nome}</strong> <br />
                📍 {emp.endereco} <br />
                📞 {emp.telefone} <br />
                {emp.site && <a href={emp.site} target="_blank" rel="noreferrer">Acessar Site</a>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
