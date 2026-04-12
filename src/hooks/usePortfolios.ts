import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type PortfolioInsert = Database["public"]["Tables"]["portfolios"]["Insert"];

export function usePortfolios(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["portfolios", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select(`
          id, codigo, nome, objetivo, descricao, justificativa, observacoes,
          orcamento_previsto, data_inicio_prevista, data_fim_prevista, cor_mapa,
          status_id, prioridade_id, gestor_id, tipo_id,
          status:status_id(id, nome, cor),
          prioridade:prioridade_id(id, nome, cor),
          gestor:gestor_id(id, nome),
          tipo:tipo_id(id, nome)
        `)
        .eq("tenant_id", tenantId!)
        .order("criado_em");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PortfolioInsert) => {
      const { data, error } = await supabase.from("portfolios").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfólio criado com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao criar portfólio: " + e.message),
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<PortfolioInsert> & { id: string }) => {
      const { data, error } = await supabase.from("portfolios").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      toast.success("Portfólio atualizado!");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar: " + e.message),
  });
}

export function useDeletePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countErr } = await supabase
        .from("programas")
        .select("id", { count: "exact", head: true })
        .eq("portfolio_id", id);
      if (countErr) throw countErr;
      if (count != null && count > 0) {
        throw new Error(
          "Existem programas vinculados a este portfólio. Exclua ou mova os programas (e projetos) antes de remover o portfólio."
        );
      }
      const { error } = await supabase.from("portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolios"] });
      qc.invalidateQueries({ queryKey: ["programas"] });
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Portfólio excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
