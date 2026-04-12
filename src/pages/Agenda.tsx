import { useState, useCallback, useMemo, useRef } from "react";
import {
  format,
  getDaysInMonth,
  startOfMonth,
  getDay,
  addMonths,
  subMonths,
  differenceInDays,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTenant } from "@/hooks/useTenant";
import { useAgenda } from "@/hooks/useVisualizacoes";
import { useDragActions } from "@/hooks/useAtividadesSync";
import { cn, fmtDate } from "@/lib/utils";
import { ModalNovaAtividade } from "@/components/modals/ModalNovaAtividade";
import { ModalNovoMarco } from "@/components/modals/ModalNovoMarco";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AGENDA_EVENTO_META,
  AGENDA_EVENTO_TIPOS_FILTRO_ORDER,
  classeCorChipAgenda,
  normalizarTipoEventoAgenda,
  type AgendaTipoEventoValue,
} from "@/lib/agendaEventoTipos";
import type { Database } from "@/integrations/supabase/types";

type AgendaRow = Database["public"]["Views"]["v_agenda"]["Row"];

const FILTROS_INICIAIS: Record<AgendaTipoEventoValue, boolean> = Object.fromEntries(
  AGENDA_EVENTO_TIPOS_FILTRO_ORDER.map((k) => [k, true])
) as Record<AgendaTipoEventoValue, boolean>;

