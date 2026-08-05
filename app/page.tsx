"use client";

import { useEffect, useRef, useState } from "react";

const categorias = {
  Alimentação: [
    "restaurante",
    "lanchonete",
    "hamburgueria",
    "pizzaria",
    "padaria",
    "cafeteria",
    "confeitaria",
    "açaí",
    "bar",
    "pub",
    "churrascaria",
  ],
  Saúde: [
    "clínica",
    "hospital",
    "farmácia",
    "dentista",
    "laboratório",
    "ótica",
    "psicólogo",
    "fisioterapia",
  ],
  Beleza: ["salão", "barbearia", "estética", "manicure"],
  Fitness: ["academia", "crossfit", "pilates", "yoga"],
  Pets: ["pet shop", "veterinário"],
  Comércio: [
    "papelaria",
    "livraria",
    "informática",
    "celular",
    "eletrônicos",
    "roupas",
    "calçados",
    "joalheria",
  ],
  Construção: [
    "material de construção",
    "vidraçaria",
    "marmoraria",
    "marcenaria",
    "serralheria",
  ],
  Automotivo: [
    "oficina",
    "borracharia",
    "lava jato",
    "auto elétrica",
    "auto peças",
  ],
  Serviços: [
    "advogado",
    "contabilidade",
    "imobiliária",
    "marketing",
    "gráfica",
    "coworking",
  ],
  Educação: ["escola", "curso", "idiomas", "creche"],
  Hotelaria: ["hotel", "hostel", "pousada"],
} as const;

interface Empresa {
  nome: string;
  href: string;
  endereco?: string;
  telefone?: string;
  site?: string;
  horario?: string;
  instagram?: string;
  avaliacao?: string;
  missing?: string[];
  cardapio?: string;
}

interface ResultadoBusca {
  quantidade: number;
  empresas: Empresa[];
}

