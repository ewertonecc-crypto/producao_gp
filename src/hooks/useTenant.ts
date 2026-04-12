import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTenant() {
  const { user } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [papelGlobal, setPapelGlobal] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTenantId(null);
      setPapelGlobal(null);
      setNome(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("usuarios")
      .select("tenant_id, nome, papel_global")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setTenantId(null);
          setPapelGlobal(null);
          setNome(null);
        } else {
          setTenantId(data?.tenant_id ?? null);
          setPapelGlobal(data?.papel_global ?? null);
          setNome(data?.nome ?? null);
        }
        setLoading(false);
      });
  }, [user]);

  return {
    tenantId,
    papelGlobal,
    nome,
    loading,
    /** Compatível com padrão `const { data: tenant } = useTenant()` (tenant.id === tenantId). */
    data: tenantId ? { id: tenantId } : undefined,
  };
}

export function useTenantConfig(tenantId: string | null | undefined) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["configuracoes_tenant", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_tenant").select("*").eq("tenant_id", tenantId!).single();
      if (error) return null;
      return data;
    },
    enabled: !!tenantId,
  });

  const updateConfig = async (updates: Record<string, unknown>) => {
    if (!tenantId) return { data: null, error: new Error("Sem tenant") };
    const { data, error } = await supabase.from("configuracoes_tenant").update(updates).eq("tenant_id", tenantId).select().single();
    if (!error) await qc.invalidateQueries({ queryKey: ["configuracoes_tenant", tenantId] });
    return { data, error };
  };

  return { config: query.data ?? null, loading: query.isLoading, updateConfig };
}
