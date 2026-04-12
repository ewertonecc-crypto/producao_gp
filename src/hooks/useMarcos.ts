import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MarcoInsert = Database["public"]["Tables"]["marcos"]["Insert"];
type MarcoUpdate = Database["public"]["Tables"]["marcos"]["Update"];

export function useMarcos(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["marcos", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marcos")
        .select(`
          id, nome, data_prevista, data_real, status, is_critico, cor,
          projeto:projeto_id(id, nome, codigo),
          programa:programa_id(id, nome, codigo),
          portfolio:portfolio_id(id, nome, codigo)
        `)
        .eq("tenant_id", tenantId!)
        .order("data_prevista");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateMarco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MarcoInsert) => {
      const { data, error } = await supabase.from("marcos").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marcos"] });
      qc.invalidateQueries({ queryKey: ["marco-edit"] });
      toast.success("Marco criado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateMarco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MarcoUpdate> & { id: string }) => {
      const { data, error } = await supabase.from("marcos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marcos"] });
      qc.invalidateQueries({ queryKey: ["marco-edit"] });
      toast.success("Marco atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteMarco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marcos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marcos"] });
      qc.invalidateQueries({ queryKey: ["marco-edit"] });
      qc.invalidateQueries({ queryKey: ["v_agenda"] });
      toast.success("Marco excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