export default function Home() {
  const [local, setLocal] = useState("");
  const [selecaoSubnichos, setSelecaoSubnichos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [historicoLocal, setHistoricoLocal] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const salvo = localStorage.getItem("historicoLocal");
      if (!salvo) return [];
      const parsed = JSON.parse(salvo);
      return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
    } catch {
      return [];
    }
  });

  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState<Record<string, boolean>>(
    () => Object.fromEntries(Object.keys(categorias).map((cat) => [cat, false]))
  );

  const historicoRef = useRef<HTMLDivElement | null>(null);
  const categoriasRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (historicoRef.current && !historicoRef.current.contains(target)) {
        setMostrarHistorico(false);
      }

      if (categoriasRef.current && !categoriasRef.current.contains(target)) {
        setCategoriasAbertas(
          Object.fromEntries(Object.keys(categorias).map((cat) => [cat, false]))
        );
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const atualizarHistoricoLocal = (novoLocal: string) => {
    const trimmedLocal = novoLocal.trim();
    if (!trimmedLocal) return;

    const atualizado = [
      trimmedLocal,
      ...historicoLocal.filter((item) => item !== trimmedLocal),
    ].slice(0, 3);

    setHistoricoLocal(atualizado);

    if (typeof window !== "undefined") {
      localStorage.setItem("historicoLocal", JSON.stringify(atualizado));
    }
  };

  async function buscar() {
    const nichos = selecaoSubnichos;
    if (!local.trim() || nichos.length === 0) {
      setErro("Insira um bairro e selecione pelo menos um subnicho.");
      return;
    }
    setErro(null);
    setIsLoading(true);
    setResultado(null);
    setStatusMessage(`Procurando ${nichos.join(", ")} em ${local}...`);

    try {
      const resposta = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ local: local.trim(), nichos }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados?.erro ?? "Falha ao buscar empresas.");
        setResultado(null);
      } else {
        setResultado(dados);
        atualizarHistoricoLocal(local);
      }
    } catch {
      setErro("Erro ao conectar com a API.");
      setResultado(null);
    } finally {
      setStatusMessage(null);
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen py-16 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl ring-1 ring-white/5 sm:p-12">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-sky-500/20 to-transparent blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Header */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/80">
                  MapsHunter
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Encontre empresas locais por subnicho.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Selecione os subnichos mais relevantes e busque empresas em um bairro ou setor sem perder desempenho.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/90 p-6 shadow-lg shadow-slate-950/20">
                <p className="text-sm font-semibold text-slate-300">Dica prática</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  Escolha até 3 subnichos por pesquisa para manter os resultados mais rápidos e direcionados.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-10 rounded-[1.75rem] border border-slate-800 bg-slate-900/90 p-8 shadow-inner shadow-slate-950/20">
              {/* Input Localização */}
              <div ref={historicoRef} className="relative">
                <label htmlFor="localizacao" className="block text-sm font-semibold mb-3 text-slate-200">
                  Localização
                </label>
                <input
                  id="localizacao"
                  type="text"
                  value={local}
                  onChange={(e) => {
                    setLocal(e.target.value);
                    setMostrarHistorico(true);
                  }}
                  onFocus={() => setMostrarHistorico(true)}
                  placeholder="Digite o bairro ou região"
                  className="w-full rounded-[1.25rem] border border-slate-700 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                />
                {mostrarHistorico && historicoLocal.length > 0 && (
                  <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[1rem] border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/50">
                    {historicoLocal.map((entrada, index) => (
                      <button
                        key={`${entrada}-${index}`}
                        type="button"
                        onClick={() => {
                          setLocal(entrada);
                          setMostrarHistorico(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-slate-900"
                      >
                        {entrada}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção Categorias */}
              <div className="mt-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Categorias</h2>
                    <p className="text-sm text-slate-400">
                      Abra as categorias para selecionar até 3 subnichos.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-100">
                    <span className="font-semibold">{selecaoSubnichos.length}</span>
                    <span>/</span>
                    <span>3 selecionados</span>
                  </div>
                </div>

                {/* Grid Categorias */}
                <div ref={categoriasRef} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(categorias).map(([categoria, subnichos]) => {
                    const aberto = categoriasAbertas[categoria];
                    const selecionadosNaCategoria = subnichos.filter((subnicho) =>
                      selecaoSubnichos.includes(subnicho)
                    ).length;
                    const podeSelecionarMais = selecaoSubnichos.length < 3;

                    return (
                      <div
                        key={categoria}
                        className="relative overflow-visible rounded-[1.5rem] border border-slate-700 bg-slate-950 transition hover:border-sky-400/40"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-100">{categoria}</p>
                            <p className="text-xs text-slate-400">
                              {selecionadosNaCategoria} selecionado(s)
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoriasAbertas((prev) => ({
                                ...prev,
                                [categoria]: !prev[categoria],
                              }))
                            }
                            className="rounded-full border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-100 transition hover:border-slate-500"
                          >
                            {aberto ? "Fechar" : "Abrir"}
                          </button>
                        </div>

                        {/* Dropdown de Subnichos */}
                        {aberto && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto scrollbar-none rounded-[1.5rem] border border-slate-700 bg-slate-950 p-4 shadow-2xl shadow-slate-950/50">
                            <div className="space-y-3">
                              {subnichos.map((subnicho) => {
                                const selecionado = selecaoSubnichos.includes(subnicho);
                                return (
                                  <label
                                    key={subnicho}
                                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                                      selecionado
                                        ? "border-sky-400 bg-slate-900"
                                        : "border-slate-800 bg-slate-950 hover:border-slate-600"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selecionado}
                                      disabled={!selecionado && !podeSelecionarMais}
                                      onChange={() => {
                                        setSelecaoSubnichos((prev) =>
                                          selecionado
                                            ? prev.filter((item) => item !== subnicho)
                                            : [...prev, subnicho]
                                        );
                                      }}
                                      className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-400 focus:ring-sky-400"
                                    />
                                    <span className="text-sm text-slate-100">{subnicho}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botão de Busca */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Pesquisa direcionada</p>
                  <p className="text-xs text-slate-500">
                    Sua busca usará apenas os subnichos marcados no painel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={buscar}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-8 py-4 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Buscando..." : "Buscar Empresas"}
                </button>
              </div>

              {/* Mensagens de Feedback */}
              {statusMessage && (
                <div className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-4 text-sky-100">
                  <p className="font-semibold">{statusMessage}</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Estamos verificando as melhores fontes locais para você.
                  </p>
                </div>
              )}

              {erro && (
                <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-rose-200">
                  {erro}
                </div>
              )}

              {/* Resultados */}
              {resultado && (
                <div className="mt-8 rounded-[1.5rem] border border-slate-700 bg-slate-950/95 p-6 shadow-lg shadow-slate-950/10">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Resultados encontrados</h2>
                      <p className="text-sm text-slate-400">
                        {resultado.quantidade} empresa(s) retornada(s).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {resultado.empresas.length > 0 ? (
                      resultado.empresas.map((empresa) => (
                        <div
                          key={empresa.href}
                          className="rounded-2xl border border-slate-800 bg-slate-900/90 px-5 py-5 transition hover:border-sky-400/40 hover:bg-slate-900"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-semibold text-white">{empresa.nome}</p>
                              {empresa.endereco && (
                                <p className="mt-1 text-sm text-slate-400">{empresa.endereco}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {empresa.avaliacao && (
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                  ★ {empresa.avaliacao}
                                </span>
                              )}
                              {empresa.horario && (
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                                  {empresa.horario}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {empresa.telefone && (
                              <p className="text-sm text-slate-300">
                                <span className="font-semibold text-slate-100">Telefone:</span>{" "}
                                {empresa.telefone}
                              </p>
                            )}
                            {empresa.site && (
                              <p className="text-sm text-slate-300 break-words">
                                <span className="font-semibold text-slate-100">Site:</span>{" "}
                                <a
                                  href={empresa.site}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-300 hover:text-sky-200"
                                >
                                  {empresa.site}
                                </a>
                              </p>
                            )}
                            {empresa.instagram && (
                              <p className="text-sm text-slate-300 break-words">
                                <span className="font-semibold text-slate-100">Instagram:</span>{" "}
                                <a
                                  href={empresa.instagram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sky-300 hover:text-sky-200"
                                >
                                  {empresa.instagram}
                                </a>
                              </p>
                            )}
                            {empresa.cardapio && (
                              <p className="text-sm text-slate-300 break-words">
                                <span className="font-semibold text-slate-100">Cardápio:</span>{" "}
                                {empresa.cardapio.startsWith("http") ? (
                                  <a
                                    href={empresa.cardapio}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sky-300 hover:text-sky-200"
                                  >
                                    Ver cardápio
                                  </a>
                                ) : (
                                  empresa.cardapio
                                )}
                              </p>
                            )}
                          </div>

                          {empresa.missing && empresa.missing.length > 0 && (
                            <p className="mt-3 text-sm text-rose-300">
                              <span className="font-semibold text-rose-100">Faltando:</span>{" "}
                              {empresa.missing.join(", ")}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                            <a
                              href={empresa.href}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-slate-200"
                            >
                              Ver no Google Maps
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">
                        Nenhuma empresa encontrada para o filtro selecionado.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}