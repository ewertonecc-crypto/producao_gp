import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProgramaInsert = Database["public"]["Tables"]["programas"]["Insert"];
type ProgramaUpdate = Database["public"]["Tables"]["programas"]["Update"];

export function useProgramas(tenantId: string | undefined, portfolioId?: string) {
  return useQuery({
    queryKey: ["programas", tenantId, portfolioId],
    queryFn: async () => {
      let q = supabase
        .from("programas")
        .select(`
          id, codigo, nome, objetivo, data_fim_prevista, portfolio_id,
          status:status_id(id, nome, cor),
          prioridade:prioridade_id(id, nome, cor),
          gestor:gestor_id(id, nome),
          portfolio:portfolio_id(id, nome, codigo)
        `)
        .eq("tenant_id", tenantId!)
        .order("criado_em");
      if (portfolioId) q = q.eq("portfolio_id", portfolioId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useProgramaById(id: string | undefined) {
  return useQuery({
    queryKey: ["programas", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programas")
        .select(`
          id, codigo, nome, objetivo, justificativa, data_fim_prevista, data_inicio_prevista, portfolio_id,
          atualizado_em,
          status_id, gestor_id, prioridade_id,
          status:status_id(id, nome, cor),
          prioridade:prioridade_id(id, nome, cor),
          gestor:gestor_id(id, nome),
          portfolio:portfolio_id(id, nome, codigo)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePrograma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProgramaInsert) => {
      const { data, error } = await supabase.from("programas").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programas"] });
      toast.success("Programa criado com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao criar programa: " + e.message),
  });
}

export function useUpdatePrograma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ProgramaUpdate> & { id: string }) => {
      const { data, error } = await supabase.from("programas").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["programas"] });
      qc.invalidateQueries({ queryKey: ["programas", "detail", vars.id] });
      toast.success("Programa atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeletePrograma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countErr } = await supabase
        .from("projetos")
        .select("id", { count: "exact", head: true })
        .eq("programa_id", id);
      if (countErr) throw countErr;
      if (count != null && count > 0) {
        throw new Error(
          "Existem projetos vinculados a este programa. Exclua ou mova os projetos antes de remover o programa."
        );
      }
      const { error } = await supabase.from("programas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["programas"] });
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Programa excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
