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

// Trata URLs garantindo que não fiquem vazias e sempre tenham o protocolo https://
function formatarUrl(url?: string): string | null {
  if (!url || typeof url !== "string") return null;
  const limpa = url.trim();
  if (!limpa || limpa === "#") return null;

  if (limpa.startsWith("http://") || limpa.startsWith("https://")) {
    return limpa;
  }
  return `https://${limpa}`;
}

export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  const temSite = Boolean(empresa.site);
  const temCardapio = Boolean(empresa.cardapio);
  const temTelefone = Boolean(empresa.telefone);
  const temInstagram = Boolean(empresa.instagram);
  const temHorario = Boolean(empresa.horario);
  const temAvaliacao = Boolean(empresa.avaliacao);

  // Validação segura dos links
  const linkGoogleMaps = formatarUrl(empresa.href) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(empresa.nome)}`;
  const linkSite = formatarUrl(empresa.site);
  const linkInstagram = formatarUrl(empresa.instagram);
  const linkCardapio = formatarUrl(empresa.cardapio);

  // Calcula itens faltantes
  const pendencias = [
    !temSite && "Sem Site",
    !temCardapio && "Sem Cardápio/Catálogo",
    !temInstagram && "Sem Instagram",
    !temTelefone && "Sem Telefone",
    !temHorario && "Sem Horário",
    !temAvaliacao && "Sem Avaliações",
  ].filter(Boolean) as string[];

  // Define a temperatura da oportunidade
  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  let statusTexto = "🟢 Oportunidade Baixa (Perfil Completo)";

  if (pendencias.length >= 4 || !temSite) {
    badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
    statusTexto = "🔥 LEAD QUENTE (Alta Oportunidade)";
  } else if (pendencias.length >= 2) {
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
    statusTexto = "🟡 Oportunidade Média";
  }

  return (
    <div className="group relative rounded-2xl border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-slate-700 hover:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={`inline-block rounded-full border px-3 py-1 text-xs font-bold ${badgeColor} mb-2`}>
            {statusTexto}
          </span>
          <h3 className="text-xl font-bold text-white">{empresa.nome}</h3>
          {empresa.endereco && <p className="text-xs text-slate-400 mt-1">📍 {empresa.endereco}</p>}
        </div>

        {/* Link do Google Maps tratado */}
        <a
          href={linkGoogleMaps}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-sky-500/10 px-3 py-2 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
        >
          Ver no Google Maps ↗
        </a>
      </div>

      {/* Grid de Auditoria Rápida */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <ItemStatus rotulo="Site Próprio" ativo={temSite} valor={empresa.site} link={linkSite} />
        <ItemStatus rotulo="Cardápio/Catálogo" ativo={temCardapio} valor={empresa.cardapio} link={linkCardapio} />
        <ItemStatus rotulo="Instagram" ativo={temInstagram} valor={empresa.instagram} link={linkInstagram} />
        <ItemStatus rotulo="Telefone" ativo={temTelefone} valor={empresa.telefone} />
        <ItemStatus rotulo="Horário" ativo={temHorario} valor={empresa.horario} />
        <ItemStatus rotulo="Avaliações" ativo={temAvaliacao} valor={empresa.avaliacao ? `★ ${empresa.avaliacao}` : null} />
      </div>

      {/* Diagnóstico de Abordagem para Venda */}
      {pendencias.length > 0 && (
        <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
          <p className="font-bold text-rose-300">🎯 O que oferecer nesta abordagem:</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {pendencias.map((item, index) => (
              <span key={index} className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-200 border border-rose-500/20">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ItemStatus({
  rotulo,
  ativo,
  valor,
  link,
}: {
  rotulo: string;
  ativo: boolean;
  valor?: string | null;
  link?: string | null;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${
        ativo ? "border-slate-800 bg-slate-950/40 text-slate-400" : "border-rose-500/20 bg-rose-500/10 text-rose-300"
      }`}
    >
      <span>{ativo ? "✅" : "❌"}</span>
      <div className="truncate">
        <p className="text-[10px] uppercase text-slate-500">{rotulo}</p>
        {ativo && link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate font-semibold text-sky-400 hover:underline block"
          >
            {valor || "Acessar"}
          </a>
        ) : (
          <p className="truncate font-semibold text-slate-200">
            {ativo ? valor || "Cadastrado" : "FALTANDO"}
          </p>
        )}
      </div>
    </div>
  );
}