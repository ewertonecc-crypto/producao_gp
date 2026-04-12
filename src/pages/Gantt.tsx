import { useState, useRef, useCallback } from "react";
import { differenceInDays, addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { useProjetos } from "@/hooks/useProjetos";
import { useGantt } from "@/hooks/useVisualizacoes";
import { useDragActions } from "@/hooks/useAtividadesSync";
import { cn } from "@/lib/utils";

const COL_WIDTH = 140; // largura de cada mês em px

export default function Gantt() {
  const { data: tenant } = useTenant();
  const { data: projetos = [] } = useProjetos(tenant?.id);
  const [projetoId, setProjetoId] = useState("");
  const projetoAtivo = projetoId || projetos[0]?.id || "";

  const { data: atividades = [], isLoading } = useGantt(tenant?.id, projetoAtivo);
  const { moverBarraGantt } = useDragActions();

  // Calcular limites da timeline
  const projetoInicio = atividades[0]?.projeto_inicio
    ? new Date(atividades[0].projeto_inicio)
    : new Date();
  const projetoFim = atividades[0]?.projeto_fim
    ? new Date(atividades[0].projeto_fim)
    : addDays(projetoInicio, 90);
  const totalDias = Math.max(differenceInDays(projetoFim, projetoInicio), 1);

  // Meses para header
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
  const timelineWidth = meses.reduce((s, m) => s + (m.dias / totalDias) * (meses.length * COL_WIDTH), 0);
  void timelineWidth;

  // Posição/largura de uma atividade
  const calcBar = (ativ: (typeof atividades)[number]) => {
    const start = ativ.data_inicio_prevista ? new Date(ativ.data_inicio_prevista) : projetoInicio;
    const end = new Date(ativ.data_fim_prevista ?? ativ.data_inicio_prevista ?? projetoInicio);
    const left = Math.max((differenceInDays(start, projetoInicio) / totalDias) * 100, 0);
    const width = Math.max((differenceInDays(end, start) / totalDias) * 100, 1);
    return { left: `${left}%`, width: `${width}%` };
  };

  // Posição de hoje
  const hojeOffset = `${Math.min(Math.max((differenceInDays(new Date(), projetoInicio) / totalDias) * 100, 0), 100)}%`;

  // ── Drag horizontal da barra
  const dragState = useRef<{
    atividadeId: string;
    startX: number;
    startInicio: Date;
    startFim: Date;
    duracao: number;
    mode: "move" | "resize-right";
  } | null>(null);

  const [dragging, setDragging] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  /** Largura real da faixa temporal (as barras usam % deste elemento, não do viewport). */
  const timelineTrackRef = useRef<HTMLDivElement>(null);

  const pxParaDias = useCallback(
    (px: number) => {
      const largura = timelineTrackRef.current?.offsetWidth ?? timelineRef.current?.offsetWidth ?? 1;
      return Math.round((px / largura) * totalDias);
    },
    [totalDias]
  );

  const onBarMouseDown = useCallback(
    (e: React.MouseEvent, ativ: (typeof atividades)[number], mode: "move" | "resize-right") => {
      if (!ativ.id) return;
      e.preventDefault();
      const ini = ativ.data_inicio_prevista ? new Date(ativ.data_inicio_prevista) : projetoInicio;
      const fim = new Date(ativ.data_fim_prevista ?? ativ.data_inicio_prevista ?? projetoInicio);
      dragState.current = {
        atividadeId: ativ.id,
        startX: e.clientX,
        startInicio: ini,
        startFim: fim,
        duracao: differenceInDays(fim, ini),
        mode,
      };
      setDragging(ativ.id);

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        // Atualizar posição visual via CSS custom property (sem re-render)
        const barEl = document.getElementById(`bar-${dragState.current.atividadeId}`);
        if (barEl) barEl.style.transform = `translateX(${dx}px)`;
      };

      const onMouseUp = async (ev: MouseEvent) => {
        if (!dragState.current) return;
        const dx = ev.clientX - dragState.current.startX;
        const deltaDias = pxParaDias(dx);
        const { atividadeId, startInicio, startFim, mode: dragMode } = dragState.current;

        let novoInicio = startInicio;
        let novoFim = startFim;

        if (dragMode === "move") {
          novoInicio = addDays(startInicio, deltaDias);
          novoFim = addDays(startFim, deltaDias);
        } else if (dragMode === "resize-right") {
          novoFim = addDays(startFim, deltaDias);
          if (novoFim <= novoInicio) novoFim = addDays(novoInicio, 1);
        }

        // Reset transform
        const barEl = document.getElementById(`bar-${atividadeId}`);
        if (barEl) barEl.style.transform = "";

        dragState.current = null;
        setDragging(null);

        await moverBarraGantt(
          atividadeId,
          format(novoInicio, "yyyy-MM-dd"),
          format(novoFim, "yyyy-MM-dd")
        );

        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [pxParaDias, moverBarraGantt, projetoInicio]
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">Gantt</h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">
            {atividades.length} atividade(s) · arraste para mover datas
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

      {/* Legenda */}
      <div className="px-7 py-3 flex gap-5 border-b border-white/[0.04] flex-shrink-0">
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

      {/* Gantt body */}
      <div className="flex flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-7 text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : atividades.length === 0 ? (
          <div className="p-7 text-[12px] font-mono text-[var(--text-muted)]">
            Nenhuma atividade com datas neste projeto
          </div>
        ) : (
          <div className="flex flex-1 overflow-x-auto">
            {/* Coluna de labels */}
            <div className="w-[240px] flex-shrink-0 border-r border-white/[0.04]">
              {/* Header */}
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

            {/* Timeline */}
            <div className="flex-1 overflow-x-auto" ref={timelineRef}>
              {/* Header de meses */}
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

              {/* Área das barras */}
              <div
                ref={timelineTrackRef}
                className="relative"
                style={{ width: `${meses.length * COL_WIDTH}px` }}
              >
                {/* Linhas de grade vertical */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {meses.map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 border-r border-white/[0.02]"
                      style={{ width: `${COL_WIDTH}px` }}
                    />
                  ))}
                </div>

                {/* Linha de hoje */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-rose-500/50 z-10 pointer-events-none"
                  style={{ left: hojeOffset }}
                >
                  <span className="absolute top-1 left-1 text-[8px] font-mono text-rose-400 whitespace-nowrap">
                    HOJE
                  </span>
                </div>

                {/* Barras */}
                {atividades.map((a) => {
                  if (!a.id) return null;
                  const { left, width } = calcBar(a);
                  const pct = a.percentual_concluido ?? 0;
                  const barColor = a.esta_atrasada
                    ? "from-rose-500 to-amber-400"
                    : pct >= 100
                      ? "from-emerald-500 to-cyan-400"
                      : "from-indigo-500 to-cyan-400";

                  return (
                    <div key={a.id} className="relative h-11 border-b border-white/[0.04] flex items-center group">
                      {/* Barra background (planejado) */}
                      <div className="absolute h-2 bg-white/[0.06] rounded-full" style={{ left, width }} />
                      {/* Barra preenchida (progresso) */}
                      <div
                        id={`bar-${a.id}`}
                        className={cn(
                          "absolute h-2 rounded-full bg-gradient-to-r transition-none cursor-grab active:cursor-grabbing select-none",
                          barColor,
                          dragging === a.id && "opacity-70 scale-y-150"
                        )}
                        style={{ left, width: `calc(${width} * ${pct / 100})` }}
                        onMouseDown={(e) => onBarMouseDown(e, a, "move")}
                        title={`${a.nome} — ${pct}% — Arraste para mover`}
                      />
                      {/* Handle de resize (direita) */}
                      <div
                        className={cn(
                          "absolute w-2 h-4 rounded-sm bg-white/20 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity",
                          "hover:bg-indigo-400/60"
                        )}
                        style={{ left: `calc(${left} + ${width} * ${pct / 100} - 4px)` }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          onBarMouseDown(e, a, "resize-right");
                        }}
                        title="Arrastar para redimensionar"
                      />
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
