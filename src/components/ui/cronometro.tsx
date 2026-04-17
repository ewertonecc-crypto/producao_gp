import { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

/** Formata segundos em HH:MM:SS */
export function formatarTempo(totalSegundos: number): string {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  if (h > 0) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Formata horas decimais em texto legível (ex: 1.25 → "1h 15min") */
export function formatarHorasDecimais(horas: number): string {
  if (!horas || horas <= 0) return "0min";
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const STORAGE_KEY = "cronometros_ativos";

/**
 * Store de timers ativos: id → startTimestamp (ms).
 * Sincronizado com localStorage para sobreviver ao fechar/reabrir o sistema.
 */
const activeTimers = {
  get(id: string): number | undefined {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: Record<string, number> = raw ? JSON.parse(raw) : {};
      return data[id];
    } catch {
      return undefined;
    }
  },
  set(id: string, ts: number): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: Record<string, number> = raw ? JSON.parse(raw) : {};
      data[id] = ts;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* sem acesso ao storage */ }
  },
  delete(id: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data: Record<string, number> = raw ? JSON.parse(raw) : {};
      delete data[id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* sem acesso ao storage */ }
  },
  has(id: string): boolean {
    return this.get(id) !== undefined;
  },
};

interface CronometroProps {
  /** ID único deste cronômetro (ex: "ativ-<uuid>" ou "sub-<uuid>") — necessário para persistir entre navegações */
  id: string;
  /** Horas já acumuladas (para exibição; não afeta o timer ativo) */
  horasAcumuladas?: number | null;
  /** Callback ao parar: recebe os segundos decorridos nesta sessão */
  onSalvar: (segundos: number) => void | Promise<void>;
  /** Se true, desabilita interação */
  disabled?: boolean;
  className?: string;
}

export function Cronometro({ id, horasAcumuladas, onSalvar, disabled, className }: CronometroProps) {
  const estaRodando = () => activeTimers.has(id);

  const calcSegundos = () => {
    const start = activeTimers.get(id);
    if (start == null) return 0;
    return Math.floor((Date.now() - start) / 1000);
  };

  const [rodando, setRodando] = useState(estaRodando);
  const [segundos, setSegundos] = useState(calcSegundos);
  const [salvando, setSalvando] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (rodando) {
      intervaloRef.current = setInterval(() => {
        setSegundos(calcSegundos());
      }, 1000);
    } else {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    }
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando]);

  /* Sincroniza se o timer estava ativo quando o componente remonta */
  useEffect(() => {
    if (estaRodando()) {
      setRodando(true);
      setSegundos(calcSegundos());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const iniciar = () => {
    if (disabled || salvando) return;
    activeTimers.set(id, Date.now());
    setSegundos(0);
    setRodando(true);
  };

  const parar = async () => {
    if (!rodando || salvando) return;
    const elapsed = calcSegundos();
    activeTimers.delete(id);
    setRodando(false);
    if (elapsed <= 0) return;
    setSalvando(true);
    try {
      await onSalvar(elapsed);
    } finally {
      setSalvando(false);
      setSegundos(0);
    }
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {rodando ? (
        <span className="font-mono text-[11px] tabular-nums text-emerald-400 min-w-[44px]">
          {formatarTempo(segundos)}
        </span>
      ) : horasAcumuladas != null && horasAcumuladas > 0 ? (
        <span className="font-mono text-[10.5px] tabular-nums text-[var(--text-muted)] min-w-[44px]" title="Tempo já executado">
          {formatarHorasDecimais(horasAcumuladas)}
        </span>
      ) : (
        <span className="font-mono text-[10.5px] text-[var(--text-dim)] min-w-[44px]">00:00</span>
      )}

      <button
        type="button"
        disabled={disabled || salvando}
        onClick={rodando ? parar : iniciar}
        title={rodando ? "Parar e salvar tempo" : "Iniciar cronômetro"}
        className={cn(
          "flex items-center justify-center w-6 h-6 rounded-full transition-all flex-shrink-0",
          rodando
            ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 animate-pulse"
            : "bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25",
          (disabled || salvando) && "opacity-40 cursor-not-allowed"
        )}
      >
        {rodando ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
      </button>
    </div>
  );
}
