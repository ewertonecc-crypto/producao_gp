import { useState, useRef, useCallback } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useProjetos } from "@/hooks/useProjetos";
import { useKanban } from "@/hooks/useVisualizacoes";
import { useDragActions } from "@/hooks/useAtividadesSync";
import { useStatus } from "@/hooks/useStatus";
import { fmtDate, cn } from "@/lib/utils";
import { ModalNovaAtividade } from "@/components/modals/ModalNovaAtividade";

export default function Kanban() {
  const { data: tenant } = useTenant();
  const { data: projetos = [] } = useProjetos(tenant?.id);
  const [projetoId, setProjetoId] = useState("");
  const projetoAtivo = projetoId || projetos[0]?.id || "";

  const { data: cards = [], isLoading } = useKanban(tenant?.id, projetoAtivo);
  const { data: statusList = [] } = useStatus(tenant?.id, "atividade");
  const { moverCardKanban, reordenarColunaKanban } = useDragActions();

  const [modalNovaOpen, setModalNovaOpen] = useState(false);
  const [modalStatusId, setModalStatusId] = useState<string | undefined>();
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const ignorarCliqueAposDrag = useRef(false);

  // Estado do drag
  const dragCard = useRef<{ id: string; fromStatusId: string; fromOrdem: number } | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  // Agrupar cards por status
  const colunas = statusList.map((s) => ({
    statusId: s.id,
    statusNome: s.nome,
    statusCor: s.cor ?? "#6366F1",
    ordem: s.ordem,
    cards: cards
      .filter((c) => c.status_id === s.id)
      .sort((a, b) => (a.card_ordem ?? 0) - (b.card_ordem ?? 0)),
  }));

  // ── Handlers de drag
  const onDragStart = useCallback((e: React.DragEvent, card: (typeof cards)[number]) => {
    if (!card.id) return;
    dragCard.current = {
      id: card.id,
      fromStatusId: card.status_id ?? "",
      fromOrdem: card.card_ordem ?? 0,
    };
    e.dataTransfer.effectAllowed = "move";
    // Ghost image transparente para controle visual próprio
    const ghost = document.createElement("div");
    ghost.style.opacity = "0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, statusId: string, cardId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(statusId);
    if (cardId) setDragOverCardId(cardId);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent, novoStatusId: string, dropCardId?: string) => {
      e.preventDefault();
      if (!dragCard.current) return;

      const { id, fromStatusId } = dragCard.current;
      const colCards = colunas.find((c) => c.statusId === novoStatusId)?.cards ?? [];

      setDragOverCol(null);
      setDragOverCardId(null);
      dragCard.current = null;

      if (fromStatusId === novoStatusId) {
        const ids = colCards.map((c) => c.id).filter(Boolean) as string[];
        const without = ids.filter((cid) => cid !== id);
        let insertAt = without.length;
        if (dropCardId) {
          const i = without.indexOf(dropCardId);
          if (i >= 0) insertAt = i;
        }
        const newOrder = [...without.slice(0, insertAt), id, ...without.slice(insertAt)];
        const unchanged = newOrder.length === ids.length && newOrder.every((x, i) => x === ids[i]);
        if (!unchanged) await reordenarColunaKanban(newOrder);
        return;
      }

      const colSemArrastado = colCards.filter((c) => c.id !== id);
      let novaOrdem = colSemArrastado.length;
      if (dropCardId) {
        const idx = colSemArrastado.findIndex((c) => c.id === dropCardId);
        if (idx >= 0) novaOrdem = idx;
      }

      await moverCardKanban(id, novoStatusId, novaOrdem);
    },
    [colunas, moverCardKanban, reordenarColunaKanban]
  );

  const onDragEnd = useCallback(() => {
    ignorarCliqueAposDrag.current = true;
    window.setTimeout(() => {
      ignorarCliqueAposDrag.current = false;
    }, 0);
    setDragOverCol(null);
    setDragOverCardId(null);
    dragCard.current = null;
  }, []);

  const abrirNovaAtividade = useCallback((statusId?: string) => {
    setModalEditId(null);
    setModalStatusId(statusId);
    setModalNovaOpen(true);
  }, []);

  const abrirEditarAtividade = useCallback((id: string) => {
    if (ignorarCliqueAposDrag.current) return;
    setModalEditId(id);
    setModalStatusId(undefined);
    setModalNovaOpen(true);
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ModalNovaAtividade
        open={modalNovaOpen}
        onClose={() => {
          setModalNovaOpen(false);
          setModalStatusId(undefined);
          setModalEditId(null);
        }}
        projetoIdPadrao={projetoAtivo || undefined}
        statusIdPadrao={modalStatusId}
        editId={modalEditId}
      />
      {/* Header */}
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">Kanban</h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">
            {cards.length} atividade(s) · sync em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projetoAtivo}
            onChange={(e) => setProjetoId(e.target.value)}
            disabled={projetos.length === 0}
            className="bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none cursor-pointer disabled:opacity-50"
          >
            {projetos.length === 0 ? (
              <option value="">Nenhum projeto</option>
            ) : (
              projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ?? p.nome}
                </option>
              ))
            )}
          </select>
          <button
            type="button"
            disabled={!projetoAtivo}
            onClick={() => abrirNovaAtividade()}
            className="px-3 py-2 text-[12px] font-medium text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[10px] hover:-translate-y-px transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            + Nova Atividade
          </button>
        </div>
      </div>

      {/* Board */}
      <div
        className="flex gap-3.5 p-7 overflow-x-auto flex-1 items-start pb-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {isLoading ? (
          <p className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</p>
        ) : (
          colunas.map((col) => (
            <div
              key={col.statusId}
              className={cn(
                "w-[268px] flex-shrink-0 flex flex-col transition-all duration-150",
                dragOverCol === col.statusId && "scale-[1.01]"
              )}
              onDragOver={(e) => onDragOver(e, col.statusId)}
              onDrop={(e) => onDrop(e, col.statusId)}
            >
              {/* Coluna header */}
              <div className="flex items-center gap-2 pb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.statusCor }} />
                <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">
                  {col.statusNome}
                </span>
                <span className="text-[10px] font-mono bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded-full text-[var(--text-muted)]">
                  {col.cards.length}
                </span>
              </div>
              <div className="h-0.5 rounded-full mb-2.5" style={{ background: col.statusCor }} />

              {/* Drop zone quando coluna vazia */}
              {col.cards.length === 0 && (
                <div
                  className={cn(
                    "min-h-[80px] border-2 border-dashed rounded-2xl transition-all flex items-center justify-center text-[11px] font-mono",
                    dragOverCol === col.statusId
                      ? "border-indigo-500/50 bg-indigo-500/5 text-indigo-400"
                      : "border-white/[0.08] text-[var(--text-dim)]"
                  )}
                >
                  {dragOverCol === col.statusId ? "Soltar aqui" : "Vazio"}
                </div>
              )}

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {col.cards.map((card) => (
                  <div
                    key={card.id ?? card.codigo}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && card.id) {
                        e.preventDefault();
                        abrirEditarAtividade(card.id);
                      }
                    }}
                    draggable={!!card.id}
                    onDragStart={(e) => onDragStart(e, card)}
                    onDragOver={(e) => onDragOver(e, col.statusId, card.id ?? undefined)}
                    onDrop={(e) => onDrop(e, col.statusId, card.id ?? undefined)}
                    onDragEnd={onDragEnd}
                    onClick={() => card.id && abrirEditarAtividade(card.id)}
                    className={cn(
                      "bg-[#141424] border rounded-2xl p-3.5 cursor-grab active:cursor-grabbing",
                      "transition-all duration-150 relative overflow-hidden select-none",
                      dragOverCardId === card.id
                        ? "border-indigo-500/60 shadow-[0_0_0_2px_rgba(99,102,241,0.3)] -translate-y-0.5"
                        : card.esta_atrasada
                          ? "border-rose-500/30 hover:border-rose-500/50"
                          : "border-white/[0.08] hover:border-indigo-500/30 hover:-translate-y-0.5",
                      "hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
                    )}
                  >
                    {/* Etiqueta colorida */}
                    {card.kanban_cor_etiqueta && (
                      <div
                        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
                        style={{ background: card.kanban_cor_etiqueta }}
                      />
                    )}

                    {/* Título + badge atraso */}
                    <div className="flex items-start justify-between gap-2 mb-1.5 mt-1">
                      <span className="text-[12.5px] font-medium text-[var(--text-primary)] leading-snug flex-1">
                        {card.nome}
                      </span>
                      {card.esta_atrasada && (
                        <span className="text-[8px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                          ATRASO
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-[var(--text-muted)] mb-2">{card.codigo}</div>

                    {/* Barra de progresso */}
                    {card.percentual_concluido != null && card.percentual_concluido > 0 && (
                      <div className="h-1 bg-[#050508] rounded-full overflow-hidden mb-2.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all"
                          style={{ width: `${card.percentual_concluido}%` }}
                        />
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-[8px] font-bold text-white">
                        ?
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          card.esta_atrasada ? "text-rose-400" : "text-[var(--text-muted)]"
                        )}
                      >
                        {fmtDate(card.data_fim_prevista)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão adicionar */}
              <button
                type="button"
                disabled={!projetoAtivo}
                onClick={() => abrirNovaAtividade(col.statusId)}
                className="w-full py-2 mt-2 border border-dashed border-white/[0.12] rounded-[10px] text-[12px] text-[var(--text-muted)] hover:border-indigo-500/30 hover:text-[var(--accent-bright)] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                + Adicionar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
