import { cn, progressColor } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel = true }: ProgressBarProps) {
  const pct = Math.min(Math.max(Math.round(value), 0), 100);
  const textColor =
    pct >= 90 ? "text-emerald-400" : pct < 30 ? "text-[var(--text-muted)]" : "text-[var(--accent-bright)]";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1 bg-[#050508] rounded-full overflow-hidden min-w-[50px]">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", progressColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-[10px] font-mono min-w-[28px] text-right", textColor)}>
          {pct}%
        </span>
      )}
    </div>
  );
}
