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

  // Filtros de Prospecção
  const [apenasSemSite, setApenasSemSite] = useState(false);
  const [apenasSemCardapio, setApenasSemCardapio] = useState(false);

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
      setErro("Erro na conexão com a API.");
    } finally {
      setIsLoading(false);
    }
  }

  // Ordena empresas: Coloca as empresas com MAIS PENDÊNCIAS no topo da lista
  const calcularPontuacaoLead = (e: any) => {
    let pendencias = 0;
    if (!e.site) pendencias += 3; // Peso maior para ausência de site
    if (!e.cardapio) pendencias += 2;
    if (!e.instagram) pendencias += 1;
    if (!e.telefone) pendencias += 1;
    if (!e.horario) pendencias += 1;
    if (!e.avaliacao) pendencias += 1;
    return pendencias;
  };

  const empresasProcessadas = resultado?.empresas
    ?.slice()
    ?.sort((a: any, b: any) => calcularPontuacaoLead(b) - calcularPontuacaoLead(a)) // Maior pontuação de pendência vem primeiro
    ?.filter((e: any) => {
      if (apenasSemSite && e.site) return false;
      if (apenasSemCardapio && e.cardapio) return false;
      return true;
    });

  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-slate-100">
      {/* Header */}
      <header className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-3">
          🎯 Hunter Leads • Mapeador de Fragilidades
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Encontre Clientes Sem Site ou Cardápio
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Mapeie estabelecimentos com baixa reputação digital no Google Maps e ordene automaticamente os melhores alvos para abordagem comercial.
        </p>
      </header>

      {/* Painel de Busca */}
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        {/* Localização */}
        <div ref={historicoRef} className="relative">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            1. Bairro ou Região de Prospecção
          </label>
          <input
            type="text"
            value={local}
            onChange={(e) => { setLocal(e.target.value); setMostrarHistorico(true); }}
            onFocus={() => setMostrarHistorico(true)}
            placeholder="Ex: Moema, São Paulo / Centro, Curitiba"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white placeholder-slate-500 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
          />
          {mostrarHistorico && historicoLocal.length > 0 && (
            <div className="absolute left-0 right-0 z-30 mt-2 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
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

        {/* Categorias */}
        <div className="mt-6">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
            2. Escolha os Subnichos Alvo ({selecaoSubnichos.length}/3)
          </label>
          <div ref={categoriasRef} className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(categorias).map(([categoria, subnichos]) => {
              const aberto = categoriasAbertas[categoria];
              const selecionadosCount = subnichos.filter((s) => selecaoSubnichos.includes(s)).length;

              return (
                <div key={categoria} className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoriasAbertas({ [categoria]: !aberto })}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left text-sm ${
                      selecionadosCount > 0
                        ? "border-rose-500 bg-rose-500/10 text-white font-semibold"
                        : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span>{categoria}</span>
                    {selecionadosCount > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {selecionadosCount}
                      </span>
                    )}
                  </button>

                  {aberto && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 p-3 rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl space-y-1.5 max-h-60 overflow-y-auto scrollbar-none">
                      {subnichos.map((sub) => {
                        const check = selecaoSubnichos.includes(sub);
                        return (
                          <label
                            key={sub}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                              check ? "bg-rose-500/20 text-rose-300 font-semibold" : "hover:bg-slate-900 text-slate-300"
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
                              className="accent-rose-500 rounded"
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

        {/* Botão */}
        <button
          onClick={buscar}
          disabled={isLoading}
          className="mt-8 w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 font-bold text-white text-base shadow-lg shadow-rose-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          {isLoading ? "🔍 Mapeando oportunidades no Google Maps..." : "🔥 Mapear Leads Faltando Informações"}
        </button>

        {erro && <p className="mt-4 text-center text-xs text-rose-400 font-medium">{erro}</p>}
      </section>

      {/* Resultados e Filtros de Venda */}
      {resultado && (
        <section className="mt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">Leads Encontrados ({empresasProcessadas?.length})</h2>
              <p className="text-xs text-slate-400">Ordenados automaticamente: os **piores perfis (mais quentes para venda)** no topo.</p>
            </div>

            {/* Filtros rápidos de oportunidade */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setApenasSemSite(!apenasSemSite)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  apenasSemSite
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {apenasSemSite ? "✓ Apenas Sem Site" : "🚫 Mostrar Apenas Sem Site"}
              </button>

              <button
                onClick={() => setApenasSemCardapio(!apenasSemCardapio)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  apenasSemCardapio
                    ? "bg-rose-500 text-white border-rose-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {apenasSemCardapio ? "✓ Apenas Sem Cardápio" : "📋 Mostrar Apenas Sem Cardápio"}
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {empresasProcessadas?.length > 0 ? (
              empresasProcessadas.map((empresa: any) => (
                <EmpresaCard key={empresa.href} empresa={empresa} />
              ))
            ) : (
              <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900/30">
                <p className="text-slate-400 text-sm">Nenhum lead encontrado com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}