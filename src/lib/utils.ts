import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr + "T00:00:00"), "dd MMM yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function fmtDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

export function dateColor(dateStr: string | null | undefined): string {
  if (!dateStr) return "text-[var(--text-muted)]";
  const diff = differenceInDays(new Date(dateStr), new Date());
  if (diff < 0) return "text-rose-400";
  if (diff < 14) return "text-amber-400";
  return "text-[var(--text-muted)]";
}

export function avatarInitials(nome: string | null | undefined): string {
  if (!nome) return "??";
  const parts = nome.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function progressColor(pct: number): string {
  if (pct >= 90) return "from-emerald-500 to-cyan-400";
  if (pct < 30) return "from-indigo-500 to-violet-400";
  return "from-indigo-500 to-cyan-400";
}

export function statusToBadgeClass(nome: string | null | undefined): string {
  const map: Record<string, string> = {
    "rascunho": "badge-rascunho",
    "em planejamento": "badge-planejamento",
    "planejamento": "badge-planejamento",
    "em execução": "badge-execucao",
    "execução": "badge-execucao",
    "em revisão": "badge-revisao",
    "revisão": "badge-revisao",
    "concluído": "badge-concluido",
    "concluída": "badge-concluido",
    "cancelado": "badge-cancelado",
    "suspenso": "badge-suspenso",
    "disponível": "badge-ativo",
    "ativo": "badge-ativo",
  };
  return map[(nome ?? "").toLowerCase()] ?? "badge-rascunho";
}

export function prioToClass(nome: string | null | undefined): string {
  const map: Record<string, string> = {
    urgente: "prio-urgente",
    alta: "prio-alta",
    média: "prio-media",
    media: "prio-media",
    baixa: "prio-baixa",
  };
  return map[(nome ?? "").toLowerCase()] ?? "prio-baixa";
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
