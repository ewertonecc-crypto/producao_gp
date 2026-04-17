import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { useProjetos } from "@/hooks/useProjetos";
import { useProgressoProjetosDerivado } from "@/hooks/useProgressoProjetosDerivado";
import { progressoProjetoParaExibicao } from "@/lib/progressoComSubatividades";
import { useMarcos } from "@/hooks/useMarcos";
import { saveDashboardPdf } from "@/lib/dashboardPdfReport";
import { fmtDate, dateColor, avatarInitials, progressColor, statusToBadgeClass, prioToClass, cn } from "@/lib/utils";

export default function Dashboard() {
  const { tenantId } = useTenant();
  const { data: projetos = [], isLoading: loadingProj } = useProjetos(tenantId ?? undefined);
  const { porProjeto } = useProgressoProjetosDerivado(tenantId ?? undefined);
  const { data: marcos = [] } = useMarcos(tenantId ?? undefined);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const hoje = new Date();
  const emExec = projetos.filter(p => (p.status as any)?.nome?.toLowerCase().includes("execu")).length;
  const conc = projetos.filter(p => (p.status as any)?.nome?.toLowerCase().includes("conclu")).length;
  const projetosComProgresso = useMemo(
    () =>
      projetos.map((p) => ({
        ...p,
        progresso_percentual: progressoProjetoParaExibicao(p.id, p.progresso_percentual, porProjeto),
      })),
    [projetos, porProjeto]
  );

  const atrasados = projetosComProgresso.filter(
    (p) => p.data_fim_prevista && new Date(p.data_fim_prevista) < hoje && (p.progresso_percentual ?? 0) < 100
  ).length;

  const exportarPdf = useCallback(async () => {
    setExportandoPdf(true);
    try {
      saveDashboardPdf(projetosComProgresso, marcos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar PDF";
      toast.error(msg);
    } finally {
      setExportandoPdf(false);
    }
  }, [projetosComProgresso, marcos]);

  const avClasses = ["from-indigo-500 to-violet-400", "from-cyan-400 to-indigo-500", "from-emerald-500 to-cyan-400", "from-amber-400 to-rose-400"];

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-start justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">Visão geral do portfólio · Atualizado agora</p>
        </div>
        <div className="flex gap-2 mt-0.5">
          <button
            type="button"
            disabled={exportandoPdf || loadingProj}
            onClick={exportarPdf}
            className="px-3 py-[6px] text-[12px] font-medium text-[var(--text-secondary)] bg-[#141424] border border-white/[0.12] rounded-[10px] hover:border-indigo-500/35 hover:text-[var(--accent-bright)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            ↓ Exportar PDF
          </button>
        </div>
      </div>

      <div className="p-7 flex flex-col gap-6 bg-[#0A0A12] [print-color-adjust:exact]">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Projetos", value: projetos.length, delta: "projetos cadastrados", cls: "s1" },
            { label: "Em Execução",    value: emExec,          delta: "ativos agora",          cls: "s2" },
            { label: "Concluídos",     value: conc,            delta: "finalizados",           cls: "s3" },
            { label: "Em Atraso",      value: atrasados,       delta: atrasados > 0 ? "⚠ requer atenção" : "— tudo em dia", cls: "s4" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">{s.label}</div>
              <div className="font-display font-extrabold text-[28px] tracking-tight text-[var(--text-primary)] leading-none">
                {loadingProj ? "—" : s.value}
              </div>
              <div className={cn("text-[10px] font-mono mt-1.5", atrasados > 0 && s.cls === "s4" ? "text-rose-400" : "text-emerald-400")}>
                {s.delta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Projetos por status */}
          <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Projetos por Status</span>
              <span className="text-[10.5px] font-mono text-[var(--text-muted)] bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded">Este mês</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {loadingProj ? (
                <div className="text-[12px] text-[var(--text-muted)] font-mono">Carregando...</div>
              ) : projetos.length === 0 ? (
                <div className="text-[12px] text-[var(--text-muted)] font-mono">Nenhum projeto cadastrado</div>
              ) : (
                (() => {
                  const total = projetos.length || 1;
                  const groups: Record<string, number> = {};
                  projetos.forEach(p => {
                    const n = (p.status as any)?.nome ?? "Sem status";
                    groups[n] = (groups[n] ?? 0) + 1;
                  });
                  const colors: Record<string, string> = {
                    "Em Execução": "from-cyan-400 to-indigo-500",
                    "Em Planejamento": "from-indigo-400 to-violet-400",
                    "Concluído": "from-emerald-400 to-cyan-400",
                    "Em Revisão": "from-amber-400 to-amber-500",
                  };
                  return Object.entries(groups).map(([nome, count]) => (
                    <div key={nome}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[12px] text-[var(--text-secondary)]">{nome}</span>
                        <span className="text-[11px] font-mono text-[var(--accent-bright)]">{count} / {total}</span>
                      </div>
                      <div className="h-1 bg-[#1A1A2E] rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-gradient-to-r", colors[nome] ?? "from-indigo-500 to-cyan-400")}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>

          {/* Próximos marcos */}
          <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Próximos Marcos</span>
              <span className="text-[10.5px] font-mono text-[var(--text-muted)] bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded">30 dias</span>
            </div>
            <div className="p-4 flex flex-col gap-0">
              {marcos.length === 0 ? (
                <div className="text-[12px] text-[var(--text-muted)] font-mono">Nenhum marco cadastrado</div>
              ) : (
                marcos.slice(0, 5).map((m, i) => {
                  const done = !!m.data_real || m.status === "atingido";
                  const dotCls = done
                    ? "bg-emerald-500 border-emerald-500"
                    : m.is_critico
                    ? "border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                    : "border-white/[0.12]";
                  return (
                    <div key={m.id} className="flex gap-3 py-2.5 relative">
                      {i < marcos.length - 1 && (
                        <div className="absolute left-[7px] top-7 bottom-[-10px] w-px bg-white/[0.04]" />
                      )}
                      <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 relative z-10 bg-[#141424]", dotCls)} />
                      <div>
                        <div className="text-[12.5px] font-medium text-[var(--text-primary)]">{m.nome}</div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                          {(m.projeto as any)?.nome ?? (m.programa as any)?.nome ?? "—"} · {fmtDate(m.data_prevista)} {done ? "✓" : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Tabela de projetos */}
        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Projetos Ativos</span>
            <div className="flex gap-2">
              {atrasados > 0 && (
                <span className="text-[10.5px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                  ⚠ {atrasados} em atraso
                </span>
              )}
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Código", "Projeto", "Status", "Prioridade", "Progresso", "Prazo", "Gerente"].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] border-b border-white/[0.04]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingProj ? (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-[12px] font-mono text-[var(--text-muted)]">Carregando...</td></tr>
              ) : projetos.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-6 text-center text-[12px] font-mono text-[var(--text-muted)]">Nenhum projeto cadastrado</td></tr>
              ) : (
                projetosComProgresso.slice(0, 8).map((p, i) => {
                  const pct = Math.round(p.progresso_percentual ?? 0);
                  const statusNome = (p.status as any)?.nome ?? "";
                  const prioNome = (p.prioridade as any)?.nome ?? "";
                  const gerenteNome = (p.gerente as any)?.nome ?? "";
                  return (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-indigo-500/[0.04] cursor-pointer transition-colors">
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">{p.codigo ?? "—"}</td>
                      <td className="px-5 py-3 text-[13px] font-medium text-[var(--text-primary)]">{p.nome}</td>
                      <td className="px-5 py-3">
                        <span className={cn("badge text-[10.5px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 w-fit", statusToBadgeClass(statusNome))}>
                          <span className="w-[5px] h-[5px] rounded-full bg-current" />
                          {statusNome || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3"><span className={prioToClass(prioNome)}>{(prioNome || "—").toUpperCase()}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#050508] rounded-full overflow-hidden min-w-[50px]">
                            <div className={cn("h-full rounded-full bg-gradient-to-r", progressColor(pct))} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-[var(--accent-bright)] min-w-[28px] text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className={cn("px-5 py-3 font-mono text-[11px]", dateColor(p.data_fim_prevista))}>{fmtDate(p.data_fim_prevista)}</td>
                      <td className="px-5 py-3">
                        {gerenteNome ? (
                          <div className="flex items-center gap-2">
                            <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-[9px] font-bold text-white", avClasses[i % 4])}>
                              {avatarInitials(gerenteNome)}
                            </div>
                            <span className="text-[12px] text-[var(--text-secondary)]">{gerenteNome.split(" ")[0]}</span>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
