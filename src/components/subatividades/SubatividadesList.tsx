import { useMemo, useState } from "react";

/** Converte previsão de fim da atividade (YYYY-MM-DD ou ISO) para limite do input date. */
function previsaoFimParaMaxInput(dataFimPrevista: string | null | undefined): string | undefined {
  if (dataFimPrevista == null || String(dataFimPrevista).trim() === "") return undefined;
  const s = String(dataFimPrevista).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Garante prazo ≤ fim da atividade; preserva o texto original se já estiver dentro do limite. */
function clampPrazoAteMax(prazoRaw: string, maxYmd: string | undefined): string {
  if (!maxYmd || !prazoRaw) return prazoRaw;
  const prazoYmd = previsaoFimParaMaxInput(prazoRaw);
  if (!prazoYmd) return prazoRaw;
  if (prazoYmd > maxYmd) return maxYmd;
  return prazoRaw;
}
import { Pencil, Trash2 } from "lucide-react";
import {
  useSubatividades,
  useCreateSubatividade,
  useUpdateSubatividade,
  useDeleteSubatividade,
} from "@/hooks/useSubatividades";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useTenant } from "@/hooks/useTenant";
import { useStatus } from "@/hooks/useStatus";
import { cn, fmtPrevisao } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function statusFieldStyle(cor: string | null | undefined): React.CSSProperties {
  const accent = cor && cor.trim() ? cor : "#6366f1";
  return {
    backgroundColor: "#141424",
    color: "var(--text-primary)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderLeft: `3px solid ${accent}`,
  };
}

interface Props {
  atividadeId: string;
  readonly?: boolean;
  /** Previsões da atividade pai (exibidas no painel; hora se vier em ISO). */
  dataInicioPrevista?: string | null;
  dataFimPrevista?: string | null;
}

