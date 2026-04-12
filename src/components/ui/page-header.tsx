import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="px-7 pt-6 pb-5 border-b border-white/[0.04] flex items-start justify-between flex-shrink-0">
      <div>
        <h1 className="font-display font-bold text-[22px] tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px] text-[var(--text-muted)] font-mono mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 mt-0.5">{actions}</div>
      )}
    </div>
  );
}
