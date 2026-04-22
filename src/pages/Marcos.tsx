import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Pencil, Trash2, Undo2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useMarcos, useUpdateMarco, useDeleteMarco } from "@/hooks/useMarcos";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { ModalNovoMarco } from "@/components/modals/ModalNovoMarco";
import { AnexosPanel } from "@/components/ui/AnexosPanel";

type MarcoRow = NonNullable<ReturnType<typeof useMarcos>["data"]>[number];

const statusMap: Record<string, string> = {
  atingido: "badge-concluido",
  pendente: "badge-rascunho",
  "em andamento": "badge-execucao",
  atrasado: "badge-cancelado",
};

export default function Marcos() {
  const { tenantId } = useTenant();
  const { data: marcos = [], isLoading } = useMarcos(tenantId ?? undefined);
  const updateMut = useUpdateMarco();
  const deleteMut = useDeleteMarco();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMarcoId, setEditMarcoId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarcoRow | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setEditMarcoId(null);
  };

  const hoje = format(new Date(), "yyyy-MM-dd");

  const toggleAtingido = (id: string, dataReal: string | null) => {
    if (dataReal) {
      updateMut.mutate({ id, data_real: null, status: "pendente" });
    } else {
      updateMut.mutate({ id, data_real: hoje, status: "atingido" });
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Marcos"
        subtitle={`${marcos.length} marco(s) cadastrados`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditMarcoId(null);
              setModalOpen(true);
            }}
          >
            + Novo Marco
          </Button>
        }
      />
      <ModalNovoMarco open={modalOpen} onClose={closeModal} editId={editMarcoId} />
      <div className="p-7">
        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : marcos.length === 0 ? (
          <EmptyState
            icon="⊕"
            title="Nenhum marco cadastrado"
            description="Marcos são milestones dos projetos, programas e portfólios."
            actionLabel="+ Novo Marco"
            onAction={() => {
              setEditMarcoId(null);
              setModalOpen(true);
            }}
          />
        ) : (
          <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Marco", "Vínculo", "Data Prevista", "Data Real", "Status", "Crítico", "Ações"].map((h) => (
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
                {marcos.map((m) => {
                  const vinculo =
                    (m.projeto as { codigo?: string } | null)?.codigo ??
                    (m.programa as { codigo?: string } | null)?.codigo ??
                    (m.portfolio as { codigo?: string } | null)?.codigo ??
                    "—";
                  const sCls = statusMap[(m.status ?? "pendente").toLowerCase()] ?? "badge-rascunho";
                  const sLabel = m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : "Pendente";
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-indigo-500/[0.04]"
                    >
                      <td className="px-5 py-3 text-[13px] font-medium text-[var(--text-primary)]">{m.nome}</td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">{vinculo}</td>
                      <td className={cn("px-5 py-3 font-mono text-[11px]", dateColor(m.data_prevista))}>
                        {fmtDate(m.data_prevista)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="font-mono text-[11px] tabular-nums"
                            style={{ color: m.data_real ? "#10B981" : "var(--text-muted)" }}
                          >
                            {m.data_real ? fmtDate(m.data_real) : "—"}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-[var(--text-muted)] hover:text-emerald-400"
                            title={
                              m.data_real
                                ? "Reabrir marco (remove data real e volta a pendente)"
                                : "Marcar como atingido (data real = hoje)"
                            }
                            aria-label={m.data_real ? "Reabrir marco" : "Marcar marco como atingido hoje"}
                            onClick={() => toggleAtingido(m.id, m.data_real)}
                          >
                            {m.data_real ? (
                              <Undo2 className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full",
                            sCls
                          )}
                        >
                          <span className="w-[5px] h-[5px] rounded-full bg-current" />
                          {sLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {m.is_critico ? (
                          <span className="text-rose-400 text-[11px] font-mono">CRÍTICO</span>
                        ) : (
                          <span className="text-[var(--text-dim)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <AnexosPanel entidadeTipo="marco" entidadeId={m.id} compact />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                            title="Editar marco"
                            aria-label="Editar marco"
                            onClick={() => {
                              setEditMarcoId(m.id);
                              setModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--text-muted)] hover:text-rose-400"
                            title="Excluir marco"
                            aria-label="Excluir marco"
                            onClick={() => setDeleteTarget(m)}
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
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir marco?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Isso remove permanentemente “${deleteTarget.nome}”. Não é possível desfazer.`
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
