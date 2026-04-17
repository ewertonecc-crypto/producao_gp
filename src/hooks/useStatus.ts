import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type StatusInsert = Database["public"]["Tables"]["status"]["Insert"];
type StatusUpdate = Database["public"]["Tables"]["status"]["Update"];
type PrioridadeInsert = Database["public"]["Tables"]["prioridades"]["Insert"];
type CategoriaInsert = Database["public"]["Tables"]["categorias_atividade"]["Insert"];
type TiposRecursoInsert = Database["public"]["Tables"]["tipos_recurso"]["Insert"];
type TiposCadastroInsert = Database["public"]["Tables"]["tipos_cadastro"]["Insert"];
export type ConfiguracoesTenant = Database["public"]["Tables"]["configuracoes_tenant"]["Row"];

export function useStatus(tenantId: string | undefined, modulo?: string, includeInactive?: boolean) {
  return useQuery({
    queryKey: ["status", tenantId, modulo, includeInactive],
    queryFn: async () => {
      let q = supabase
        .from("status")
        .select("id, nome, cor, ordem, modulo, is_final, is_inicial, is_ativo")
        .eq("tenant_id", tenantId!)
        .order("ordem");
      if (!includeInactive) q = q.eq("is_ativo", true);
      if (modulo) q = q.eq("modulo", modulo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePrioridades(tenantId: string | undefined, includeInactive?: boolean) {
  return useQuery({
    queryKey: ["prioridades", tenantId, includeInactive],
    queryFn: async () => {
      let q = supabase
        .from("prioridades")
        .select("id, nome, cor, ordem, is_ativo")
        .eq("tenant_id", tenantId!)
        .order("ordem");
      if (!includeInactive) q = q.eq("is_ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCategoriasAtividade(tenantId: string | undefined, includeInactive?: boolean) {
  return useQuery({
    queryKey: ["categorias_atividade", tenantId, includeInactive],
    queryFn: async () => {
      let q = supabase
        .from("categorias_atividade")
        .select("id, nome, cor, is_ativo")
        .eq("tenant_id", tenantId!)
        .order("nome");
      if (!includeInactive) q = q.eq("is_ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 10,
  });
}

/** Lista tipos de cadastro filtrados por módulo (portfolios, modais, etc.) */
export function useTiposCadastroPorModulo(tenantId: string | undefined, modulo: string) {
  return useQuery({
    queryKey: ["tipos_cadastro", tenantId, modulo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_cadastro")
        .select("id, nome, descricao")
        .eq("tenant_id", tenantId!)
        .eq("modulo", modulo)
        .eq("is_ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!modulo,
    staleTime: 1000 * 60 * 10,
  });
}

/** Todos os tipos de cadastro do tenant (tela de configurações) */
export function useTiposCadastro(tenantId?: string) {
  return useQuery({
    queryKey: ["tipos_cadastro", tenantId, "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_cadastro")
        .select("*")
        .eq("tenant_id", tenantId!)
        .order("modulo", { ascending: true })
        .order("nome", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useTiposRecurso(tenantId?: string) {
  return useQuery({
    queryKey: ["tipos_recurso", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tipos_recurso").select("*").eq("tenant_id", tenantId!).order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function usePapeis(tenantId?: string) {
  return useQuery({
    queryKey: ["papeis", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("papeis").select("*").order("nivel");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTenantConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, payload }: { tenantId: string; payload: Partial<ConfiguracoesTenant> }) => {
      const { error } = await supabase.from("configuracoes_tenant").update(payload).eq("tenant_id", tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracoes_tenant"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateStatusItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StatusInsert) => {
      const { data, error } = await supabase.from("status").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status"] });
      qc.invalidateQueries({ queryKey: ["subatividades"] });
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
      toast.success("Status adicionado.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateStatusItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Pick<StatusUpdate, "is_final" | "is_inicial">>) => {
      const { error } = await supabase.from("status").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status"] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["subatividades"] });
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreatePrioridadeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PrioridadeInsert) => {
      const { data, error } = await supabase.from("prioridades").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prioridades"] });
      toast.success("Prioridade adicionada.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateCategoriaAtividadeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CategoriaInsert) => {
      const { data, error } = await supabase.from("categorias_atividade").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categorias_atividade"] });
      toast.success("Categoria adicionada.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateTipoRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TiposRecursoInsert) => {
      const { data, error } = await supabase.from("tipos_recurso").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_recurso"] });
      toast.success("Tipo de recurso adicionado.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useCreateTipoCadastro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TiposCadastroInsert) => {
      const { data, error } = await supabase.from("tipos_cadastro").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_cadastro"] });
      toast.success("Tipo de cadastro adicionado.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useSoftDeleteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("status").update({ is_ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status"] });
      qc.invalidateQueries({ queryKey: ["subatividades"] });
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
      toast.success("Status desativado.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}
