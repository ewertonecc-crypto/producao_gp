import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useRiscos, useDeleteRisco } from "@/hooks/useRiscos";
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
import { cn } from "@/lib/utils";
import { ModalNovoRisco } from "@/components/modals/ModalNovoRisco";

type RiscoRow = NonNullable<ReturnType<typeof useRiscos>["data"]>[number];

const nivelMap: Record<string, { cls: string; label: string }> = {
  crítico: { cls: "bg-rose-500/20 text-rose-300 border border-rose-500/35", label: "CRÍTICO" },
  critico: { cls: "bg-rose-500/20 text-rose-300 border border-rose-500/35", label: "CRÍTICO" },
  alto: { cls: "bg-amber-500/10 text-amber-400 border border-amber-500/25", label: "ALTO" },
  médio: { cls: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25", label: "MÉDIO" },
  medio: { cls: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25", label: "MÉDIO" },
  baixo: { cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25", label: "BAIXO" },
};

type NivelFiltro = "todos" | "crítico" | "alto" | "médio" | "baixo";

function normNivel(s: string | null | undefined): string {
  return (s ?? "médio")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function Riscos() {
  const { tenantId } = useTenant();
  const { data: riscos = [], isLoading } = useRiscos(tenantId ?? undefined);
  const deleteMut = useDeleteRisco();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRiscoId, setEditRiscoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<NivelFiltro>("todos");
  const [deleteTarget, setDeleteTarget] = useState<RiscoRow | null>(null);

  const closeModal = () => {
    setModalOpen(false);
    setEditRiscoId(null);
  };

  const criticos = riscos.filter(
    (r) => normNivel(r.nivel_risco).includes("crit") || normNivel(r.impacto).includes("crit")
  ).length;

  const filtrados = useMemo(() => {
    if (filtro === "todos") return riscos;
    return riscos.filter((r) => {
      const n = normNivel(r.nivel_risco ?? r.impacto);
      if (filtro === "crítico") return n.includes("crit");
      if (filtro === "alto") return n.includes("alto") && !n.includes("crit");
      if (filtro === "médio") return n.includes("medio");
      if (filtro === "baixo") return n.includes("baixo");
      return true;
    });
  }, [riscos, filtro]);

  const chips: { key: NivelFiltro; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "crítico", label: "Crítico" },
    { key: "alto", label: "Alto" },
    { key: "médio", label: "Médio" },
    { key: "baixo", label: "Baixo" },
  ];

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Riscos"
        subtitle={`${riscos.length} risco(s) · ${criticos} crítico(s)`}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditRiscoId(null);
              setModalOpen(true);
            }}
          >
            + Registrar Risco
          </Button>
        }
      />
      <ModalNovoRisco open={modalOpen} onClose={closeModal} editId={editRiscoId} />
      <div className="p-7 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFiltro(c.key)}
              className={cn(
                "text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-colors",
                filtro === c.key
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-[#141424] border-white/[0.08] text-[var(--text-muted)] hover:border-white/20"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon="△"
            title="Nenhum risco neste filtro"
            description="Identifique e documente os riscos dos projetos para manter controle preventivo."
            actionLabel="+ Registrar Risco"
            onAction={() => {
              setEditRiscoId(null);
              setModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {filtrados.map((r) => {
              const nivel = normNivel(r.nivel_risco ?? r.impacto ?? "médio");
              const nivelInfo = nivelMap[nivel] ?? nivelMap["medio"];
              return (
                <div
                  key={r.id}
                  className="bg-[#141424] border border-white/[0.08] rounded-2xl p-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2.5 gap-2">
                    <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 leading-snug min-w-0">
                      {r.descricao}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className={cn("text-[9.5px] font-mono font-bold px-2 py-0.5 rounded", nivelInfo.cls)}>
                        {nivelInfo.label}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                        title="Editar risco"
                        aria-label="Editar risco"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditRiscoId(r.id);
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
                        title="Excluir risco"
                        aria-label="Excluir risco"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(r);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.estrategia && (
                      <span className="text-[10px] font-mono bg-[#1A1A2E] border border-white/[0.08] text-[var(--text-muted)] px-2 py-0.5 rounded">
                        {r.estrategia}
                      </span>
                    )}
                    {r.probabilidade && (
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                        Prob: {r.probabilidade}
                      </span>
                    )}
                    {r.impacto && (
                      <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
                        Imp: {r.impacto}
                      </span>
                    )}
                    {(r.projeto as { codigo?: string } | null)?.codigo && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">
                        {(r.projeto as { codigo?: string }).codigo}
                      </span>
                    )}
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
            <AlertDialogTitle>Excluir risco?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? "Esta ação remove permanentemente o registro do risco. Não é possível desfazer."
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