export function SubatividadesList({
  atividadeId,
  readonly = false,
  dataInicioPrevista,
  dataFimPrevista,
}: Props) {
  const { data: tenant } = useTenant();
  const { data: subs = [], isLoading } = useSubatividades(atividadeId);
  const { data: usuarios = [] } = useUsuarios(tenant?.id);
  const { data: statusCfg = [], isLoading: loadingStatusCfg } = useStatus(tenant?.id, "subatividade", false);
  const { mutate: criar, isPending: criando } = useCreateSubatividade();
  const { mutate: atualizar, isPending: atualizando } = useUpdateSubatividade();
  const { mutate: deletar } = useDeleteSubatividade();

  const statusOrdenados = useMemo(
    () => [...statusCfg].sort((a, b) => a.ordem - b.ordem),
    [statusCfg]
  );
  const statusInicialId = useMemo(
    () => statusOrdenados.find((s) => s.is_inicial)?.id,
    [statusOrdenados]
  );

  const prazoMaxAtividade = useMemo(
    () => previsaoFimParaMaxInput(dataFimPrevista),
    [dataFimPrevista]
  );

  const [novoNome, setNovoNome] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [novoResp, setNovoResp] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPrazo, setEditPrazo] = useState("");
  const [editResp, setEditResp] = useState("");
  const [editObs, setEditObs] = useState("");

  const iniciarEdicao = (sub: (typeof subs)[0]) => {
    setEditandoId(sub.id);
    setEditNome(sub.nome);
    const prazoCampo = previsaoFimParaMaxInput(sub.prazo) ?? sub.prazo;
    setEditPrazo(clampPrazoAteMax(prazoCampo, prazoMaxAtividade));
    setEditResp(sub.responsavel_id ?? "");
    setEditObs(sub.observacao ?? "");
    setAdicionando(false);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditNome("");
    setEditPrazo("");
    setEditResp("");
    setEditObs("");
  };

  const salvarEdicao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoId || !editNome.trim() || !editPrazo || atualizando) return;
    const prazoSalvar =
      previsaoFimParaMaxInput(clampPrazoAteMax(editPrazo, prazoMaxAtividade)) ?? editPrazo;
    atualizar(
      {
        id: editandoId,
        atividadeId,
        nome: editNome.trim(),
        prazo: prazoSalvar,
        responsavel_id: editResp || null,
        observacao: editObs.trim() || null,
      },
      { onSuccess: () => cancelarEdicao() }
    );
  };

  const totalValidas = subs.filter((s) => s.status !== "cancelada").length;
  const totalConcluidas = subs.filter((s) => s.status === "concluida").length;
  const pct = totalValidas > 0 ? Math.round((totalConcluidas / totalValidas) * 100) : 0;

  const handleSubmitNova = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoPrazo || criando) return;
    if (!statusInicialId) {
      return;
    }
    const prazoSalvar =
      previsaoFimParaMaxInput(clampPrazoAteMax(novoPrazo, prazoMaxAtividade)) ?? novoPrazo;
    criar(
      {
        atividade_id: atividadeId,
        nome: novoNome.trim(),
        prazo: prazoSalvar,
        responsavel_id: novoResp || undefined,
        ordem: subs.length,
        status_id: statusInicialId,
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

  const handleStatus = (sub: { id: string }, novoStatusId: string) => {
    if (!novoStatusId) return;
    atualizar({ id: sub.id, atividadeId, status_id: novoStatusId });
  };

  const handleExecutada = (sub: { id: string }, val: boolean) => {
    atualizar({ id: sub.id, atividadeId, executada: val });
  };

  const labelStatus = (sub: (typeof subs)[0]) =>
    sub.status_nome?.trim() ||
    statusOrdenados.find((s) => s.id === sub.status_id)?.nome ||
    ({
      nao_iniciada: "Não iniciada",
      em_andamento: "Em andamento",
      concluida: "Concluída",
      cancelada: "Cancelada",
    }[sub.status] ?? sub.status);

  const corStatus = (sub: (typeof subs)[0]) =>
    sub.status_cor?.trim() ||
    statusOrdenados.find((s) => s.id === sub.status_id)?.cor ||
    null;

  return (
    <div>
      {/* Header com progresso */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">
            Subatividades
          </span>
          <span className="text-[10px] font-mono bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded text-[var(--text-muted)]">
            {totalValidas}/{totalConcluidas} existentes / executadas
          </span>
          {subs.some((s) => s.atrasada) && (
            <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded">
              {subs.filter((s) => s.atrasada).length} atrasada(s)
            </span>
          )}
        </div>
        <span className="text-[13px] font-mono font-medium text-[var(--accent-bright)]">{pct}%</span>
      </div>

      {!loadingStatusCfg && statusOrdenados.length === 0 && (
        <div className="text-[11px] text-amber-400/90 mb-2 leading-relaxed">
          Defina os status de subatividade em Configurações → Status por módulo → Subatividade.
        </div>
      )}

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

      {(dataInicioPrevista != null && String(dataInicioPrevista).trim() !== "") ||
      (dataFimPrevista != null && String(dataFimPrevista).trim() !== "") ? (
        <div className="text-[10px] font-mono text-[var(--text-muted)] mb-2.5 leading-relaxed">
          <span className="text-[var(--text-secondary)]">Previsão da atividade</span>
          {" · "}
          Início {fmtPrevisao(dataInicioPrevista)}
          {" · "}
          Fim {fmtPrevisao(dataFimPrevista)}
        </div>
      ) : null}

      {/* Lista de subatividades */}
      {isLoading ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-2">Carregando...</div>
      ) : subs.length === 0 && !adicionando ? (
        <div className="text-[12px] text-[var(--text-muted)] py-2 italic">
          Nenhuma subatividade. Clique em "+ Adicionar" para criar.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 mb-3">
          {subs.map((sub) => {
            const isEdit = editandoId === sub.id;
            return (
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
                  disabled={readonly || isEdit || sub.status === "cancelada" || statusOrdenados.length === 0}
                  onChange={(e) => handleExecutada(sub, e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 cursor-pointer rounded accent-emerald-500 flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  {isEdit ? (
                    <form className="flex flex-col gap-2" onSubmit={salvarEdicao}>
                      <input
                        autoFocus
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        className="w-full bg-transparent border-b border-white/[0.08] pb-1.5 text-[13px] text-[var(--text-primary)] outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Prazo *</label>
                          <input
                            type="date"
                            value={editPrazo}
                            max={prazoMaxAtividade}
                            onChange={(e) =>
                              setEditPrazo(clampPrazoAteMax(e.target.value, prazoMaxAtividade))
                            }
                            className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Responsável</label>
                          <select
                            value={editResp}
                            onChange={(e) => setEditResp(e.target.value)}
                            className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
                          >
                            <option value="">— selecionar —</option>
                            {usuarios.map((u) => (
                              <option key={u.id} value={u.id}>{u.nome}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] block mb-1">Observação</label>
                        <textarea
                          value={editObs}
                          onChange={(e) => setEditObs(e.target.value)}
                          rows={2}
                          className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50 resize-y min-h-[48px]"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelarEdicao}
                          className="px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!editNome.trim() || !editPrazo || atualizando}
                          className="px-4 py-1.5 text-[12px] font-medium text-white bg-indigo-500 rounded-[8px] hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {atualizando ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                  <div className={cn(
                    "text-[13px] font-medium leading-snug",
                    sub.status === "concluida"
                      ? "line-through text-[var(--text-muted)]"
                      : "text-[var(--text-primary)]"
                  )}>
                    {sub.nome}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mt-1.5">
                    {!readonly && statusOrdenados.length > 0 ? (
                      <select
                        value={sub.status_id ?? ""}
                        onChange={(e) => handleStatus(sub, e.target.value)}
                        disabled={readonly}
                        className="text-[11px] font-mono rounded-[8px] px-2 py-1 max-w-[200px] cursor-pointer outline-none focus:border-indigo-500/50"
                        style={statusFieldStyle(corStatus(sub))}
                      >
                        {statusOrdenados.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.nome}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className="text-[11px] font-mono rounded-[8px] px-2 py-1 inline-block max-w-[200px] truncate align-middle"
                        style={statusFieldStyle(corStatus(sub))}
                      >
                        {labelStatus(sub)}
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
                      ⏱ {sub.atrasada ? "ATRASO · " : ""}
                      Prazo {fmtPrevisao(sub.prazo)}
                    </span>

                    {sub.data_conclusao && (
                      <span className="text-[10.5px] font-mono text-emerald-400">
                        ✓ {fmtPrevisao(sub.data_conclusao)}
                      </span>
                    )}
                  </div>

                  {sub.observacao && (
                    <div className="text-[11px] text-[var(--text-muted)] mt-1.5 italic leading-relaxed">
                      {sub.observacao}
                    </div>
                  )}
                    </>
                  )}
                </div>

                {!readonly && !isEdit && (
                  <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--text-muted)] hover:text-indigo-400"
                      title="Editar subatividade"
                      aria-label="Editar subatividade"
                      onClick={() => iniciarEdicao(sub)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-[var(--text-muted)] hover:text-rose-400"
                      title="Excluir subatividade"
                      aria-label="Excluir subatividade"
                      onClick={() => deletar({ id: sub.id, atividadeId })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Formulário inline de adição */}
      {adicionando ? (
        <form
          className="bg-[#0F0F1A] border border-indigo-500/30 rounded-[10px] p-3 flex flex-col gap-2.5"
          onSubmit={handleSubmitNova}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.repeat) e.preventDefault();
          }}
        >
          <input
            autoFocus
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da subatividade *"
            className="w-full bg-transparent border-b border-white/[0.08] pb-1.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Prazo *</label>
              <input
                type="date"
                value={novoPrazo}
                max={prazoMaxAtividade}
                onChange={(e) =>
                  setNovoPrazo(clampPrazoAteMax(e.target.value, prazoMaxAtividade))
                }
                className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Responsável</label>
              <select
                value={novoResp}
                onChange={(e) => setNovoResp(e.target.value)}
                className="w-full bg-[#141424] border border-white/[0.08] rounded-[8px] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              >
                <option value="">— selecionar —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setAdicionando(false); setNovoNome(""); setNovoPrazo(""); setNovoResp(""); }}
              className="px-3 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!novoNome.trim() || !novoPrazo || criando || !statusInicialId}
              className="px-4 py-1.5 text-[12px] font-medium text-white bg-indigo-500 rounded-[8px] hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {criando ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      ) : (
        !readonly && (
          <button
            onClick={() => setAdicionando(true)}
            disabled={!statusInicialId}
            className="w-full py-2 border border-dashed border-white/[0.12] rounded-[10px] text-[12px] text-[var(--text-muted)] hover:border-indigo-500/30 hover:text-[var(--accent-bright)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Adicionar subatividade
          </button>
        )
      )}
    </div>
  );
}
