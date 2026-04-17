import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { differenceInDays, addDays, format, min as minDate, max as maxDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import { useProjetos } from "@/hooks/useProjetos";
import { useGantt } from "@/hooks/useVisualizacoes";
import { useDragActions } from "@/hooks/useAtividadesSync";
import { cn } from "@/lib/utils";

const COL_WIDTH = 140;

type GanttRow = NonNullable<ReturnType<typeof useGantt>["data"]>[number];

export default function Gantt() {
  const { data: tenant, papelGlobal } = useTenant();
  const podeEditar = papelGlobal !== "visualizador";
  const { data: projetos = [] } = useProjetos(tenant?.id);
  const [projetoId, setProjetoId] = useState("");
  const projetoAtivo = projetoId || projetos[0]?.id || "";

  const { data: atividades = [], isLoading } = useGantt(tenant?.id, projetoAtivo);
  const { moverBarraGantt } = useDragActions();

  /** Datas otimistas pós-soltar até o refetch (revertidas em erro). */
  const [dateOverrides, setDateOverrides] = useState<Record<string, { ini: string; fim: string }>>({});

  const projetoInicio = atividades[0]?.projeto_inicio
    ? new Date(atividades[0].projeto_inicio)
    : new Date();
  const projetoFim = atividades[0]?.projeto_fim
    ? new Date(atividades[0].projeto_fim)
    : addDays(projetoInicio, 90);
  const totalDias = Math.max(differenceInDays(projetoFim, projetoInicio), 1);

  const meses: { label: string; dias: number }[] = [];
  let cur = new Date(projetoInicio.getFullYear(), projetoInicio.getMonth(), 1);
  while (cur <= projetoFim) {
    const diasNoMes = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
    meses.push({
      label: format(cur, "MMM yyyy", { locale: ptBR }),
      dias: diasNoMes,
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const getEffectiveRange = useCallback(
    (ativ: GanttRow) => {
      const o = ativ.id ? dateOverrides[ativ.id] : undefined;
      if (o) {
        return {
          start: new Date(o.ini),
          end: new Date(o.fim),
        };
      }
      const start = ativ.data_inicio_prevista ? new Date(ativ.data_inicio_prevista) : projetoInicio;
      const end = new Date(ativ.data_fim_prevista ?? ativ.data_inicio_prevista ?? projetoInicio);
      return { start, end };
    },
    [dateOverrides, projetoInicio]
  );

  const calcBarFromRange = useCallback(
    (start: Date, end: Date) => {
      const left = Math.max((differenceInDays(start, projetoInicio) / totalDias) * 100, 0);
      const span = Math.max(differenceInDays(end, start), 0);
      const width = Math.max((span / totalDias) * 100, 0.35);
      return { left: `${left}%`, width: `${width}%` };
    },
    [projetoInicio, totalDias]
  );

  const hojeOffset = `${Math.min(Math.max((differenceInDays(new Date(), projetoInicio) / totalDias) * 100, 0), 100)}%`;

  const dragState = useRef<{
    atividadeId: string;
    startX: number;
    startInicio: Date;
    startFim: Date;
    duracao: number;
    mode: "move" | "resize-right";
  } | null>(null);

  const [dragging, setDragging] = useState<string | null>(null);
  /** Preview durante arraste (tooltip + datas efetivas no hint). */
  const [dragPreview, setDragPreview] = useState<{
    atividadeId: string;
    inicio: Date;
    fim: Date;
    clientX: number;
    clientY: number;
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<MouseEvent | null>(null);

  const pxParaDias = useCallback(
    (px: number) => {
      const largura = timelineTrackRef.current?.offsetWidth ?? timelineRef.current?.offsetWidth ?? 1;
      return Math.round((px / largura) * totalDias);
    },
    [totalDias]
  );

  const clampMove = useCallback(
    (inicio: Date, fim: Date, duracao: number) => {
      let ni = inicio;
      let nf = fim;
      if (ni < projetoInicio) {
        ni = new Date(projetoInicio);
        nf = addDays(ni, duracao);
      }
      if (nf > projetoFim) {
        nf = new Date(projetoFim);
        ni = addDays(nf, -duracao);
      }
      if (ni < projetoInicio) ni = new Date(projetoInicio);
      return { novoInicio: ni, novoFim: maxDate([nf, ni]) };
    },
    [projetoInicio, projetoFim]
  );

  const clampResize = useCallback(
    (inicio: Date, fim: Date) => {
      let nf = minDate([fim, projetoFim]);
      if (nf <= inicio) nf = addDays(inicio, 1);
      return { novoInicio: inicio, novoFim: nf };
    },
    [projetoFim]
  );

  const onBarMouseDown = useCallback(
    (e: React.MouseEvent, ativ: GanttRow, mode: "move" | "resize-right") => {
      if (!podeEditar || !ativ.id) return;
      e.preventDefault();
      e.stopPropagation();
      const { start: ini, end: fim } = getEffectiveRange(ativ);
      const duracao = Math.max(differenceInDays(fim, ini), 0);
      dragState.current = {
        atividadeId: ativ.id,
        startX: e.clientX,
        startInicio: ini,
        startFim: fim,
        duracao,
        mode,
      };
      setDragging(ativ.id);

      const flushMove = () => {
        rafRef.current = null;
        const ev = pendingMoveRef.current;
        if (!ev || !dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const deltaDias = pxParaDias(dx);
        const { startInicio, startFim, duracao: d, mode: dragMode } = dragState.current;

        let novoInicio = startInicio;
        let novoFim = startFim;
        if (dragMode === "move") {
          novoInicio = addDays(startInicio, deltaDias);
          novoFim = addDays(startFim, deltaDias);
          ({ novoInicio, novoFim } = clampMove(novoInicio, novoFim, d));
        } else {
          novoFim = addDays(startFim, deltaDias);
          ({ novoInicio, novoFim } = clampResize(startInicio, novoFim));
        }

        setDragPreview({
          atividadeId: dragState.current.atividadeId,
          inicio: novoInicio,
          fim: novoFim,
          clientX: ev.clientX,
          clientY: ev.clientY,
        });

        const barEl = document.getElementById(`gantt-bar-${dragState.current.atividadeId}`);
        if (barEl) barEl.style.transform = `translateX(${dx}px)`;
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragState.current) return;
        pendingMoveRef.current = ev;
        if (rafRef.current == null) {
          rafRef.current = requestAnimationFrame(flushMove);
        }
      };

      const onMouseUp = async (ev: MouseEvent) => {
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        pendingMoveRef.current = null;

        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const deltaDias = pxParaDias(dx);
        const { atividadeId, startInicio, startFim, duracao: d, mode: dragMode } = dragState.current;

        let novoInicio = startInicio;
        let novoFim = startFim;
        if (dragMode === "move") {
          novoInicio = addDays(startInicio, deltaDias);
          novoFim = addDays(startFim, deltaDias);
          ({ novoInicio, novoFim } = clampMove(novoInicio, novoFim, d));
        } else {
          novoFim = addDays(startFim, deltaDias);
          ({ novoInicio, novoFim } = clampResize(startInicio, novoFim));
        }

        const barEl = document.getElementById(`gantt-bar-${atividadeId}`);
        if (barEl) {
          barEl.style.transform = "";
          barEl.classList.add("transition-transform", "duration-200", "ease-out");
          window.setTimeout(() => barEl.classList.remove("transition-transform", "duration-200", "ease-out"), 220);
        }

        dragState.current = null;
        setDragging(null);
        setDragPreview(null);

        const iniStr = format(novoInicio, "yyyy-MM-dd");
        const fimStr = format(novoFim, "yyyy-MM-dd");
        const unchanged =
          format(startInicio, "yyyy-MM-dd") === iniStr && format(startFim, "yyyy-MM-dd") === fimStr;
        if (unchanged) return;

        setDateOverrides((prev) => ({ ...prev, [atividadeId]: { ini: iniStr, fim: fimStr } }));
        try {
          await moverBarraGantt(atividadeId, iniStr, fimStr);
          setDateOverrides((prev) => {
            const n = { ...prev };
            delete n[atividadeId];
            return n;
          });
        } catch (err) {
          setDateOverrides((prev) => {
            const n = { ...prev };
            delete n[atividadeId];
            return n;
          });
          const msg = err instanceof Error ? err.message : "Falha ao salvar datas";
          toast.error(msg);
        }
      };

      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [
      podeEditar,
      getEffectiveRange,
      pxParaDias,
      clampMove,
      clampResize,
      moverBarraGantt,
    ]
  );

  useEffect(() => {
    return () => {
      document.body.style.userSelect = "";
    };
  }, []);

  const trackMinWidth = meses.length * COL_WIDTH;

  const tooltipText = useMemo(() => {
    if (!dragPreview) return "";
    const i = format(dragPreview.inicio, "dd/MM/yyyy", { locale: ptBR });
    const f = format(dragPreview.fim, "dd/MM/yyyy", { locale: ptBR });
    return `${i} → ${f}`;
  }, [dragPreview]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">Gantt</h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">
            {atividades.length} atividade(s)
            {podeEditar ? " · arraste a barra para mover no tempo" : " · somente leitura"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projetoAtivo}
            onChange={(e) => setProjetoId(e.target.value)}
            disabled={projetos.length === 0}
            className="bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)] font-mono outline-none disabled:opacity-50"
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
        </div>
      </div>

      <div className="px-7 py-3 flex gap-5 border-b border-white/[0.04] flex-shrink-0 flex-wrap">
        {[
          { label: "Em andamento", color: "from-indigo-500 to-cyan-400" },
          { label: "Atrasado", color: "from-rose-500 to-amber-400" },
          { label: "Concluído", color: "from-emerald-500 to-cyan-400" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={cn("w-7 h-1.5 rounded-full bg-gradient-to-r", l.color)} />
            <span className="text-[11px] text-[var(--text-muted)]">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-px h-4 bg-rose-500/60 border-dashed" />
          <span className="text-[11px] text-[var(--text-muted)]">Hoje</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-7 text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : atividades.length === 0 ? (
          <div className="p-7 text-[12px] font-mono text-[var(--text-muted)]">
            Nenhuma atividade com datas neste projeto
          </div>
        ) : (
          <div className="flex flex-1 overflow-x-auto">
            <div className="w-[240px] flex-shrink-0 border-r border-white/[0.04]">
              <div className="h-10 bg-[#141424] border-b border-white/[0.04] flex items-center px-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Atividade
                </span>
              </div>
              {atividades.map((a) => (
                <div
                  key={a.id}
                  className="h-11 flex flex-col justify-center px-4 border-b border-white/[0.04] hover:bg-indigo-500/[0.03]"
                >
                  <div className="text-[12.5px] font-medium text-[var(--text-primary)] truncate">{a.nome}</div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)]">{a.codigo}</div>
                </div>
              ))}
            </div>

            <div
              className={cn("flex-1 overflow-x-auto relative", dragPreview && "cursor-grabbing")}
              ref={timelineRef}
            >
              <div className="h-10 bg-[#141424] border-b border-white/[0.04] flex">
                {meses.map((m, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-white/[0.04] flex items-center px-3"
                    style={{ width: `${COL_WIDTH}px` }}
                  >
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">{m.label}</span>
                  </div>
                ))}
              </div>

              <div
                ref={timelineTrackRef}
                className="relative select-none"
                style={{
                  width: `${trackMinWidth}px`,
                  minWidth: "100%",
                }}
              >
                <div className="absolute inset-0 flex pointer-events-none">
                  {meses.map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 border-r border-white/[0.02]"
                      style={{ width: `${COL_WIDTH}px` }}
                    />
                  ))}
                </div>

                <div
                  className="absolute top-0 bottom-0 w-px bg-rose-500/50 z-10 pointer-events-none"
                  style={{ left: hojeOffset }}
                >
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-rose-400 whitespace-nowrap">
                    HOJE
                  </span>
                </div>

                {dragPreview && (
                  <div
                    className="fixed z-[100] pointer-events-none rounded-lg border border-indigo-500/40 bg-[#141424]/95 px-2.5 py-1.5 text-[10px] font-mono text-[var(--text-primary)] shadow-lg backdrop-blur-sm"
                    style={{
                      left: dragPreview.clientX + 12,
                      top: dragPreview.clientY + 12,
                    }}
                  >
                    <div>{tooltipText}</div>
                    {(atividades.find((x) => x.id === dragPreview.atividadeId)?.depende_de_ids?.length ?? 0) >
                      0 && (
                      <div className="text-[9px] text-amber-400/90 mt-0.5">Dependências: validação no servidor</div>
                    )}
                  </div>
                )}

                {atividades.map((a) => {
                  if (!a.id) return null;
                  const { start, end } = getEffectiveRange(a);
                  const { left, width } = calcBarFromRange(start, end);
                  const pct = a.percentual_concluido ?? 0;
                  const barColor = a.esta_atrasada
                    ? "from-rose-500 to-amber-400"
                    : pct >= 100
                      ? "from-emerald-500 to-cyan-400"
                      : "from-indigo-500 to-cyan-400";
                  const isDragging = dragging === a.id;

                  return (
                    <div
                      key={a.id}
                      className="relative h-11 border-b border-white/[0.04] flex items-center group/bar"
                    >
                      <div
                        id={`gantt-bar-${a.id}`}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 flex items-center will-change-transform",
                          isDragging && "z-30 opacity-95 scale-y-[1.35] ring-2 ring-indigo-400/50 rounded-sm"
                        )}
                        style={{ left, width }}
                      >
                        <div
                          className={cn(
                            "relative w-full rounded-full overflow-visible touch-none",
                            podeEditar ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-75"
                          )}
                          style={{ height: 10 }}
                          onMouseDown={(e) => onBarMouseDown(e, a, "move")}
                          title={
                            podeEditar
                              ? `${a.nome} — ${pct}% — Arraste para mover (mantém a duração)`
                              : `${a.nome} — leitura`
                          }
                        >
                          <div className="absolute inset-0 h-2 top-1/2 -translate-y-1/2 bg-white/[0.08] rounded-full group-hover/bar:bg-white/[0.12] transition-colors" />
                          <div
                            className={cn(
                              "absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r pointer-events-none",
                              barColor
                            )}
                            style={{ width: `${pct}%`, maxWidth: "100%" }}
                          />
                        </div>
                      </div>

                      {podeEditar && (
                        <div
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-2.5 h-5 rounded-sm bg-white/25 cursor-ew-resize z-40",
                            "opacity-0 group-hover/bar:opacity-100 hover:bg-indigo-400/70 hover:opacity-100 transition-opacity",
                            isDragging && "opacity-100"
                          )}
                          style={{ left: `calc(${left} + ${width} - 5px)` }}
                          onMouseDown={(e) => onBarMouseDown(e, a, "resize-right")}
                          title="Arrastar para alterar data de fim"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