export default function Agenda() {
  const { data: tenant } = useTenant();
  const [mesBase, setMesBase] = useState(new Date());
  const ano = mesBase.getFullYear();
  const mes = mesBase.getMonth() + 1;

  const { data: eventos = [], isLoading } = useAgenda(tenant?.id, ano, mes);
  const { moverEventoAgenda } = useDragActions();

  const [tiposVisiveis, setTiposVisiveis] = useState<Record<AgendaTipoEventoValue, boolean>>(FILTROS_INICIAIS);

  const eventosVisiveis = useMemo(() => {
    return eventos.filter((e) => {
      const t = normalizarTipoEventoAgenda(e.tipo_evento);
      return tiposVisiveis[t];
    });
  }, [eventos, tiposVisiveis]);

  // Agrupar eventos por data (após filtros por tipo)
  const eventosPorDia: Record<string, AgendaRow[]> = {};
  eventosVisiveis.forEach((e) => {
    const dia = e.data_inicio?.split("T")[0] ?? e.data_inicio;
    if (dia) eventosPorDia[dia] = [...(eventosPorDia[dia] ?? []), e];
  });

  // Gerar células do calendário
  const diasNoMes = getDaysInMonth(mesBase);
  const primeiroDia = getDay(startOfMonth(mesBase)); // 0=Dom
  const celulas = [
    ...Array(primeiroDia).fill(null), // células vazias do início
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  // Drag entre dias
  const [dragEvento, setDragEvento] = useState<AgendaRow | null>(null);
  const [dragOverDia, setDragOverDia] = useState<string | null>(null);
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null);

  const [editAtividadeId, setEditAtividadeId] = useState<string | null>(null);
  const [editMarcoId, setEditMarcoId] = useState<string | null>(null);
  const [eventoAgendaDetalhe, setEventoAgendaDetalhe] = useState<AgendaRow | null>(null);
  const [projetoPadraoAtividade, setProjetoPadraoAtividade] = useState<string | undefined>(undefined);

  const pointerDownChipRef = useRef<{ x: number; y: number } | null>(null);

  const abrirDetalheEvento = useCallback((ev: AgendaRow) => {
    if (!ev.id) return;
    const tipo = normalizarTipoEventoAgenda(ev.tipo_evento);
    if (tipo === "atividade") {
      setProjetoPadraoAtividade(ev.projeto_id ?? undefined);
      setEditAtividadeId(ev.id);
      return;
    }
    if (tipo === "marco") {
      setEditMarcoId(ev.id);
      return;
    }
    setEventoAgendaDetalhe(ev);
  }, []);

  const onEventoDragStart = useCallback((e: React.DragEvent, evento: AgendaRow) => {
    setDragEvento(evento);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDiaDragOver = useCallback((e: React.DragEvent, diaStr: string) => {
    e.preventDefault();
    setDragOverDia(diaStr);
  }, []);

  const onDiaDrop = useCallback(
    async (e: React.DragEvent, novaDiaStr: string) => {
      e.preventDefault();
      if (!dragEvento) return;
      const evento = dragEvento;
      const atividadeId = evento.id;
      if (!atividadeId) return;
      setDragEvento(null);
      setDragOverDia(null);

      // Calcular nova data_fim mantendo duração
      let novaDataFim: string | undefined;
      if (evento.data_inicio && evento.data_fim) {
        const duracao = differenceInDays(new Date(evento.data_fim), new Date(evento.data_inicio));
        novaDataFim = format(addDays(new Date(novaDiaStr), duracao), "yyyy-MM-dd");
      }

      await moverEventoAgenda(
        atividadeId,
        novaDiaStr,
        novaDataFim,
        evento.hora_inicio ?? undefined,
        evento.hora_fim ?? undefined
      );
    },
    [dragEvento, moverEventoAgenda]
  );

  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex flex-col flex-1">
      <ModalNovaAtividade
        open={!!editAtividadeId}
        onClose={() => {
          setEditAtividadeId(null);
          setProjetoPadraoAtividade(undefined);
        }}
        projetoIdPadrao={projetoPadraoAtividade}
        editId={editAtividadeId}
      />
      <ModalNovoMarco
        open={!!editMarcoId}
        onClose={() => setEditMarcoId(null)}
        editId={editMarcoId}
      />
      <Dialog open={!!eventoAgendaDetalhe} onOpenChange={(o) => !o && setEventoAgendaDetalhe(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{eventoAgendaDetalhe?.titulo ?? "Evento"}</DialogTitle>
            <DialogDescription>
              {eventoAgendaDetalhe &&
                AGENDA_EVENTO_META[normalizarTipoEventoAgenda(eventoAgendaDetalhe.tipo_evento)].label}
            </DialogDescription>
          </DialogHeader>
          {eventoAgendaDetalhe && (
            <div className="space-y-2 text-[12px] text-[var(--text-secondary)] font-mono">
              {eventoAgendaDetalhe.data_inicio && (
                <p>
                  <span className="text-[var(--text-muted)]">Início: </span>
                  {fmtDate(eventoAgendaDetalhe.data_inicio.split("T")[0])}
                  {eventoAgendaDetalhe.hora_inicio ? ` · ${eventoAgendaDetalhe.hora_inicio.slice(0, 5)}` : ""}
                </p>
              )}
              {eventoAgendaDetalhe.data_fim && (
                <p>
                  <span className="text-[var(--text-muted)]">Fim: </span>
                  {fmtDate(eventoAgendaDetalhe.data_fim.split("T")[0])}
                  {eventoAgendaDetalhe.hora_fim ? ` · ${eventoAgendaDetalhe.hora_fim.slice(0, 5)}` : ""}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">Agenda</h1>
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">
            {eventosVisiveis.length}
            {eventosVisiveis.length !== eventos.length ? ` de ${eventos.length}` : ""} evento(s) em{" "}
            {format(mesBase, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMesBase((m) => subMonths(m, 1))}
            className="w-8 h-8 bg-[#141424] border border-white/[0.12] rounded-[10px] flex items-center justify-center hover:border-indigo-500/35 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-bright)]"
          >
            ‹
          </button>
          <span className="font-display font-bold text-[16px] tracking-tight text-[var(--text-primary)] min-w-[160px] text-center capitalize">
            {format(mesBase, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={() => setMesBase((m) => addMonths(m, 1))}
            className="w-8 h-8 bg-[#141424] border border-white/[0.12] rounded-[10px] flex items-center justify-center hover:border-indigo-500/35 transition-colors text-[var(--text-muted)] hover:text-[var(--accent-bright)]"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setMesBase(new Date())}
            className="px-3 py-1.5 text-[12px] bg-[#141424] border border-white/[0.12] rounded-[10px] text-[var(--text-muted)] hover:border-indigo-500/35 hover:text-[var(--accent-bright)] transition-colors"
          >
            Hoje
          </button>
          {/* Legenda + filtros (mesmas cores e rótulos do cadastro em eventos_agenda) */}
          <div className="flex flex-wrap items-center gap-1.5 ml-2 max-w-[min(100%,520px)] justify-end">
            {AGENDA_EVENTO_TIPOS_FILTRO_ORDER.map((tipo) => {
              const on = tiposVisiveis[tipo];
              const { label, chipClass } = AGENDA_EVENTO_META[tipo];
              return (
                <button
                  key={tipo}
                  type="button"
                  title={on ? `Ocultar ${label}` : `Mostrar ${label}`}
                  onClick={() => setTiposVisiveis((prev) => ({ ...prev, [tipo]: !prev[tipo] }))}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded border transition-opacity",
                    chipClass,
                    on ? "opacity-100" : "opacity-35 line-through"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calendário */}
      <div className="p-7 flex-1">
        {/* Header dias da semana */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] bg-[#141424]"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 gap-px bg-white/[0.04]">
          {celulas.map((dia, idx) => {
            if (dia === null) {
              return <div key={`empty-${idx}`} className="bg-[#0F0F1A] min-h-[88px]" />;
            }
            const diaStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const hoje = format(new Date(), "yyyy-MM-dd");
            const isHoje = diaStr === hoje;
            const evs = eventosPorDia[diaStr] ?? [];

            return (
              <div
                key={diaStr}
                className={cn(
                  "bg-[#141424] min-h-[88px] p-1.5 transition-colors",
                  isHoje && "bg-indigo-500/[0.06]",
                  dragOverDia === diaStr && "bg-indigo-500/[0.1] ring-1 ring-indigo-500/40"
                )}
                onDragOver={(e) => onDiaDragOver(e, diaStr)}
                onDrop={(e) => onDiaDrop(e, diaStr)}
              >
                {/* Número do dia */}
                <div
                  className={cn(
                    "w-[22px] h-[22px] flex items-center justify-center text-[12px] font-medium mb-1",
                    isHoje ? "bg-indigo-500 text-white rounded-full" : "text-[var(--text-secondary)]"
                  )}
                >
                  {dia}
                </div>

                {/* Eventos */}
                {isLoading
                  ? null
                  : (diaExpandido === diaStr ? evs : evs.slice(0, 3)).map((ev) => {
                      const tipoN = normalizarTipoEventoAgenda(ev.tipo_evento);
                      const chipCor = classeCorChipAgenda(tipoN);
                      return (
                        <div
                          key={ev.id ?? ev.titulo}
                          role={ev.id ? "button" : undefined}
                          tabIndex={ev.id ? 0 : undefined}
                          draggable={!!ev.id}
                          onDragStart={(e) => onEventoDragStart(e, ev)}
                          onPointerDown={(e) => {
                            pointerDownChipRef.current = { x: e.clientX, y: e.clientY };
                          }}
                          onClick={(e) => {
                            if (!ev.id) return;
                            const start = pointerDownChipRef.current;
                            pointerDownChipRef.current = null;
                            if (start) {
                              const d = Math.hypot(e.clientX - start.x, e.clientY - start.y);
                              if (d > 10) return;
                            }
                            e.stopPropagation();
                            abrirDetalheEvento(ev);
                          }}
                          onKeyDown={(e) => {
                            if (!ev.id) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              abrirDetalheEvento(ev);
                            }
                          }}
                          className={cn(
                            "text-[10px] font-mono px-1.5 py-0.5 rounded mb-0.5 truncate cursor-pointer border",
                            "active:cursor-grabbing select-none transition-transform active:scale-95",
                            chipCor
                          )}
                          title={`${ev.titulo}${ev.hora_inicio ? ` · ${ev.hora_inicio}` : ""}`}
                        >
                          {ev.titulo}
                        </div>
                      );
                    })}
                {evs.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setDiaExpandido((d) => (d === diaStr ? null : diaStr))}
                    className="text-[9.5px] font-mono text-[var(--text-muted)] cursor-pointer hover:text-[var(--accent-bright)] text-left w-full"
                  >
                    {diaExpandido === diaStr ? "Mostrar menos" : `+${evs.length - 3} mais`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
