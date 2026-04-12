import { ReactNode, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function ModalBase({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: ModalBaseProps) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-base-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[1] w-full rounded-2xl border border-white/[0.1] bg-[#0d0d14] shadow-[0_24px_80px_rgba(0,0,0,0.55)] flex flex-col max-h-[min(90vh,880px)]",
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:rounded-t-2xl before:bg-gradient-to-r before:from-transparent before:via-indigo-500/70 before:to-transparent",
          sizeClass[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-white/[0.06] flex-shrink-0">
          <h2 id="modal-base-title" className="font-display font-bold text-[15px] text-[var(--text-primary)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-[11.5px] text-[var(--text-muted)] mt-1 leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        <div className="px-5 py-3.5 border-t border-white/[0.06] flex-shrink-0 flex flex-wrap items-center justify-end gap-2">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

export const modalInputClass =
  "w-full rounded-[10px] border border-white/[0.12] bg-[#0d0d14] px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/40";

export const modalLabelClass =
  "text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-1 block";
