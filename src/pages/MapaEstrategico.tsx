import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { useMapaEstrategico } from "@/hooks/useVisualizacoes";
import { fmtDate, cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type MapaRow = Database["public"]["Views"]["v_mapa_estrategico"]["Row"];

type ProjetoNoMapa = {
  id: string;
  nome: string | null;
  codigo: string | null;
  progresso: number | null;
  prazo: string | null;
  status: string | null;
  cor: string | null;
  saude: string | null;
};

type ProgramaNoMapa = {
  id: string;
  nome: string | null;
  codigo: string | null;
  cor: string | null;
  status: string | null;
  projetos: ProjetoNoMapa[];
};

type PortfolioNoMapa = {
  id: string;
  nome: string | null;
  codigo: string | null;
  cor: string | null;
  status: string | null;
  programas: Record<string, ProgramaNoMapa>;
};

const saudeConfig = {
  em_dia: { color: "#10B981", pulse: "animate-pulse", label: "Em dia" },
  atencao: { color: "#F59E0B", pulse: "", label: "Atenção" },
  critico: { color: "#F43F5E", pulse: "animate-pulse", label: "Crítico" },
} as const;

function SaudeDot({ saude }: { saude: string | null | undefined }) {
  const k = (saude ?? "").toLowerCase() as keyof typeof saudeConfig;
  const cfg = saudeConfig[k] ?? { color: "#64748B", pulse: "", label: "—" };
  return (
    <span className="inline-flex items-center gap-1.5" title={cfg.label}>
      <span
        className={cn("inline-block w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]", cfg.pulse)}
        style={{ backgroundColor: cfg.color, color: cfg.color }}
      />
      <span className="text-[9px] font-mono text-[var(--text-muted)] hidden sm:inline">{cfg.label}</span>
    </span>
  );
}

export default function MapaEstrategico() {
  const { tenantId } = useTenant();
  const { data: linhas = [], isLoading } = useMapaEstrategico(tenantId ?? undefined);

  const portfolios = useMemo(() => {
    const arvore = (linhas as MapaRow[]).reduce<Record<string, PortfolioNoMapa>>((acc, linha) => {
      const pid = linha.portfolio_id;
      if (!pid) return acc;
      if (!acc[pid]) {
        acc[pid] = {
          id: pid,
          nome: linha.portfolio_nome,
          codigo: linha.portfolio_codigo,
          cor: linha.portfolio_cor,
          status: linha.portfolio_status,
          programas: {},
        };
      }
      const prgId = linha.programa_id ?? `_sem_programa_${pid}`;
      if (!acc[pid].programas[prgId]) {
        acc[pid].programas[prgId] = {
          id: prgId,
          nome: linha.programa_nome ?? (linha.programa_id ? null : "Sem programa"),
          codigo: linha.programa_codigo,
          cor: linha.programa_cor,
          status: linha.programa_status,
          projetos: [],
        };
      }
      if (linha.projeto_id) {
        const prjs = acc[pid].programas[prgId].projetos;
        if (!prjs.some((p) => p.id === linha.projeto_id)) {
          prjs.push({
            id: linha.projeto_id,
            nome: linha.projeto_nome,
            codigo: linha.projeto_codigo,
            progresso: linha.progresso_percentual,
            prazo: linha.data_fim_prevista,
            status: linha.projeto_status,
            cor: linha.projeto_cor,
            saude: linha.saude_projeto,
          });
        }
      }
      return acc;
    }, {});
    return Object.values(arvore);
  }, [linhas]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex-shrink-0 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">
            Mapa estratégico
          </h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">
            v_mapa_estrategico · {portfolios.length} portfólio(s)
          </p>
        </div>
        <Link
          to="/projetos"
          className="inline-flex items-center px-3 py-1.5 text-[12px] font-medium bg-[#141424] border border-white/[0.12] rounded-[10px] text-[var(--text-muted)] hover:border-indigo-500/35 hover:text-[var(--accent-bright)] transition-colors"
        >
          Ver lista de projetos
        </Link>
      </div>

      <div className="p-7 flex-1 overflow-auto space-y-6">
        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : portfolios.length === 0 ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Nenhum dado na visão estratégica.</div>
        ) : (
          portfolios.map((pf) => (
            <div
              key={pf.id}
              className="rounded-2xl border border-white/[0.08] bg-[#141424] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">{pf.codigo}</span>
                    <h2 className="font-display font-bold text-[16px] text-[var(--text-primary)]">{pf.nome}</h2>
                  </div>
                  {pf.status && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.08]"
                      style={{ borderColor: `${pf.cor ?? "#6366f1"}55`, color: pf.cor ?? undefined }}
                    >
                      {pf.status}
                    </span>
                  )}
                </div>

                <div className="space-y-4 mt-4">
                  {Object.values(pf.programas).map((prog) => (
                    <div key={prog.id} className="ml-0 sm:ml-8 border-l-2 border-cyan-500/50 pl-4">
                      <div className="rounded-xl border border-white/[0.06] bg-[#0f0f18] p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">{prog.codigo}</span>
                          <h3 className="font-display font-semibold text-[14px] text-[var(--text-primary)]">
                            {prog.nome}
                          </h3>
                          {prog.status && (
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">· {prog.status}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 sm:ml-8">
                          {prog.projetos.length === 0 ? (
                            <div className="text-[11px] font-mono text-[var(--text-muted)]">Sem projetos neste programa.</div>
                          ) : (
                            prog.projetos.map((proj) => (
                              <div
                                key={proj.id}
                                className="rounded-xl border border-white/[0.08] bg-[#141424] p-3 hover:border-indigo-500/25 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <SaudeDot saude={proj.saude} />
                                </div>
                                <div className="font-mono text-[9px] text-[var(--text-muted)] mb-0.5">{proj.codigo}</div>
                                <div className="font-medium text-[12px] text-[var(--text-primary)] leading-snug mb-2">
                                  {proj.nome}
                                </div>
                                {proj.status && (
                                  <div className="text-[10px] text-[var(--text-secondary)] mb-2">{proj.status}</div>
                                )}
                                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                  <span>{Math.round(proj.progresso ?? 0)}%</span>
                                  <span>{fmtDate(proj.prazo)}</span>
                                </div>
                                <div className="mt-2 h-1 bg-[#050508] rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      !proj.cor && "bg-gradient-to-r from-indigo-500 to-cyan-400"
                                    )}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, proj.progresso ?? 0))}%`,
                                      ...(proj.cor ? { backgroundColor: proj.cor } : {}),
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
