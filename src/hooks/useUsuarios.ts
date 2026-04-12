import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type UsuarioInsert = Database["public"]["Tables"]["usuarios"]["Insert"];
type UsuarioUpdate = Database["public"]["Tables"]["usuarios"]["Update"];

export function useUsuarios(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["usuarios", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, cargo, departamento, papel_global, is_ativo, ultimo_acesso, avatar_url")
        .eq("tenant_id", tenantId!)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UsuarioInsert) => {
      const { data, error } = await supabase.from("usuarios").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Convite enviado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<UsuarioUpdate> & { id: string }) => {
      const { data, error } = await supabase.from("usuarios").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
