import { useCallback, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useRecursos, useDeleteRecurso } from "@/hooks/useRecursos";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
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
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ModalNovoRecurso } from "@/components/modals/ModalNovoRecurso";

type RecursoRow = NonNullable<ReturnType<typeof useRecursos>["data"]>[number];

export default function Recursos() {
  const { tenantId } = useTenant();
  const { data: recursos = [], isLoading } = useRecursos(tenantId ?? undefined);
  const deleteMut = useDeleteRecurso();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecursoId, setEditRecursoId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecursoRow | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setEditRecursoId(null);
  };

  const openDeleteRecurso = useCallback((r: RecursoRow) => {
    const usado = r.horas_alocadas ?? 0;
    if (usado > 0) {
      toast.error(
        "Não é possível excluir este recurso: há alocações ativas. Remova as alocações nos projetos antes."
      );
      return;
    }
    setDeleteTarget(r);
  }, []);

  const confirmDeleteRecurso = () => {
    if (!deleteTarget) return;
    if ((deleteTarget.horas_alocadas ?? 0) > 0) {
      toast.error("A lista foi atualizada: ainda há horas alocadas. Não é possível excluir.");
      setDeleteTarget(null);
      return;
    }
    deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const sobrealoc = recursos.filter((r) => {
    const cap = r.capacidade_horas_semana ?? 40;
    return (r.horas_alocadas ?? 0) > cap;
  }).length;
  const disponiveis = recursos.filter((r) => (r.horas_alocadas ?? 0) === 0).length;
  const alocados = recursos.length - disponiveis - sobrealoc;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Recursos"
        subtitle={`${recursos.length} recurso(s) · ${sobrealoc} sobrealocado(s)`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditRecursoId(null);
              setModalOpen(true);
            }}
          >
            + Novo Recurso
          </Button>
        }
      />
      <ModalNovoRecurso open={modalOpen} onClose={closeModal} editId={editRecursoId} />
      <div className="p-7 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Recursos" value={recursos.length} accent="indigo" />
          <StatCard label="Disponíveis" value={disponiveis} accent="emerald" delta="sem alocação" deltaType="up" />
          <StatCard label="Alocados" value={alocados} accent="cyan" />
          <StatCard
            label="Sobrealocados"
            value={sobrealoc}
            accent="amber"
            delta={sobrealoc > 0 ? "⚠ ação necessária" : "— tudo ok"}
            deltaType={sobrealoc > 0 ? "warn" : "neutral"}
          />
        </div>

        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : recursos.length === 0 ? (
          <EmptyState
            icon="◉"
            title="Nenhum recurso cadastrado"
            description="Cadastre recursos humanos ou materiais para alocação nos projetos."
            actionLabel="+ Novo Recurso"
            onAction={() => {
              setEditRecursoId(null);
              setModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {recursos.map((r, i) => {
              const cap = r.capacidade_horas_semana ?? 40;
              const usado = r.horas_alocadas ?? 0;
              const pct = Math.min(Math.round((usado / (cap || 1)) * 100), 130);
              const sobreAloc = usado > cap;
              const fillColor = sobreAloc ? "from-rose-500 to-amber-400" : "from-emerald-500 to-cyan-400";
              const capColor = sobreAloc ? "text-rose-400" : "text-emerald-400";
              return (
                <div
                  key={r.id}
                  className="bg-[#141424] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar nome={(r.usuario as { nome?: string } | null)?.nome ?? r.nome} index={i} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[var(--text-primary)] truncate">{r.nome}</div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)]">
                        {(r.tipo as { nome?: string } | null)?.nome ?? "—"}
                      </div>
                    </div>
                    {sobreAloc ? (
                      <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded animate-pulse">
                        SOBREALOC.
                      </span>
                    ) : usado > 0 ? (
                      <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                        Alocado
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        Disponível
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-[var(--text-muted)] hover:text-indigo-400 -mr-1"
                      title="Editar recurso"
                      aria-label="Editar recurso"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditRecursoId(r.id);
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
                      title="Excluir recurso"
                      aria-label="Excluir recurso"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteRecurso(r);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-[var(--text-muted)]">Carga semanal</span>
                      <span className={cn("text-[10px] font-mono", capColor)}>
                        {usado}h / {cap}h
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#050508] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full bg-gradient-to-r", fillColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      {r.custo_hora ? `${formatCurrency(Number(r.custo_hora))}/h` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Só é possível excluir recursos sem alocações em projetos.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="danger" disabled={deleteMut.isPending} onClick={confirmDeleteRecurso}>
              {deleteMut.isPending ? "Excluindo…" : "Excluir"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
