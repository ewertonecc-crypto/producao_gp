import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  delta?: string;
  deltaType?: "up" | "down" | "warn" | "neutral";
  accent?: "indigo" | "cyan" | "emerald" | "amber";
}

const accentGlow: Record<string, string> = {
  indigo: "after:bg-indigo-500",
  cyan: "after:bg-cyan-400",
  emerald: "after:bg-emerald-500",
  amber: "after:bg-amber-400",
};

const deltaColors = {
  up: "text-emerald-400",
  down: "text-rose-400",
  warn: "text-amber-400",
  neutral: "text-[var(--text-muted)]",
};

export function StatCard({ label, value, delta, deltaType = "neutral", accent = "indigo" }: StatCardProps) {
  return (
    <div className={cn(
      "stat-card relative after:absolute after:-top-2 after:-right-2 after:w-14 after:h-14 after:rounded-full after:blur-xl after:opacity-15",
      accentGlow[accent]
    )}>
      <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-2">{label}</div>
      <div className="font-display font-extrabold text-[28px] tracking-tight text-[var(--text-primary)] leading-none">{value}</div>
      {delta && (
        <div className={cn("text-[10px] font-mono mt-1.5", deltaColors[deltaType])}>{delta}</div>
      )}
    </div>
  );
}
