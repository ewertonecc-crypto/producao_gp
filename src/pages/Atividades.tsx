import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Cronometro, formatarHorasDecimais } from "@/components/ui/cronometro";
import { SubatividadesList } from "@/components/subatividades/SubatividadesList";
import { useSubatividadesResumo } from "@/hooks/useSubatividades";
import { useTenant } from "@/hooks/useTenant";
import { useAtividades, useDeleteAtividade } from "@/hooks/useAtividades";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge, PrioBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, fmtPrevisao, dateColor } from "@/lib/utils";
import { percentualAtividadeComSubatividades } from "@/lib/progressoComSubatividades";
import { ModalNovaAtividade } from "@/components/modals/ModalNovaAtividade";
import { RegistrosTempoPopover } from "@/components/ui/registros-tempo-popover";
import { AnexosPanel } from "@/components/ui/AnexosPanel";

type AtividadeRow = NonNullable<ReturnType<typeof useAtividades>["data"]>[number];

type TabKey = "todas" | "fazer" | "andamento" | "revisao" | "aceitas";

type AtividadeFilters = {
  projetoId: string;
  statusId: string;
  categoriaId: string;
  prioridadeId: string;
  responsavelId: string;
  somenteAtrasadas: boolean;
};

const FILTERS_EMPTY: AtividadeFilters = {
  projetoId: "",
  statusId: "",
  categoriaId: "",
  prioridadeId: "",
  responsavelId: "",
  somenteAtrasadas: false,
};

const selectFilterClass =
  "w-full bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none cursor-pointer";

type AtividadeStatusBucket = { nome?: string | null; is_final?: boolean | null } | null | undefined;

