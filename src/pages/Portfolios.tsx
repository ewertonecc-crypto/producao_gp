import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolios, useCreatePortfolio, useUpdatePortfolio, useDeletePortfolio } from "@/hooks/usePortfolios";
import { useProgramas } from "@/hooks/useProgramas";
import { useProjetos } from "@/hooks/useProjetos";
import { useStatus, usePrioridades, useTiposCadastroPorModulo } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge, PrioBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, fmtDate, dateColor, formatCurrency, progressColor, statusToBadgeClass, prioToClass } from "@/lib/utils";
import { progressoProjetoParaExibicao } from "@/lib/progressoComSubatividades";
import { useProgressoProjetosDerivado } from "@/hooks/useProgressoProjetosDerivado";
import { toast } from "sonner";
import { ModalNovoPortfolio } from "@/components/modals/ModalNovoPortfolio";
import { AnexosPanel } from "@/components/ui/AnexosPanel";

const portfolioFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().optional(),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  justificativa: z.string().min(1, "Justificativa é obrigatória"),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  status_id: z.string().optional(),
  prioridade_id: z.string().optional(),
  gestor_id: z.string().optional(),
  tipo_id: z.string().optional(),
  data_inicio_prevista: z.string().optional(),
  data_fim_prevista: z.string().optional(),
  orcamento_previsto: z.string().optional(),
  cor_mapa: z.string().optional(),
});

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>;

type PortfolioRow = NonNullable<ReturnType<typeof usePortfolios>["data"]>[number];

