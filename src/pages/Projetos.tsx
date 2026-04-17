import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useProjetos, useDeleteProjeto } from "@/hooks/useProjetos";
import { useProgramas } from "@/hooks/useProgramas";
import { useStatus } from "@/hooks/useStatus";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge, PrioBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { AvatarStack } from "@/components/ui/avatar";
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
import { cn, fmtDate, dateColor } from "@/lib/utils";
import { progressoProjetoParaExibicao } from "@/lib/progressoComSubatividades";
import { useProgressoProjetosDerivado } from "@/hooks/useProgressoProjetosDerivado";
import { ModalNovoProjeto } from "@/components/modals/ModalNovoProjeto";
import { usePrioridades } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";

type ProjetoRow = NonNullable<ReturnType<typeof useProjetos>["data"]>[number];

type ProjetoFilters = {
  programaId: string;
  statusId: string;
  prioridadeId: string;
  gerenteId: string;
  busca: string;
  somenteAtrasados: boolean;
};

const FILTERS_EMPTY: ProjetoFilters = {
  programaId: "",
  statusId: "",
  prioridadeId: "",
  gerenteId: "",
  busca: "",
  somenteAtrasados: false,
};

const selectFilterClass =
  "w-full bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none cursor-pointer";

const inputFilterClass =
  "w-full bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none placeholder:text-[var(--text-muted)]";

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function projetoStatusId(p: ProjetoRow): string | null {
  const row = p as ProjetoRow & { status_id?: string | null; status?: unknown };
  if (row.status_id) return row.status_id;
  const s = row.status;
  if (!s || typeof s !== "object") return null;
  if (Array.isArray(s)) return (s[0] as { id?: string })?.id ?? null;
  return (s as { id?: string }).id ?? null;
}

function projetoStatusNome(p: ProjetoRow): string {
  const row = p as { status?: { nome?: string } | { nome?: string }[] | null };
  const s = row.status;
  if (!s) return "";
  if (Array.isArray(s)) return s[0]?.nome ?? "";
  return (s as { nome?: string }).nome ?? "";
}

function projetoPrioridadeId(p: ProjetoRow): string | null {
  const row = p as ProjetoRow & { prioridade_id?: string | null; prioridade?: unknown };
  if (row.prioridade_id) return row.prioridade_id;
  const pr = row.prioridade;
  if (!pr || typeof pr !== "object") return null;
  if (Array.isArray(pr)) return (pr[0] as { id?: string })?.id ?? null;
  return (pr as { id?: string }).id ?? null;
}

function projetoGerenteId(p: ProjetoRow): string | null {
  const row = p as ProjetoRow & { gerente_projeto_id?: string | null; gerente?: unknown };
  if (row.gerente_projeto_id) return row.gerente_projeto_id;
  const g = row.gerente;
  if (!g || typeof g !== "object") return null;
  if (Array.isArray(g)) return (g[0] as { id?: string })?.id ?? null;
  return (g as { id?: string }).id ?? null;
}

