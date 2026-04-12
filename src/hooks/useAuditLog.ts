import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAuditLog(tenantId: string | undefined, limit = 30, modulo?: string) {
  return useQuery({
    queryKey: ["audit_log", tenantId, limit, modulo ?? ""],
    queryFn: async () => {
      let q = supabase
        .from("audit_log")
        .select(`
          id, acao, modulo, registro_nome, campos_alterados, ip_address, criado_em,
          usuario:usuario_id(id, nome)
        `)
        .eq("tenant_id", tenantId!)
        .order("criado_em", { ascending: false })
        .limit(limit);
      if (modulo) q = q.eq("modulo", modulo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    refetchInterval: 30_000,
  });
}

export function useAuditLogModulos(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["audit_log", "modulos", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("modulo")
        .eq("tenant_id", tenantId!)
        .limit(500);
      if (error) throw error;
      const set = new Set((data ?? []).map((r) => r.modulo).filter(Boolean));
      return Array.from(set).sort();
    },
    enabled: !!tenantId,
    staleTime: 60_000,
  });
}
