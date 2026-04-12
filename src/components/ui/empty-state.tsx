import { Button } from "./button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = "◈", title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-white/[0.12] rounded-2xl">
      <div className="w-12 h-12 bg-[#141424] border border-white/[0.12] rounded-[10px] flex items-center justify-center text-xl mb-3.5">
        {icon}
      </div>
      <div className="font-display font-bold text-[15px] text-[var(--text-primary)] mb-1.5">{title}</div>
      {description && (
        <div className="text-[12.5px] text-[var(--text-muted)] mb-4 max-w-[260px] leading-relaxed">{description}</div>
      )}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
