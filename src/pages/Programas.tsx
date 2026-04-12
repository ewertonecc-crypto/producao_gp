import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useProgramas, useDeletePrograma } from "@/hooks/useProgramas";
import { useProjetos } from "@/hooks/useProjetos";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/ui/stat-card";
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
import { cn, fmtDate, dateColor } from "@/lib/utils";
import { toast } from "sonner";
import { ModalNovoPrograma } from "@/components/modals/ModalNovoPrograma";

type ProgramaRow = NonNullable<ReturnType<typeof useProgramas>["data"]>[number];

export default function Programas() {
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { data: programas = [], isLoading } = useProgramas(tenantId ?? undefined);
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);
  const deleteMut = useDeletePrograma();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProgramaRow | null>(null);

  const countByProg = projetos.reduce<Record<string, number>>((acc, p) => {
    acc[p.programa_id] = (acc[p.programa_id] ?? 0) + 1;
    return acc;
  }, {});

  const openDeletePrograma = useCallback(
    (row: ProgramaRow) => {
      const n = countByProg[row.id] ?? 0;
      if (n > 0) {
        toast.error(
          `Não é possível excluir este programa: há ${n} projeto(s) vinculado(s). Remova ou mova os projetos antes.`
        );
        return;
      }
      setDeleteTarget(row);
    },
    [countByProg]
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const n = countByProg[deleteTarget.id] ?? 0;
    if (n > 0) {
      toast.error("A lista foi atualizada: ainda há projetos vinculados. Não é possível excluir.");
      setDeleteTarget(null);
      return;
    }
    deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const avgByProg = projetos.reduce<Record<string, number>>((acc, p) => {
    const cnt = countByProg[p.programa_id] ?? 1;
    acc[p.programa_id] = ((acc[p.programa_id] ?? 0) + (p.progresso_percentual ?? 0)) / cnt;
    return acc;
  }, {});

  const emExec = programas.filter((p) => ((p.status as { nome?: string } | null)?.nome ?? "").toLowerCase().includes("execu")).length;
  const comAtraso = programas.filter((p) => p.data_fim_prevista && new Date(p.data_fim_prevista) < new Date()).length;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Programas"
        subtitle={`${programas.length} programa(s) · tabela: programas`}
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            + Novo Programa
          </Button>
        }
      />
      <ModalNovoPrograma open={modalOpen} onClose={() => setModalOpen(false)} />
      <div className="p-7 flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Programas" value={programas.length} accent="indigo" />
          <StatCard label="Em Execução" value={emExec} accent="cyan" delta="ativos" deltaType="up" />
          <StatCard label="Projetos Vinculados" value={projetos.length} accent="emerald" delta="no tenant" deltaType="up" />
          <StatCard
            label="Com Atraso"
            value={comAtraso}
            accent="amber"
            delta={comAtraso > 0 ? "⚠ atenção" : "— ok"}
            deltaType={comAtraso > 0 ? "warn" : "neutral"}
          />
        </div>

        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Todos os Programas</span>
          </div>
          {isLoading ? (
            <div className="px-5 py-6 text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
          ) : programas.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="◉"
                title="Nenhum programa cadastrado"
                description="Crie programas para agrupar projetos dentro de um portfólio."
                actionLabel="+ Novo Programa"
                onAction={() => setModalOpen(true)}
              />
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Código", "Programa", "Portfólio", "Gestor", "Status", "Projetos", "Progresso", "Prazo", "Ações"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] border-b border-white/[0.04]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programas.map((p, i) => {
                  const cnt = countByProg[p.id] ?? 0;
                  const avg = Math.round(avgByProg[p.id] ?? 0);
                  const gestorNome = (p.gestor as { nome?: string } | null)?.nome;
                  const portCodigo =
                    (p.portfolio as { codigo?: string; nome?: string } | null)?.codigo ??
                    (p.portfolio as { codigo?: string; nome?: string } | null)?.nome ??
                    "—";
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-white/[0.04] hover:bg-indigo-500/[0.04] transition-colors last:border-0"
                    >
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">{p.codigo ?? "—"}</td>
                      <td className="px-5 py-3 text-[13px] font-medium text-[var(--text-primary)]">{p.nome}</td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[10.5px] text-[var(--text-muted)] bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded">
                          {portCodigo}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar nome={gestorNome} index={i} />
                          <span className="text-[12px] text-[var(--text-secondary)]">{gestorNome ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge nome={(p.status as { nome?: string } | null)?.nome} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[12px] text-[var(--accent-bright)]">
                          {cnt} projeto{cnt !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3 w-[120px]">
                        <ProgressBar value={avg} />
                      </td>
                      <td className={cn("px-5 py-3 font-mono text-[11px]", dateColor(p.data_fim_prevista))}>
                        {fmtDate(p.data_fim_prevista)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                            title="Editar programa"
                            aria-label="Editar programa"
                            onClick={() => navigate(`/programas/${p.id}`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-rose-400"
                            title="Excluir programa"
                            aria-label="Excluir programa"
                            onClick={() => openDeletePrograma(p)}
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
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir programa?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Só é possível excluir programas sem projetos vinculados.`
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
