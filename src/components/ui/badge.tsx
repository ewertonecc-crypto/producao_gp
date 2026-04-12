import { cn, statusToBadgeClass, prioToClass } from "@/lib/utils";

interface StatusBadgeProps {
  nome?: string | null;
  className?: string;
}

export function StatusBadge({ nome, className }: StatusBadgeProps) {
  if (!nome) return <span className="text-[var(--text-muted)] font-mono text-[11px]">—</span>;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full",
      statusToBadgeClass(nome), className
    )}>
      <span className="w-[5px] h-[5px] rounded-full bg-current flex-shrink-0" />
      {nome}
    </span>
  );
}

interface PrioBadgeProps {
  nome?: string | null;
  className?: string;
}

export function PrioBadge({ nome, className }: PrioBadgeProps) {
  if (!nome) return null;
  return (
    <span className={cn(prioToClass(nome), className)}>
      {nome.toUpperCase()}
    </span>
  );
}
