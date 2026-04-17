import { useState } from "react";
import {
  useSubatividades,
  useCreateSubatividade,
  useUpdateSubatividade,
  useDeleteSubatividade,
} from "@/hooks/useSubatividades";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useTenant } from "@/hooks/useTenant";
import { cn, fmtDate } from "@/lib/utils";

const STATUS_CONFIG: Record<
  "nao_iniciada" | "em_andamento" | "concluida" | "cancelada",
  { label: string; style: React.CSSProperties }
> = {
  nao_iniciada: { label: "Não iniciada", style: { background: "#F1EFE8", color: "#5F5E5A" } },
  em_andamento: { label: "Em andamento", style: { background: "#E6F1FB", color: "#0C447C" } },
  concluida:    { label: "Concluída",    style: { background: "#EAF3DE", color: "#27500A" } },
  cancelada:    { label: "Cancelada",    style: { background: "#FCEBEB", color: "#791F1F" } },
};

interface Props {
  atividadeId: string;
  readonly?: boolean;
}

export function SubatividadesList({ atividadeId, readonly = false }: Props) {
  const { data: tenant } = useTenant();
  const { data: subs = [], isLoading } = useSubatividades(atividadeId);
  const { data: usuarios = [] } = useUsuarios(tenant?.id);
  const { mutate: criar, isPending: criando } = useCreateSubatividade();
  const { mutate: atualizar } = useUpdateSubatividade();
  const { mutate: deletar } = useDeleteSubatividade();

  const [novoNome, setNovoNome] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoResp, setNovoResp] = useState("");
  const [adicionando, setAdicionando] = useState(false);

  const totalValidas = subs.filter(s => s.status !== "cancelada").length;
  const totalConcluidas = subs.filter(s => s.status === "concluida").length;
  const pct = totalValidas > 0 ? Math.round((totalConcluidas / totalValidas) * 100) : 0;

  const handleAdicionar = () => {
    if (!novoNome.trim() || !novoPrazo) return;
    criar(
      {
        atividade_id: atividadeId,
        nome: novoNome.trim(),
        prazo: novoPrazo,
        responsavel_id: novoResp || undefined,
        ordem: subs.length,
      },
      {
        onSuccess: () => {
          setNovoNome("");
          setNovoPrazo("");
          setNovoResp("");
          setAdicionando(false);
        },
      }
    );
  };

  const handleStatus = (sub: { id: string; status: string }, novoStatus: string) => {
    atualizar({ id: sub.id, atividadeId, status: novoStatus as any });
  };

  const handleExecutada = (sub: { id: string }, val: boolean) => {
    atualizar({ id: sub.id, atividadeId, executada: val });
  };

  return (
    <div>
      {/* Header com progresso */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">
            Subatividades
          </span>
          <span className="text-[10px] font-mono bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded text-[var(--text-muted)]">
            {totalConcluidas}/{totalValidas} concluídas
          </span>
          {subs.some(s => s.atrasada) && (
            <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
              {subs.filter(s => s.atrasada).length} atrasada(s)
            </span>
          )}
        </div>
        <span className="text-[13px] font-mono font-medium text-[var(--accent-bright)]">{pct}%</span>
      </div>

      {/* Barra de progresso geral */}
      <div className="h-1.5 bg-[#050508] rounded-full overflow-hidden mb-3.5 border border-white/[0.04]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
            pct >= 80 ? "from-emerald-500 to-cyan-400" :
            pct >= 40 ? "from-indigo-500 to-cyan-400" :
            "from-slate-500 to-slate-400"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Lista de subatividades */}
      {isLoading ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-2">Carregando...</div>
      ) : subs.length === 0 && !adicionando ? (
        <div className="text-[12px] text-[var(--text-muted)] py-2 italic">
          Nenhuma subatividade. Clique em "+ Adicionar" para criar.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mb-3">
          {subs.map((sub) => (
            <div
              key={sub.id}
              className={cn(
                "bg-[#0F0F1A] border rounded-[10px] px-3.5 py-2.5 transition-all",
                sub.status === "concluida"
                  ? "border-emerald-500/20 opacity-80"
                  : sub.atrasada
                    ? "border-rose-500/25"
                    : "border-white/[0.06] hover:border-white/[0.12]"
              )}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={sub.executada || sub.status === "concluida"}
                  disabled={readonly || sub.status === "cancelada"}
                  onChange={e => handleExecutada(sub, e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 cursor-pointer rounded accent-emerald-500 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-[13px] font-medium leading-snug",
                    sub.status === "concluida"
                      ? "line-through text-[var(--text-muted)]"
                      : "text-[var(--text-primary)]"
                  )}>
                    {sub.nome}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    {!readonly ? (
                      <select
                        value={sub.status}
                        onChange={e => handleStatus(sub, e.target.value)}
                        disabled={readonly}
                        className="text-[10px] font-mono border-0 outline-none rounded px-1.5 py-0.5 cursor-pointer"
                        style={STATUS_CONFIG[sub.status].style}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={STATUS_CONFIG[sub.status].style}>
                        {STATUS_CONFIG[sub.status].label}
                      </span>
                    )}

                    {sub.responsavel_nome && (
                      <span className="text-[10.5px] text-[var(--text-muted)]">
                        👤 {sub.responsavel_nome}
                      </span>
                    )}

                    <span className={cn(
                      "text-[10.5px] font-mono",
                      sub.atrasada ? "text-rose-400 font-medium" : "text-[var(--text-muted)]"
                    )}>
                      ⏱ {sub.atrasada ? "ATRASO · " : ""}{fmtDate(sub.prazo)}
                    </span>

                    {sub.data_conclusao && (
                      <span className="text-[10.5px] font-mono text-emerald-400">
                        ✓ {fmtDate(sub.data_conclusao)}
                      </span>
                    )}
                  </div>

                  {sub.observacao && (
                    <div className="text-[11px] text-[var(--text-muted)] mt-1.5 italic leading-relaxed">
                      {sub.observacao}
                    </div>
                  )}
                </div>

                {!readonly && (
                  <button
                    onClick={() => deletar({ id: sub.id, atividadeId })}
                    className="text-[var(--text-dim)] hover:text-rose-400 transition-colors text-[12px] flex-shrink-0 mt-0.5"
                    title="Remover subatividade"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário inline de adição */}
      {adicionando ? (
        <div className="bg-[#0F0F1A] border border-indigo-500/30 rounded-[10px] p-3 flex flex-col gap-2.5">
          <input
            autoFocus
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome da subatividade *"
            onKeyDown={e => e.key === "Enter" && handleAdicionar()}
            className="w-full bg-transparent border-b border-white/[0.08] pb-1.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Prazo *</label>
              <input
                type="date"
                value={novoPrazo}
                onChange={e => setNovoPrazo(e.target.value)}
                className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Responsável</label>
              <select
                value={novoResp}
                onChange={e => setNovoResp(e.target.value)}
                className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              >
                <option value="">— selecionar —</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setAdicionando(false); setNovoNome(""); setNovoPrazo(""); setNovoResp(""); }}
              className="px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdicionar}
              disabled={!novoNome.trim() || !novoPrazo || criando}
              className="px-4 py-1.5 text-[12px] font-medium text-white bg-indigo-500 rounded-[8px] hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {criando ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </div>
      ) : (
        !readonly && (
          <button
            onClick={() => setAdicionando(true)}
            className="w-full py-2 border border-dashed border-white/[0.12] rounded-[10px] text-[12px] text-[var(--text-muted)] hover:border-indigo-500/30 hover:text-[var(--accent-bright)] transition-all"
          >
            + Adicionar subatividade
          </button>
        )
      )}
    </div>
  );
}
