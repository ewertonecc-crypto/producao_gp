import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type RiscoInsert = Database["public"]["Tables"]["riscos"]["Insert"];
type RiscoUpdate = Database["public"]["Tables"]["riscos"]["Update"];

export function useRiscos(tenantId: string | undefined, projetoId?: string) {
  return useQuery({
    queryKey: ["riscos", tenantId, projetoId],
    queryFn: async () => {
      let q = supabase
        .from("riscos")
        .select(`
          id, descricao, causa, consequencia, probabilidade, impacto,
          nivel_risco, estrategia, plano_resposta, status,
          projeto:projeto_id(id, nome, codigo),
          responsavel:responsavel_id(id, nome)
        `)
        .eq("tenant_id", tenantId!)
        .order("criado_em", { ascending: false });
      if (projetoId) q = q.eq("projeto_id", projetoId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RiscoInsert) => {
      const { data, error } = await supabase.from("riscos").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riscos"] });
      qc.invalidateQueries({ queryKey: ["risco-edit"] });
      toast.success("Risco registrado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RiscoUpdate> & { id: string }) => {
      const { data, error } = await supabase.from("riscos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riscos"] });
      qc.invalidateQueries({ queryKey: ["risco-edit"] });
      toast.success("Risco atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteRisco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("riscos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["riscos"] });
      qc.invalidateQueries({ queryKey: ["risco-edit"] });
      toast.success("Risco excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