function emptyToNull(s: string | undefined | null): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function parseOrcamento(s: string | undefined): number | null {
  if (!s?.trim()) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const inputClass =
  "w-full rounded-[10px] border border-white/[0.12] bg-[#0d0d14] px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/40";

const labelClass = "text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-1 block";

export default function Portfolios() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const { data: portfolios = [], isLoading } = usePortfolios(tenantId ?? undefined);
  const { data: programas = [] } = useProgramas(tenantId ?? undefined);
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);
  const { data: statusList = [] } = useStatus(tenantId ?? undefined);
  const { data: prioridades = [] } = usePrioridades(tenantId ?? undefined);
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);
  const { data: tiposPortfolio = [] } = useTiposCadastroPorModulo(tenantId ?? undefined, "portfolio");
  const { porProjeto } = useProgressoProjetosDerivado(tenantId ?? undefined);

  const createMut = useCreatePortfolio();
  const updateMut = useUpdatePortfolio();
  const deleteMut = useDeletePortfolio();

  const [formOpen, setFormOpen] = useState(false);
  const [novoPortfolioOpen, setNovoPortfolioOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioRow | null>(null);
  const [treeOpen, setTreeOpen] = useState(true);

  const defaultValues: PortfolioFormValues = {
    nome: "",
    codigo: "",
    objetivo: "",
    justificativa: "Priorização alinhada à estratégia da organização.",
    descricao: "",
    observacoes: "",
    status_id: "",
    prioridade_id: "",
    gestor_id: "",
    tipo_id: "",
    data_inicio_prevista: "",
    data_fim_prevista: "",
    orcamento_previsto: "",
    cor_mapa: "#6366f1",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues,
  });

  const openEdit = useCallback(
    (row: PortfolioRow) => {
      setEditing(row);
      setFormOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!formOpen) return;
    if (editing) {
      reset({
        nome: editing.nome,
        codigo: editing.codigo ?? "",
        objetivo: editing.objetivo,
        justificativa: editing.justificativa ?? defaultValues.justificativa,
        descricao: editing.descricao ?? "",
        observacoes: editing.observacoes ?? "",
        status_id: editing.status_id ?? "",
        prioridade_id: editing.prioridade_id ?? "",
        gestor_id: editing.gestor_id ?? "",
        tipo_id: editing.tipo_id ?? "",
        data_inicio_prevista: editing.data_inicio_prevista?.slice(0, 10) ?? "",
        data_fim_prevista: editing.data_fim_prevista?.slice(0, 10) ?? "",
        orcamento_previsto:
          editing.orcamento_previsto != null ? String(editing.orcamento_previsto) : "",
        cor_mapa: editing.cor_mapa ?? "#6366f1",
      });
    } else {
      reset(defaultValues);
    }
  }, [formOpen, editing, reset]);

  const progsByPort = useMemo(
    () =>
      programas.reduce<Record<string, typeof programas>>((acc, p) => {
        const key = p.portfolio_id ?? "";
        acc[key] = [...(acc[key] ?? []), p];
        return acc;
      }, {}),
    [programas]
  );

  const projsByProg = useMemo(
    () =>
      projetos.reduce<Record<string, typeof projetos>>((acc, p) => {
        const key = p.programa_id ?? "";
        acc[key] = [...(acc[key] ?? []), p];
        return acc;
      }, {}),
    [projetos]
  );

  const countProgramasByPort = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of programas) {
      if (p.portfolio_id) m[p.portfolio_id] = (m[p.portfolio_id] ?? 0) + 1;
    }
    return m;
  }, [programas]);

  /** Conta programas e projetos sob o portfólio (projetos sempre via programa). */
  const countDepsByPortfolio = useCallback(
    (portfolioId: string) => {
      const progs = progsByPort[portfolioId] ?? [];
      const nProgramas = progs.length;
      const nProjetos = progs.reduce((n, g) => n + (projsByProg[g.id]?.length ?? 0), 0);
      return { nProgramas, nProjetos };
    },
    [progsByPort, projsByProg]
  );

  const avgProgressByPort = useMemo(() => {
    const m: Record<string, number> = {};
    for (const port of portfolios) {
      const progs = progsByPort[port.id] ?? [];
      let sum = 0;
      let n = 0;
      for (const prog of progs) {
        for (const pj of projsByProg[prog.id] ?? []) {
          sum += progressoProjetoParaExibicao(pj.id, pj.progresso_percentual, porProjeto);
          n++;
        }
      }
      m[port.id] = n ? Math.round(sum / n) : 0;
    }
    return m;
  }, [portfolios, progsByPort, projsByProg, porProjeto]);

  const emPlanejamento = portfolios.filter((p) =>
    ((p.status as { nome?: string } | null)?.nome ?? "").toLowerCase().includes("planej")
  ).length;
  const emExecucao = portfolios.filter((p) =>
    ((p.status as { nome?: string } | null)?.nome ?? "").toLowerCase().includes("execu")
  ).length;

  const onSubmit = (values: PortfolioFormValues) => {
    if (!tenantId) return;
    const orc = parseOrcamento(values.orcamento_previsto);
    const base = {
      nome: values.nome,
      codigo: emptyToNull(values.codigo),
      objetivo: values.objetivo,
      justificativa: values.justificativa,
      descricao: emptyToNull(values.descricao),
      observacoes: emptyToNull(values.observacoes),
      status_id: emptyToNull(values.status_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      gestor_id: emptyToNull(values.gestor_id),
      tipo_id: emptyToNull(values.tipo_id),
      data_inicio_prevista: emptyToNull(values.data_inicio_prevista),
      data_fim_prevista: emptyToNull(values.data_fim_prevista),
      orcamento_previsto: orc,
      cor_mapa: emptyToNull(values.cor_mapa),
    };

    if (editing) {
      updateMut.mutate(
        { id: editing.id, ...base, tenant_id: tenantId },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMut.mutate(
        { ...base, tenant_id: tenantId, criado_por: user?.id ?? null },
        { onSuccess: () => setFormOpen(false) }
      );
    }
  };

  const openDeletePortfolio = useCallback(
    (port: PortfolioRow) => {
      const { nProgramas, nProjetos } = countDepsByPortfolio(port.id);
      if (nProgramas > 0) {
        toast.error(
          `Não é possível excluir este portfólio: há ${nProgramas} programa(s) e ${nProjetos} projeto(s) vinculado(s). Remova ou mova esses cadastros antes.`
        );
        return;
      }
      setDeleteTarget(port);
    },
    [countDepsByPortfolio]
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { nProgramas } = countDepsByPortfolio(deleteTarget.id);
    if (nProgramas > 0) {
      toast.error("A lista foi atualizada: ainda há programas vinculados. Não é possível excluir.");
      setDeleteTarget(null);
      return;
    }
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const pending = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Portfólios"
        subtitle={`${portfolios.length} portfólio(s) · CRUD em portfolios`}
        actions={
          <Button size="sm" onClick={() => setNovoPortfolioOpen(true)}>
            + Novo Portfólio
          </Button>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total" value={portfolios.length} accent="indigo" />
          <StatCard label="Em planejamento" value={emPlanejamento} accent="cyan" />
          <StatCard label="Em execução" value={emExecucao} accent="emerald" />
          <StatCard label="Programas" value={programas.length} accent="cyan" delta="vinculados" deltaType="up" />
        </div>

        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between gap-3">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Listagem</span>
            <button
              type="button"
              onClick={() => setTreeOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              Hierarquia
              {treeOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
          {isLoading ? (
            <div className="px-5 py-6 text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
          ) : portfolios.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="◈"
                title="Nenhum portfólio cadastrado"
                description="Crie o primeiro portfólio para estruturar programas e projetos."
                actionLabel="+ Criar Portfólio"
                onAction={() => setNovoPortfolioOpen(true)}
              />
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Código", "Portfólio", "Objetivo", "Gestor", "Status", "Prioridade", "Programas", "Orçamento", "Prazo", "Ações"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] border-b border-white/[0.04]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {portfolios.map((port, i) => {
                  const gestorNome = (port.gestor as { nome?: string } | null)?.nome;
                  const cnt = countProgramasByPort[port.id] ?? 0;
                  const obj = port.objetivo ?? "";
                  const objShort = obj.length > 56 ? `${obj.slice(0, 54)}…` : obj;
                  return (
                    <tr
                      key={port.id}
                      className="border-b border-white/[0.04] hover:bg-indigo-500/[0.04] transition-colors last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">{port.codigo ?? "—"}</td>
                      <td className="px-5 py-3 text-[13px] font-medium text-[var(--text-primary)]">{port.nome}</td>
                      <td className="px-5 py-3 text-[12px] text-[var(--text-secondary)] max-w-[220px]" title={obj}>
                        {objShort || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar nome={gestorNome} index={i} />
                          <span className="text-[12px] text-[var(--text-secondary)]">{gestorNome ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge nome={(port.status as { nome?: string } | null)?.nome} />
                      </td>
                      <td className="px-5 py-3">
                        <PrioBadge nome={(port.prioridade as { nome?: string } | null)?.nome} />
                      </td>
                      <td className="px-5 py-3 font-mono text-[12px] text-[var(--accent-bright)]">
                        {cnt} programa{cnt !== 1 ? "s" : ""}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">
                        {formatCurrency(port.orcamento_previsto ?? null)}
                      </td>
                      <td className={cn("px-5 py-3 font-mono text-[11px]", dateColor(port.data_fim_prevista))}>
                        {fmtDate(port.data_fim_prevista)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <AnexosPanel entidadeTipo="portfolio" entidadeId={port.id} compact />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                            onClick={() => openEdit(port)}
                            aria-label="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-rose-400"
                            onClick={() => openDeletePortfolio(port)}
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {treeOpen && portfolios.length > 0 && (
          <div className="border border-white/[0.08] rounded-2xl p-5 bg-[#0d0d12]/80">
            <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] mb-3">Visão em árvore</div>
            <div className="flex flex-col gap-1.5">
              {portfolios.map((port) => {
                const progs = progsByPort[port.id] ?? [];
                const statusNome = (port.status as { nome?: string } | null)?.nome ?? "";
                const prioNome = (port.prioridade as { nome?: string } | null)?.nome ?? "";
                const pct = avgProgressByPort[port.id] ?? 0;
                const gestorTree = (port.gestor as { nome?: string } | null)?.nome ?? "—";
                const tipPort = `Gestor: ${gestorTree}\nOrçamento: ${formatCurrency(port.orcamento_previsto ?? null)}\nProgresso médio: ${pct}%`;
                return (
                  <div key={port.id}>
                    <div
                      className="flex items-center gap-2.5 p-2.5 border border-white/[0.04] rounded-[10px] hover:border-indigo-500/35 hover:bg-indigo-500/[0.04] transition-all"
                      title={tipPort}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)] flex-shrink-0" />
                      <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 cursor-default">{port.nome}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{port.codigo ?? "—"}</span>
                      <div className="flex items-center gap-1.5 w-[72px]">
                        <div className="flex-1 h-1 bg-[#050508] rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full bg-gradient-to-r", progressColor(pct))} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-[var(--accent-bright)]">{pct}%</span>
                      </div>
                      {statusNome && (
                        <span
                          className={cn(
                            "badge text-[10.5px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5",
                            statusToBadgeClass(statusNome)
                          )}
                        >
                          <span className="w-[5px] h-[5px] rounded-full bg-current" />
                          {statusNome}
                        </span>
                      )}
                      {prioNome && <span className={prioToClass(prioNome)}>{prioNome.toUpperCase()}</span>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-[var(--text-muted)] hover:text-indigo-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(port);
                        }}
                        title="Ajustar portfólio"
                        aria-label="Ajustar portfólio"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {progs.map((prog) => {
                      const projs = projsByProg[prog.id] ?? [];
                      const progStatus = (prog.status as { nome?: string } | null)?.nome ?? "";
                      const progGestor = (prog.gestor as { nome?: string } | null)?.nome ?? "—";
                      const nProj = projsByProg[prog.id]?.length ?? 0;
                      const tipProg = `Gestor: ${progGestor}\nProjetos: ${nProj}\nPrazo: ${fmtDate(prog.data_fim_prevista)}`;
                      return (
                        <div key={prog.id}>
                          <div
                            className="ml-6 flex items-center gap-2.5 p-2.5 border border-white/[0.04] rounded-[10px] hover:border-cyan-400/35 hover:bg-cyan-400/[0.03] transition-all mt-1"
                            title={tipProg}
                          >
                            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] flex-shrink-0" />
                            <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{prog.nome}</span>
                            <span className="font-mono text-[10px] text-[var(--text-muted)]">{prog.codigo ?? "—"}</span>
                            {progStatus && (
                              <span
                                className={cn(
                                  "badge text-[10.5px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5",
                                  statusToBadgeClass(progStatus)
                                )}
                              >
                                <span className="w-[5px] h-[5px] rounded-full bg-current" />
                                {progStatus}
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0 text-[var(--text-muted)] hover:text-cyan-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/programas/${prog.id}`);
                              }}
                              title="Ajustar programa"
                              aria-label="Ajustar programa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          {projs.map((pj) => {
                            const pjpct = progressoProjetoParaExibicao(pj.id, pj.progresso_percentual, porProjeto);
                            const pjPrio = (pj.prioridade as { nome?: string } | null)?.nome ?? "";
                            const pjGerente = (pj.gerente as { nome?: string } | null)?.nome ?? "—";
                            const tipPj = `Gerente: ${pjGerente}\nProgresso: ${pjpct}%\nPrazo: ${fmtDate(pj.data_fim_prevista)}`;
                            return (
                              <div
                                key={pj.id}
                                className="ml-12 flex items-center gap-2.5 p-2.5 border border-white/[0.04] rounded-[10px] hover:border-violet-400/35 hover:bg-violet-500/[0.03] transition-all mt-1"
                                title={tipPj}
                              >
                                <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                                <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{pj.nome}</span>
                                <span className="font-mono text-[10px] text-[var(--text-muted)]">{pj.codigo ?? "—"}</span>
                                {pjPrio && <span className={prioToClass(pjPrio)}>{pjPrio.toUpperCase()}</span>}
                                <div className="flex items-center gap-1.5 w-[90px]">
                                  <div className="flex-1 h-1 bg-[#050508] rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full bg-gradient-to-r", progressColor(pjpct))}
                                      style={{ width: `${pjpct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-[var(--accent-bright)]">{pjpct}%</span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 flex-shrink-0 text-[var(--text-muted)] hover:text-violet-400"
                                  title="Abrir tela de edição do projeto"
                                  aria-label="Ajustar projeto"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/projetos/${pj.id}`);
                                  }}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar portfólio" : "Novo portfólio"}</DialogTitle>
            <DialogDescription>
              Dados gravados na tabela <span className="font-mono text-[var(--accent-bright)]">portfolios</span> no Supabase.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Nome *</label>
                <input className={inputClass} {...register("nome")} />
                {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Código</label>
                <input className={inputClass} {...register("codigo")} placeholder="Ex.: PRT-001" />
              </div>
              <div>
                <label className={labelClass}>Cor no mapa</label>
                <input className={cn(inputClass, "h-9 py-1")} type="color" {...register("cor_mapa")} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Objetivo *</label>
                <textarea className={cn(inputClass, "min-h-[72px] resize-y")} {...register("objetivo")} />
                {errors.objetivo && <p className="text-[11px] text-rose-400 mt-1">{errors.objetivo.message}</p>}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Justificativa *</label>
                <textarea className={cn(inputClass, "min-h-[64px] resize-y")} {...register("justificativa")} />
                {errors.justificativa && <p className="text-[11px] text-rose-400 mt-1">{errors.justificativa.message}</p>}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea className={cn(inputClass, "min-h-[56px] resize-y")} {...register("descricao")} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} {...register("status_id")}>
                  <option value="">—</option>
                  {statusList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Prioridade</label>
                <select className={inputClass} {...register("prioridade_id")}>
                  <option value="">—</option>
                  {prioridades.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Gestor</label>
                <select className={inputClass} {...register("gestor_id")}>
                  <option value="">—</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select className={inputClass} {...register("tipo_id")}>
                  <option value="">—</option>
                  {tiposPortfolio.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Início previsto</label>
                <input className={inputClass} type="date" {...register("data_inicio_prevista")} />
              </div>
              <div>
                <label className={labelClass}>Fim previsto</label>
                <input className={inputClass} type="date" {...register("data_fim_prevista")} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Orçamento previsto (BRL)</label>
                <input className={inputClass} {...register("orcamento_previsto")} placeholder="0,00" />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Observações</label>
                <textarea className={cn(inputClass, "min-h-[56px] resize-y")} {...register("observacoes")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : editing ? "Salvar alterações" : "Criar portfólio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ModalNovoPortfolio open={novoPortfolioOpen} onClose={() => setNovoPortfolioOpen(false)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir portfólio?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Só é possível excluir portfólios sem programas ou projetos vinculados.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="danger" disabled={deleteMut.isPending} onClick={confirmDelete}>
              {deleteMut.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
