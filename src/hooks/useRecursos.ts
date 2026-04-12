import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type RecursoInsert = Database["public"]["Tables"]["recursos"]["Insert"];
type RecursoUpdate = Database["public"]["Tables"]["recursos"]["Update"];

export function useRecursos(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["recursos", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recursos")
        .select(`
          id, nome, capacidade_horas_semana, custo_hora, moeda, is_ativo,
          tipo:tipo_recurso_id(id, nome),
          usuario:usuario_id(id, nome)
        `)
        .eq("tenant_id", tenantId!)
        .order("nome");
      if (error) throw error;

      const rows = data ?? [];
      type R = (typeof rows)[number];
      type ComCarga = R & { horas_alocadas: number };

      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        return rows.map((r): ComCarga => ({ ...r, horas_alocadas: 0 }));
      }

      const { data: alocs } = await supabase
        .from("alocacoes_recurso")
        .select("recurso_id, horas_alocadas_semana")
        .in("recurso_id", ids)
        .eq("status", "ativa");

      const horasMap: Record<string, number> = {};
      (alocs ?? []).forEach((a) => {
        horasMap[a.recurso_id] = (horasMap[a.recurso_id] ?? 0) + (a.horas_alocadas_semana ?? 0);
      });

      return rows.map(
        (r): ComCarga => ({
          ...r,
          horas_alocadas: horasMap[r.id] ?? 0,
        })
      );
    },
    enabled: !!tenantId,
  });
}

export function useCreateRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecursoInsert) => {
      const { data, error } = await supabase.from("recursos").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recursos"] });
      qc.invalidateQueries({ queryKey: ["recurso-edit"] });
      toast.success("Recurso cadastrado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RecursoUpdate> & { id: string }) => {
      const { data, error } = await supabase.from("recursos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recursos"] });
      qc.invalidateQueries({ queryKey: ["recurso-edit"] });
      toast.success("Recurso atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countErr } = await supabase
        .from("alocacoes_recurso")
        .select("id", { count: "exact", head: true })
        .eq("recurso_id", id);
      if (countErr) throw countErr;
      if (count != null && count > 0) {
        throw new Error(
          "Existem alocações vinculadas a este recurso. Remova as alocações nos projetos antes de excluir."
        );
      }
      const { error } = await supabase.from("recursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recursos"] });
      qc.invalidateQueries({ queryKey: ["recurso-edit"] });
      qc.invalidateQueries({ queryKey: ["v_carga_recurso"] });
      toast.success("Recurso excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