/** Aceite explícito (cliente) ou coluna Kanban "Aceita" / status final de aceite (alinha com is_final em Configurações). */
function statusIndicaAceitas(st: AtividadeStatusBucket): boolean {
  if (!st) return false;
  const raw = (st.nome ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (raw.includes("rejeit") || raw.includes("cancel")) return false;
  return /\baceita\b/.test(raw);
}

function bucketAtividade(a: { status_aceite: string | null; status: unknown }): Exclude<TabKey, "todas"> {
  const st = a.status as AtividadeStatusBucket;
  const n = (st?.nome ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const ac = a.status_aceite ?? "";
  if (ac === "aceita" || statusIndicaAceitas(st)) return "aceitas";
  if (ac === "enviada" || n.includes("revis")) return "revisao";
  if (n.includes("andamento") || n.includes("execu")) return "andamento";
  return "fazer";
}

type NivelExecucao = "atividade" | "subatividade";

export default function Atividades() {
  const { tenantId } = useTenant();
  const { data: atividades = [], isLoading } = useAtividades(tenantId ?? undefined);
  const deleteMut = useDeleteAtividade();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("todas");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<AtividadeFilters>(FILTERS_EMPTY);
  const [modalOpen, setModalOpen] = useState(false);
  const [editAtividadeId, setEditAtividadeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AtividadeRow | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  /** Nível de execução por atividade: "atividade" (tempo direto) | "subatividade" (tempo nas subs) */
  const [nivelExecucao, setNivelExecucao] = useState<Record<string, NivelExecucao>>({});

  const closeModal = () => {
    setModalOpen(false);
    setEditAtividadeId(null);
  };

  const salvarTempoAtividade = async (atividadeId: string, horasJa: number | null | undefined, segundos: number) => {
    const horasNovas = segundos / 3600;
    const horasTotal = (horasJa ?? 0) + horasNovas;
    await supabase.from("atividades").update({ horas_realizadas: horasTotal }).eq("id", atividadeId);
    await (supabase as any).from("registros_tempo").insert({
      tenant_id: tenantId,
      atividade_id: atividadeId,
      segundos,
    });
    qc.invalidateQueries({ queryKey: ["atividades"] });
    qc.invalidateQueries({ queryKey: ["registros_tempo", atividadeId, null] });
  };

  const getNivel = (id: string): NivelExecucao => nivelExecucao[id] ?? "subatividade";
  const setNivel = (id: string, nivel: NivelExecucao) =>
    setNivelExecucao((prev) => ({ ...prev, [id]: nivel }));

  const aguardando = useMemo(
    () => atividades.filter((a) => a.status_aceite === "enviada" || ((a.status as { nome?: string } | null)?.nome ?? "").toLowerCase().includes("revis")).length,
    [atividades]
  );

  const counts = useMemo(() => {
    const c = { fazer: 0, andamento: 0, revisao: 0, aceitas: 0 };
    for (const a of atividades) {
      const b = bucketAtividade(a);
      c[b]++;
    }
    return c;
  }, [atividades]);

  const byTab = useMemo(() => {
    if (tab === "todas") return atividades;
    return atividades.filter((a) => bucketAtividade(a) === tab);
  }, [atividades, tab]);

  const projetoOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) {
      const p = a.projeto as { id?: string; codigo?: string; nome?: string } | null;
      if (p?.id) map.set(p.id, p.codigo ?? p.nome ?? p.id);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "pt-BR"));
  }, [atividades]);

  const statusOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) {
      const s = a.status as { id?: string; nome?: string } | null;
      if (s?.id) map.set(s.id, s.nome ?? s.id);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "pt-BR"));
  }, [atividades]);

  const categoriaOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) {
      const c = a.categoria as { id?: string; nome?: string } | null;
      if (c?.id) map.set(c.id, c.nome ?? c.id);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "pt-BR"));
  }, [atividades]);

  const prioridadeOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) {
      const p = a.prioridade as { id?: string; nome?: string } | null;
      if (p?.id) map.set(p.id, p.nome ?? p.id);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "pt-BR"));
  }, [atividades]);

  const responsavelOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of atividades) {
      const r = a.responsavel as { id?: string; nome?: string } | null;
      if (r?.id) map.set(r.id, r.nome ?? r.id);
    }
    return [...map.entries()].sort((x, y) => x[1].localeCompare(y[1], "pt-BR"));
  }, [atividades]);

  const byTabIds = useMemo(() => byTab.map((a) => a.id), [byTab]);
  const { data: subResumo, isPending: subResumoPending, isError: subResumoError } =
    useSubatividadesResumo(byTabIds);

  const filtered = useMemo(() => {
    return byTab.filter((a) => {
      if (filters.projetoId && (a.projeto as { id?: string } | null)?.id !== filters.projetoId) return false;
      if (filters.statusId && (a.status as { id?: string } | null)?.id !== filters.statusId) return false;
      if (filters.categoriaId && (a.categoria as { id?: string } | null)?.id !== filters.categoriaId) return false;
      if (filters.prioridadeId && (a.prioridade as { id?: string } | null)?.id !== filters.prioridadeId) return false;
      if (filters.responsavelId && (a.responsavel as { id?: string } | null)?.id !== filters.responsavelId) return false;
      if (filters.somenteAtrasadas) {
        const sub = subResumo?.get(a.id);
        const pct = percentualAtividadeComSubatividades(a.percentual_concluido, sub);
        const atrasado =
          !!a.data_fim_prevista && new Date(a.data_fim_prevista) < new Date() && pct < 100;
        if (!atrasado) return false;
      }
      return true;
    });
  }, [byTab, filters, subResumo]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.projetoId) n++;
    if (filters.statusId) n++;
    if (filters.categoriaId) n++;
    if (filters.prioridadeId) n++;
    if (filters.responsavelId) n++;
    if (filters.somenteAtrasadas) n++;
    return n;
  }, [filters]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "todas", label: `Todas (${atividades.length})` },
    { key: "fazer", label: `A Fazer (${counts.fazer})` },
    { key: "andamento", label: `Em Andamento (${counts.andamento})` },
    { key: "revisao", label: `Ag. Revisão (${counts.revisao})` },
    { key: "aceitas", label: `Aceitas (${counts.aceitas})` },
  ];

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Atividades"
        subtitle={`${filtered.length} atividade(s) exibida(s) · ${aguardando} aguardando revisão`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)}>
              ⊟ Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditAtividadeId(null);
                setModalOpen(true);
              }}
            >
              + Nova Atividade
            </Button>
          </>
        }
      />
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription>Refine a lista por projeto, status, categoria, prioridade ou responsável.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Projeto</label>
              <select
                className={selectFilterClass}
                value={filters.projetoId}
                onChange={(e) => setFilters((f) => ({ ...f, projetoId: e.target.value }))}
              >
                <option value="">Todos</option>
                {projetoOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Status</label>
              <select
                className={selectFilterClass}
                value={filters.statusId}
                onChange={(e) => setFilters((f) => ({ ...f, statusId: e.target.value }))}
              >
                <option value="">Todos</option>
                {statusOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Categoria</label>
                <select
                  className={selectFilterClass}
                  value={filters.categoriaId}
                  onChange={(e) => setFilters((f) => ({ ...f, categoriaId: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {categoriaOptions.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Prioridade</label>
                <select
                  className={selectFilterClass}
                  value={filters.prioridadeId}
                  onChange={(e) => setFilters((f) => ({ ...f, prioridadeId: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {prioridadeOptions.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Responsável</label>
              <select
                className={selectFilterClass}
                value={filters.responsavelId}
                onChange={(e) => setFilters((f) => ({ ...f, responsavelId: e.target.value }))}
              >
                <option value="">Todos</option>
                {responsavelOptions.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-[12px] text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={filters.somenteAtrasadas}
                onChange={(e) => setFilters((f) => ({ ...f, somenteAtrasadas: e.target.checked }))}
                className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
              />
              Somente atrasadas (vencidas e não concluídas)
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(FILTERS_EMPTY);
              }}
              disabled={activeFilterCount === 0}
            >
              Limpar
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalNovaAtividade open={modalOpen} onClose={closeModal} editId={editAtividadeId} />
      <div className="px-7 pt-5 flex flex-col gap-4">
        <div className="flex gap-0 border-b border-white/[0.04] overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2.5 text-[12.5px] cursor-pointer border-b-2 -mb-px transition-all whitespace-nowrap",
                tab === t.key
                  ? "text-[var(--accent-bright)] border-indigo-500"
                  : "text-[var(--text-muted)] border-transparent hover:text-[var(--text-secondary)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="✦"
            title={atividades.length === 0 ? "Nenhuma atividade encontrada" : "Nenhum resultado"}
            description={
              atividades.length === 0
                ? "Crie atividades e associe-as aos projetos."
                : "Não há atividades nesta combinação de aba e filtros. Ajuste ou limpe os filtros."
            }
            actionLabel={atividades.length === 0 ? "+ Nova Atividade" : activeFilterCount > 0 ? "Limpar filtros" : "Ver todas"}
            onAction={() => {
              if (atividades.length === 0) {
                setEditAtividadeId(null);
                setModalOpen(true);
              } else if (activeFilterCount > 0) {
                setFilters(FILTERS_EMPTY);
              } else {
                setTab("todas");
              }
            }}
          />
        ) : (
          <div className="flex flex-col gap-2.5 pb-7">
            {filtered.map((a, i) => {
              const pct = percentualAtividadeComSubatividades(a.percentual_concluido, subResumo?.get(a.id));
              const statusCor = (a.status as { cor?: string } | null)?.cor ?? "#818CF8";
              const atrasado = a.data_fim_prevista && new Date(a.data_fim_prevista) < new Date() && pct < 100;
              const isExpanded = expandida === a.id;
              const sub = subResumo?.get(a.id);
              const subFrac =
                subResumoError
                  ? "—/—"
                  : subResumo == null
                    ? subResumoPending
                      ? "—/—"
                      : "0/0"
                    : `${sub?.total ?? 0}/${sub?.concluidas ?? 0}`;
              return (
                <div
                  key={a.id}
                  className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all"
                >
                  {/* Linha principal */}
                  <div className="px-4 py-3.5 flex items-center gap-3.5 cursor-pointer"
                    onClick={() => setExpandida(isExpanded ? null : a.id)}
                  >
                    <div className="w-0.5 h-9 rounded-full flex-shrink-0" style={{ background: statusCor }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{a.nome}</div>
                      <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                        <span className="font-mono text-[10.5px] text-[var(--text-muted)]">{a.codigo ?? "—"}</span>
                        <span className="font-mono text-[10.5px] text-[var(--accent-bright)]">
                          {(a.projeto as { codigo?: string; nome?: string } | null)?.codigo ??
                            (a.projeto as { codigo?: string; nome?: string } | null)?.nome ??
                            "—"}
                        </span>
                        <span className="text-[10.5px] text-[var(--text-secondary)]">
                          {(a.categoria as { nome?: string } | null)?.nome ?? "—"}
                        </span>
                        <StatusBadge nome={(a.status as { nome?: string } | null)?.nome} />
                        <PrioBadge nome={(a.prioridade as { nome?: string } | null)?.nome} />
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandida(isExpanded ? null : a.id); }}
                          className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-bright)] transition-colors"
                          title="Subatividades existentes / executadas (exceto canceladas no total)"
                        >
                          <span className="tabular-nums text-[var(--text-secondary)]">{subFrac}</span>
                          {isExpanded ? "▲ Fechar" : "▼ Subatividades"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Avatar nome={(a.responsavel as { nome?: string } | null)?.nome} index={i} />
                      <span
                        className={cn("text-[10.5px] font-mono", atrasado ? "text-rose-400" : dateColor(a.data_fim_prevista))}
                      >
                        {atrasado ? "⏱ ATRASO" : `⏱ ${fmtPrevisao(a.data_fim_prevista)}`}
                      </span>
                      {/* Horas realizadas totais da atividade */}
                      {(a as { horas_realizadas?: number | null }).horas_realizadas != null &&
                        (a as { horas_realizadas?: number | null }).horas_realizadas! > 0 && (
                        <span className="text-[10.5px] font-mono text-cyan-400" title="Horas executadas">
                          🕐 {formatarHorasDecimais((a as { horas_realizadas?: number | null }).horas_realizadas!)}
                        </span>
                      )}
                      <div className="w-[80px]">
                        <ProgressBar value={pct} />
                      </div>

                      {/* Seletor de nível + cronômetro */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex rounded-[8px] overflow-hidden border border-white/[0.08] text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setNivel(a.id, "atividade")}
                            className={cn(
                              "px-2 py-1 transition-colors",
                              getNivel(a.id) === "atividade"
                                ? "bg-indigo-500/30 text-indigo-300"
                                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                            )}
                            title="Registrar tempo diretamente na atividade"
                          >
                            Ativ.
                          </button>
                          <button
                            type="button"
                            onClick={() => setNivel(a.id, "subatividade")}
                            className={cn(
                              "px-2 py-1 transition-colors border-l border-white/[0.08]",
                              getNivel(a.id) === "subatividade"
                                ? "bg-indigo-500/30 text-indigo-300"
                                : "text-[var(--text-dim)] hover:text-[var(--text-muted)]"
                            )}
                            title="Registrar tempo nas subatividades"
                          >
                            Sub.
                          </button>
                        </div>
                        {getNivel(a.id) === "atividade" && (
                          <>
                            <Cronometro
                              id={`ativ-${a.id}`}
                              horasAcumuladas={(a as { horas_realizadas?: number | null }).horas_realizadas}
                              onSalvar={(s) => salvarTempoAtividade(a.id, (a as { horas_realizadas?: number | null }).horas_realizadas, s)}
                            />
                            <RegistrosTempoPopover atividadeId={a.id} />
                          </>
                        )}
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        <AnexosPanel entidadeTipo="atividade" entidadeId={a.id} compact />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-[var(--text-muted)] hover:text-indigo-400"
                        title="Editar atividade"
                        aria-label="Editar atividade"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditAtividadeId(a.id);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 text-[var(--text-muted)] hover:text-rose-400"
                        title="Excluir atividade"
                        aria-label="Excluir atividade"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(a);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Painel de subatividades expandido */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-[#141424] border-t border-white/[0.04] flex flex-col gap-4">
                      <SubatividadesList
                        atividadeId={a.id}
                        dataInicioPrevista={a.data_inicio_prevista}
                        dataFimPrevista={a.data_fim_prevista}
                        mostrarCronometro={getNivel(a.id) === "subatividade"}
                      />
                      <div className="border-t border-white/[0.04] pt-3">
                        <AnexosPanel entidadeTipo="atividade" entidadeId={a.id} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Não é possível excluir se houver alocações de recurso vinculadas à atividade.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="danger"
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
              }}
            >
              {deleteMut.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
