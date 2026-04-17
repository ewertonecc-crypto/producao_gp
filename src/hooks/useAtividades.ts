import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type AtividadeInsert = Database["public"]["Tables"]["atividades"]["Insert"];

export function useAtividades(tenantId: string | undefined, projetoId?: string) {
  return useQuery({
    queryKey: ["atividades", tenantId, projetoId],
    queryFn: async () => {
      let q = supabase
        .from("atividades")
        .select(`
          id, codigo, nome, percentual_concluido, data_inicio_prevista, data_fim_prevista,
          status_aceite, kanban_cor_etiqueta, coluna_kanban_ordem,
          status:status_id(id, nome, cor, ordem, is_final),
          prioridade:prioridade_id(id, nome, cor),
          categoria:categoria_id(id, nome, cor),
          projeto:projeto_id(id, nome, codigo),
          responsavel:responsavel_id(id, nome)
        `)
        .eq("tenant_id", tenantId!)
        .order("coluna_kanban_ordem");
      if (projetoId) q = q.eq("projeto_id", projetoId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AtividadeInsert) => {
      const { data, error } = await supabase.from("atividades").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["atividade-edit"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
      toast.success("Atividade criada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<AtividadeInsert> & { id: string }) => {
      const { data, error } = await supabase.from("atividades").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["atividade-edit"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
      toast.success("Atividade atualizada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAtividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countErr } = await supabase
        .from("alocacoes_recurso")
        .select("id", { count: "exact", head: true })
        .eq("atividade_id", id);
      if (countErr) throw countErr;
      if (count != null && count > 0) {
        throw new Error(
          "Existem alocações de recurso vinculadas a esta atividade. Remova as alocações antes de excluir."
        );
      }
      const { error } = await supabase.from("atividades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["atividade-edit"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
      toast.success("Atividade excluída.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
