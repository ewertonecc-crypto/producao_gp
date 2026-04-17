import { useState } from "react";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistrosTempo } from "@/hooks/useRegistrosTempo";
import { formatarTempo, formatarHorasDecimais } from "@/components/ui/cronometro";

function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes} ${h}:${m}`;
}

interface Props {
  atividadeId: string;
  subatividadeId?: string | null;
  className?: string;
}

export function RegistrosTempoPopover({ atividadeId, subatividadeId, className }: Props) {
  const [aberto, setAberto] = useState(false);
  const { data: registros = [] } = useRegistrosTempo(atividadeId, subatividadeId);

  if (registros.length === 0) return null;

  const totalSegundos = registros.reduce((acc, r) => acc + r.segundos, 0);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title={`${registros.length} sessão(ões) · Total: ${formatarHorasDecimais(totalSegundos / 3600)}`}
        className={cn(
          "flex items-center justify-center w-5 h-5 rounded transition-colors flex-shrink-0",
          aberto
            ? "text-cyan-400 bg-cyan-500/15"
            : "text-[var(--text-dim)] hover:text-cyan-400 hover:bg-cyan-500/10"
        )}
      >
        <History className="w-3 h-3" />
      </button>

      {aberto && (
        <>
          {/* Overlay transparente para fechar */}
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-7 z-50 bg-[#141424] border border-white/[0.12] rounded-[10px] shadow-xl min-w-[200px] max-w-[260px] overflow-hidden">
            <div className="px-3 py-2 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Sessões registradas</span>
              <span className="text-[11px] font-mono text-cyan-400">
                Total: {formatarHorasDecimais(totalSegundos / 3600)}
              </span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {registros.map((r, i) => (
                <div
                  key={r.id}
                  className={cn(
                    "px-3 py-1.5 flex items-center justify-between gap-3",
                    i > 0 && "border-t border-white/[0.04]"
                  )}
                >
                  <span className="text-[10.5px] font-mono text-[var(--text-muted)]">
                    {fmtDataHora(r.finalizado_em)}
                  </span>
                  <span className="text-[10.5px] font-mono text-emerald-400 tabular-nums">
                    {formatarTempo(r.segundos)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
