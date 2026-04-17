/** Resumo vindo de subatividades (total exclui canceladas). */
export type SubatividadesResumoLike = { concluidas: number; total: number };

type AtividadeComProjeto = {
  id: string;
  percentual_concluido?: number | null;
  projeto?: { id?: string } | { id?: string }[] | null;
};

function projetoIdDeAtividade(a: AtividadeComProjeto): string | undefined {
  const p = a.projeto;
  if (!p) return undefined;
  if (Array.isArray(p)) return p[0]?.id;
  return p.id;
}

/**
 * Se houver subatividades válidas (não canceladas), o progresso da atividade é a proporção concluídas/total.
 * Caso contrário, usa o percentual gravado na atividade.
 */
export function percentualAtividadeComSubatividades(
  percentualConcluido: number | null | undefined,
  sub: SubatividadesResumoLike | undefined
): number {
  if (sub && sub.total > 0) {
    return Math.round((100 * sub.concluidas) / sub.total);
  }
  return Math.round(percentualConcluido ?? 0);
}

/** Média do progresso efetivo das atividades por projeto (só entra atividade com projeto vinculado). */
export function progressoMedioPorProjeto(
  atividades: AtividadeComProjeto[],
  subMap: Map<string, SubatividadesResumoLike> | undefined
): Map<string, number> {
  const byProj = new Map<string, number[]>();
  for (const a of atividades) {
    const pid = projetoIdDeAtividade(a);
    if (!pid) continue;
    const sub = subMap?.get(a.id);
    const pct = percentualAtividadeComSubatividades(a.percentual_concluido, sub);
    const arr = byProj.get(pid) ?? [];
    arr.push(pct);
    byProj.set(pid, arr);
  }
  const out = new Map<string, number>();
  for (const [pid, arr] of byProj) {
    out.set(pid, Math.round(arr.reduce((s, x) => s + x, 0) / arr.length));
  }
  return out;
}

/** Com atividades no projeto: média derivada; senão mantém o progresso gravado no projeto. */
export function progressoProjetoParaExibicao(
  projetoId: string,
  progressoGravado: number | null | undefined,
  derivadoPorProjeto: Map<string, number>
): number {
  if (derivadoPorProjeto.has(projetoId)) {
    return derivadoPorProjeto.get(projetoId)!;
  }
  return Math.round(progressoGravado ?? 0);
}
