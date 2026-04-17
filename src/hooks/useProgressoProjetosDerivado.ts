import { useMemo } from "react";
import { useAtividades } from "@/hooks/useAtividades";
import { useSubatividadesResumo } from "@/hooks/useSubatividades";
import { progressoMedioPorProjeto } from "@/lib/progressoComSubatividades";

/**
 * Progresso de projeto = média do progresso efetivo de cada atividade (percentual + subatividades).
 * Projetos sem atividades continuam usando só `progresso_percentual` (via progressoProjetoParaExibicao).
 */
export function useProgressoProjetosDerivado(tenantId: string | undefined) {
  const { data: atividades = [] } = useAtividades(tenantId);
  const atividadeIds = useMemo(() => atividades.map((a) => a.id), [atividades]);
  const { data: subMap } = useSubatividadesResumo(atividadeIds);

  const porProjeto = useMemo(
    () => progressoMedioPorProjeto(atividades, subMap),
    [atividades, subMap]
  );

  return { porProjeto };
}
