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

export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-sky-500/50 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-sky-500/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition-colors">
            {empresa.nome}
          </h3>
          {empresa.endereco && (
            <p className="mt-1 text-sm text-slate-400 flex items-center gap-1">
              📍 {empresa.endereco}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {empresa.avaliacao && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 border border-amber-500/20">
              ⭐ {empresa.avaliacao}
            </span>
          )}
          {empresa.horario && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/20">
              🕒 {empresa.horario}
            </span>
          )}
        </div>
      </div>

      {/* Contatos Grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 rounded-xl bg-slate-950/50 p-4 border border-slate-800/60">
        {empresa.telefone && (
          <p className="text-sm text-slate-300">
            📞 <span className="font-semibold text-slate-200">Telefone:</span> {empresa.telefone}
          </p>
        )}
        {empresa.site && (
          <p className="text-sm text-slate-300 truncate">
            🌐 <span className="font-semibold text-slate-200">Site:</span>{" "}
            <a href={empresa.site} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              {empresa.site}
            </a>
          </p>
        )}
        {empresa.instagram && (
          <p className="text-sm text-slate-300 truncate">
            📸 <span className="font-semibold text-slate-200">Instagram:</span>{" "}
            <a href={empresa.instagram} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              {empresa.instagram}
            </a>
          </p>
        )}
        {empresa.cardapio && (
          <p className="text-sm text-slate-300 truncate">
            📋 <span className="font-semibold text-slate-200">Cardápio:</span>{" "}
            <a href={empresa.cardapio} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
              Ver cardápio
            </a>
          </p>
        )}
      </div>

      {/* Alerta de itens faltantes */}
      {empresa.missing && empresa.missing.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300 border border-rose-500/20">
          ⚠️ <span><strong>Dados ausentes:</strong> {empresa.missing.join(", ")}</span>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <a
          href={empresa.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          Abrir no Google Maps ↗
        </a>
      </div>
    </div>
  );
}