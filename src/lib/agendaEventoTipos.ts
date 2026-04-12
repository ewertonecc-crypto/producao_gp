/**
 * Tipos de evento da agenda (eventos_agenda.tipo e v_agenda.tipo_evento).
 * Labels e cores dos chips devem coincidir com o cadastro em ModalNovoEventoAgenda
 * e com a legenda/filtros em Agenda.
 *
 * Cores (semântica do ProjectOS):
 * - Atividade: indigo — mesmo eixo visual do Kanban / barras Gantt “em andamento”
 * - Marco: cyan — alinhado a programas / marcos no mapa e timeline do dashboard
 * - Reunião: emerald — evento ao vivo / disponibilidade
 * - Entrega: amber — marco de entrega / estados de revisão e alertas do Gantt
 * - Outro: violet — fallback explícito
 */

export type AgendaTipoEventoValue =
  | "reuniao"
  | "atividade"
  | "marco"
  | "entrega"
  | "outro";

export const AGENDA_EVENTO_META: Record<
  AgendaTipoEventoValue,
  { label: string; chipClass: string }
> = {
  atividade: {
    label: "Atividade",
    chipClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  },
  marco: {
    label: "Marco",
    chipClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  reuniao: {
    label: "Reunião",
    chipClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  entrega: {
    label: "Entrega",
    chipClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  outro: {
    label: "Outro",
    chipClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
};

/** Ordem do <select> no modal “Novo evento” (primeiro = padrão do formulário). */
export const AGENDA_EVENTO_TIPOS_CADASTRO_ORDER: AgendaTipoEventoValue[] = [
  "reuniao",
  "atividade",
  "marco",
  "entrega",
  "outro",
];

/** Ordem sugerida para legenda e filtros na página Agenda. */
export const AGENDA_EVENTO_TIPOS_FILTRO_ORDER: AgendaTipoEventoValue[] = [
  "atividade",
  "marco",
  "reuniao",
  "entrega",
  "outro",
];

const KNOWN = new Set<string>(Object.keys(AGENDA_EVENTO_META));

/**
 * Normaliza tipo vindo do banco (trim, minúsculas, sinônimos) para a chave canônica.
 */
export function normalizarTipoEventoAgenda(tipo: string | null | undefined): AgendaTipoEventoValue {
  const raw = tipo?.trim().toLowerCase();
  if (!raw) return "atividade";
  if (raw === "reunião") return "reuniao";
  if (KNOWN.has(raw)) return raw as AgendaTipoEventoValue;
  return "outro";
}

export function classeCorChipAgenda(tipo: AgendaTipoEventoValue): string {
  return AGENDA_EVENTO_META[tipo].chipClass;
}