export default function Projetos() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { data: projetos = [], isLoading } = useProjetos(tenantId ?? undefined);
  const { data: programas = [] } = useProgramas(tenantId ?? undefined);
  const { data: statusProjeto = [] } = useStatus(tenantId ?? undefined, "projeto");
  const { data: prioridades = [] } = usePrioridades(tenantId ?? undefined);
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);
  const { porProjeto } = useProgressoProjetosDerivado(tenantId ?? undefined);
  const deleteMut = useDeleteProjeto();
  const [tab, setTab] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjetoRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ProjetoFilters>(FILTERS_EMPTY);

  const idsPorAba = useMemo(() => {
    const exec = new Set<string>();
    const rev = new Set<string>();
    const conc = new Set<string>();
    for (const st of statusProjeto) {
      const n = stripAccents(st.nome);
      if (n.includes("execucao")) exec.add(st.id);
      if (n.includes("revisao")) rev.add(st.id);
      if (n.includes("conclu")) conc.add(st.id);
    }
    return { exec, rev, conc };
  }, [statusProjeto]);

  const matchTab = (p: ProjetoRow, t: string) => {
    if (t === "todos") return true;
    const sid = projetoStatusId(p);
    const nome = stripAccents(projetoStatusNome(p));
    if (sid) {
      if (t === "execucao") return idsPorAba.exec.has(sid) || nome.includes("execucao");
      if (t === "revisao") return idsPorAba.rev.has(sid) || nome.includes("revisao");
      if (t === "concluidos") return idsPorAba.conc.has(sid) || nome.includes("conclu");
    }
    if (t === "execucao") return nome.includes("execucao");
    if (t === "revisao") return nome.includes("revisao");
    if (t === "concluidos") return nome.includes("conclu");
    return true;
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.programaId) n++;
    if (filters.statusId) n++;
    if (filters.prioridadeId) n++;
    if (filters.gerenteId) n++;
    if (filters.busca.trim()) n++;
    if (filters.somenteAtrasados) n++;
    return n;
  }, [filters]);

  const applyFilters = (p: ProjetoRow) => {
    if (filters.programaId && p.programa_id !== filters.programaId) return false;
    if (filters.statusId && projetoStatusId(p) !== filters.statusId) return false;
    if (filters.prioridadeId && projetoPrioridadeId(p) !== filters.prioridadeId) return false;
    if (filters.gerenteId && projetoGerenteId(p) !== filters.gerenteId) return false;
    if (filters.busca.trim()) {
      const q = stripAccents(filters.busca.trim());
      const nome = stripAccents(p.nome ?? "");
      const cod = stripAccents(p.codigo ?? "");
      if (!nome.includes(q) && !cod.includes(q)) return false;
    }
    if (filters.somenteAtrasados) {
      const pct = progressoProjetoParaExibicao(p.id, p.progresso_percentual, porProjeto);
      const atrasado = !!p.data_fim_prevista && new Date(p.data_fim_prevista) < new Date() && pct < 100;
      if (!atrasado) return false;
    }
    return true;
  };

  const base = projetos.filter(applyFilters);

  const filtered = base.filter((p) => matchTab(p, tab));

  const counts = {
    todos: base.length,
    execucao: base.filter((p) => matchTab(p, "execucao")).length,
    revisao: base.filter((p) => matchTab(p, "revisao")).length,
    concluidos: base.filter((p) => matchTab(p, "concluidos")).length,
  };

  const tabs = [
    { key: "todos", label: `Todos (${counts.todos})` },
    { key: "execucao", label: `Em Execução (${counts.execucao})` },
    { key: "revisao", label: `Em Revisão (${counts.revisao})` },
    { key: "concluidos", label: `Concluídos (${counts.concluidos})` },
  ];

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projetos"
        subtitle={`${filtered.length} projeto(s) exibido(s) · ${projetos.length} cadastrados`}
        actions={
          <>
            <Button variant="secondary" size="sm" type="button" onClick={() => setFiltersOpen(true)}>
              ⊟ Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </Button>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              + Novo Projeto
            </Button>
          </>
        }
      />
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription>
              Refine a lista por programa, status, prioridade, gerente de projeto ou busca por nome/código.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Programa</label>
              <select
                className={selectFilterClass}
                value={filters.programaId}
                onChange={(e) => setFilters((f) => ({ ...f, programaId: e.target.value }))}
              >
                <option value="">Todos</option>
                {programas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.codigo ? `${g.codigo} · ` : ""}
                    {g.nome}
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
                {statusProjeto.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Prioridade</label>
                <select
                  className={selectFilterClass}
                  value={filters.prioridadeId}
                  onChange={(e) => setFilters((f) => ({ ...f, prioridadeId: e.target.value }))}
                >
                  <option value="">Todas</option>
                  {prioridades.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Gerente</label>
                <select
                  className={selectFilterClass}
                  value={filters.gerenteId}
                  onChange={(e) => setFilters((f) => ({ ...f, gerenteId: e.target.value }))}
                >
                  <option value="">Todos</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">Buscar</label>
              <input
                type="search"
                className={inputFilterClass}
                placeholder="Nome ou código do projeto…"
                value={filters.busca}
                onChange={(e) => setFilters((f) => ({ ...f, busca: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-[12px] text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={filters.somenteAtrasados}
                onChange={(e) => setFilters((f) => ({ ...f, somenteAtrasados: e.target.checked }))}
                className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
              />
              Somente atrasados (vencidos e não concluídos)
            </label>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFilters(FILTERS_EMPTY)}
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

      <ModalNovoProjeto open={modalOpen} onClose={() => setModalOpen(false)} />
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
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando projetos...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="◇"
            title={projetos.length === 0 ? "Nenhum projeto encontrado" : "Nenhum resultado"}
            description={
              projetos.length === 0
                ? "Crie o primeiro projeto do seu portfólio."
                : "Não há projetos nesta combinação de aba e filtros. Ajuste ou limpe os filtros."
            }
            actionLabel={
              projetos.length === 0 ? "+ Novo Projeto" : activeFilterCount > 0 ? "Limpar filtros" : "Ver todos"
            }
            onAction={() => {
              if (projetos.length === 0) setModalOpen(true);
              else if (activeFilterCount > 0) setFilters(FILTERS_EMPTY);
              else setTab("todos");
            }}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 pb-7">
            {filtered.map((p) => {
              const pct = progressoProjetoParaExibicao(p.id, p.progresso_percentual, porProjeto);
              const gerenteNome = (p.gerente as { nome?: string } | null)?.nome;
              return (
                <div
                  key={p.id}
                  className="project-card hover:border-indigo-500/25 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[#1A1A2E] border border-white/[0.04] px-1.5 py-0.5 rounded">
                      {p.codigo ?? "—"}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StatusBadge nome={projetoStatusNome(p)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                        title="Ajustar projeto"
                        aria-label="Ajustar projeto"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projetos/${p.id}`);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--text-muted)] hover:text-rose-400"
                        title="Excluir projeto"
                        aria-label="Excluir projeto"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(p);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="font-display font-bold text-[14px] tracking-tight text-[var(--text-primary)] mb-1.5 leading-snug">
                    {p.nome}
                  </div>
                  <div className="text-[11.5px] text-[var(--text-secondary)] leading-relaxed mb-3.5 line-clamp-2">
                    {p.objetivo ?? "Sem descrição"}
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] text-[var(--text-muted)]">Progresso</span>
                      <span className="text-[10px] font-mono text-[var(--accent-bright)]">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} showLabel={false} />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                    <AvatarStack nomes={[gerenteNome]} />
                    <div className="flex items-center gap-2">
                      <PrioBadge nome={(p.prioridade as { nome?: string } | null)?.nome} />
                      <span className={cn("text-[10.5px] font-mono", dateColor(p.data_fim_prevista))}>
                        ⏱ {fmtDate(p.data_fim_prevista)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="project-card flex items-center justify-center min-h-[180px] border-dashed hover:border-indigo-500/35 transition-colors text-left w-full"
            >
              <div className="text-center">
                <div className="text-[22px] mb-2 opacity-30">⊕</div>
                <div className="text-[12.5px] text-[var(--text-muted)]">Novo Projeto</div>
              </div>
            </button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Só é possível excluir se não houver atividades, riscos, marcos, alocações de recurso, stakeholders ou outros vínculos ao projeto.`
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
