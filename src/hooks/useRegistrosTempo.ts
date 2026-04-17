import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RegistroTempo {
  id: string;
  atividade_id: string;
  subatividade_id: string | null;
  usuario_id: string | null;
  segundos: number;
  finalizado_em: string;
}

/** Busca registros de tempo de uma atividade (sem subatividade) ou de uma subatividade específica. */
export function useRegistrosTempo(
  atividadeId: string | undefined,
  subatividadeId?: string | null
) {
  return useQuery({
    queryKey: ["registros_tempo", atividadeId, subatividadeId ?? null],
    queryFn: async () => {
      let q = (supabase as any)
        .from("registros_tempo")
        .select("id, atividade_id, subatividade_id, usuario_id, segundos, finalizado_em")
        .eq("atividade_id", atividadeId!)
        .order("finalizado_em", { ascending: false });

      if (subatividadeId) {
        q = q.eq("subatividade_id", subatividadeId);
      } else {
        q = q.is("subatividade_id", null);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RegistroTempo[];
    },
    enabled: !!atividadeId,
  });
}
