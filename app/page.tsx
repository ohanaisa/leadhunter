"use client";

import { useEffect, useRef, useState } from "react";
import { EmpresaCard } from "./components/EmpresaCard";

const categorias = {
  Alimentação: ["restaurante", "lanchonete", "hamburgueria", "pizzaria", "padaria", "cafeteria", "açaí", "bar"],
  Saúde: ["clínica", "hospital", "farmácia", "dentista", "laboratório", "ótica", "psicólogo"],
  Beleza: ["salão", "barbearia", "estética", "manicure"],
  Fitness: ["academia", "crossfit", "pilates", "yoga"],
  Pets: ["pet shop", "veterinário"],
  Comércio: ["papelaria", "livraria", "informática", "celular", "eletrônicos", "roupas"],
  Construção: ["material de construção", "vidraçaria", "marmoraria", "marcenaria"],
  Automotivo: ["oficina", "borracharia", "lava jato", "auto peças"],
  Serviços: ["advogado", "contabilidade", "imobiliária", "marketing"],
  Educação: ["escola", "curso", "idiomas"],
  Hotelaria: ["hotel", "pousada"],
} as const;

export default function Home() {
  const [local, setLocal] = useState("");
  const [selecaoSubnichos, setSelecaoSubnichos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroNome, setFiltroNome] = useState("");

  const [historicoLocal, setHistoricoLocal] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const salvo = localStorage.getItem("historicoLocal");
      return salvo ? JSON.parse(salvo).slice(0, 3) : [];
    } catch {
      return [];
    }
  });

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>({});

  const historicoRef = useRef<HTMLDivElement | null>(null);
  const categoriasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (historicoRef.current && !historicoRef.current.contains(target)) setMostrarHistorico(false);
      if (categoriasRef.current && !categoriasRef.current.contains(target)) setCategoriasAbertas({});
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function buscar() {
    if (!local.trim() || selecaoSubnichos.length === 0) {
      setErro("Insira a localização e escolha ao menos 1 subnicho.");
      return;
    }
    setErro(null);
    setIsLoading(true);
    setResultado(null);

    try {
      const resposta = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local: local.trim(), nichos: selecaoSubnichos }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) setErro(dados?.erro ?? "Erro ao buscar.");
      else {
        setResultado(dados);
        const novoHist = [local.trim(), ...historicoLocal.filter((h) => h !== local.trim())].slice(0, 3);
        setHistoricoLocal(novoHist);
        localStorage.setItem("historicoLocal", JSON.stringify(novoHist));
      }
    } catch {
      setErro("Erro na conexão.");
    } finally {
      setIsLoading(false);
    }
  }

  const empresasFiltradas = resultado?.empresas?.filter((e: any) =>
    e.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header Visual Hero */}
      <header className="text-center py-10 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-widest mb-4">
          🔍 MapsHunter v2.0
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-sky-400">
          Prospecção de Leads Locais
        </h1>
        <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
          Encontre e analise empresas no Google Maps selecionando subnichos estratégicos.
        </p>
      </header>

      {/* Painel Principal */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl">
        
        {/* Campo Localização */}
        <div ref={historicoRef} className="relative">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            📍 Onde você quer buscar?
          </label>
          <input
            type="text"
            value={local}
            onChange={(e) => { setLocal(e.target.value); setMostrarHistorico(true); }}
            onFocus={() => setMostrarHistorico(true)}
            placeholder="Ex: Moema, São Paulo / Centro, Curitiba"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
          {mostrarHistorico && historicoLocal.length > 0 && (
            <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
              <p className="px-3 py-1 text-xs text-slate-500 font-semibold">Buscas recentes:</p>
              {historicoLocal.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLocal(item); setMostrarHistorico(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-white rounded-lg transition-colors"
                >
                  🕒 {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categorias & Subnichos */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">🏷️ Subnichos ({selecaoSubnichos.length}/3)</h2>
            {selecaoSubnichos.length > 0 && (
              <button
                onClick={() => setSelecaoSubnichos([])}
                className="text-xs text-rose-400 hover:underline"
              >
                Limpar seleção
              </button>
            )}
          </div>

          <div ref={categoriasRef} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(categorias).map(([categoria, subnichos]) => {
              const aberto = categoriasAbertas[categoria];
              const selecionadosCount = subnichos.filter((s) => selecaoSubnichos.includes(s)).length;

              return (
                <div key={categoria} className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoriasAbertas({ [categoria]: !aberto })}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      selecionadosCount > 0
                        ? "border-sky-500 bg-sky-500/10 text-white"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-sm">{categoria}</p>
                      <p className="text-xs text-slate-500">{subnichos.length} opções</p>
                    </div>
                    {selecionadosCount > 0 && (
                      <span className="bg-sky-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                        {selecionadosCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown flotante */}
                  {aberto && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 p-3 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl space-y-1.5 max-h-60 overflow-y-auto scrollbar-none">
                      {subnichos.map((sub) => {
                        const check = selecaoSubnichos.includes(sub);
                        return (
                          <label
                            key={sub}
                            className={`flex items-center gap-2 p-2 rounded-xl text-sm cursor-pointer transition-colors ${
                              check ? "bg-sky-500/20 text-sky-300" : "hover:bg-slate-900 text-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={check}
                              disabled={!check && selecaoSubnichos.length >= 3}
                              onChange={() => {
                                setSelecaoSubnichos((prev) =>
                                  check ? prev.filter((i) => i !== sub) : [...prev, sub]
                                );
                              }}
                              className="accent-sky-500 rounded"
                            />
                            <span>{sub}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={buscar}
          disabled={isLoading}
          className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-slate-950 text-base shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isLoading ? "🔍 Minerando empresas..." : "🚀 Buscar Empresas Agora"}
        </button>

        {erro && <p className="mt-4 text-center text-sm text-rose-400 font-medium">{erro}</p>}
      </section>

      {/* Resultados */}
      {resultado && (
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Empresas Encontradas</h2>
              <p className="text-sm text-slate-400">{empresasFiltradas?.length} resultados disponíveis</p>
            </div>

            {/* Input para filtrar resultados já carregados */}
            <input
              type="text"
              placeholder="Filtrar nesta lista..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-sm text-white outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid gap-4">
            {empresasFiltradas?.map((empresa: any) => (
              <EmpresaCard key={empresa.href} empresa={empresa} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}