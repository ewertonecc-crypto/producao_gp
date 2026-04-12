import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type ClienteExternoRow = Database["public"]["Tables"]["clientes_externos"]["Row"];

function randomPortalTokenHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function tokenExpiresAt30d(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

export function useClientesExternos() {
  const { data: tenant } = useTenant();
  return useQuery({
    queryKey: ["clientes_externos", tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_externos")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as ClienteExternoRow[];
    },
    enabled: !!tenant?.id,
  });
}

export function useCreateClienteExterno() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  return useMutation({
    mutationFn: async (payload: {
      nome: string;
      email: string;
      empresa?: string;
      telefone?: string;
      projetos_ids?: string[];
    }) => {
      const empresa = payload.empresa?.trim() || null;
      const telefone = payload.telefone?.trim() || null;
      const projetos_ids = payload.projetos_ids?.length ? payload.projetos_ids : null;
      const { data, error } = await supabase
        .from("clientes_externos")
        .insert({
          nome: payload.nome.trim(),
          email: payload.email.trim(),
          empresa,
          telefone,
          projetos_ids,
          tenant_id: tenant!.id,
          is_ativo: true,
          token_portal: randomPortalTokenHex(),
          token_expira_em: tokenExpiresAt30d(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as ClienteExternoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes_externos"] });
      toast.success("Cliente externo cadastrado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRenovarTokenClienteExterno() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("clientes_externos")
        .update({
          token_portal: randomPortalTokenHex(),
          token_expira_em: tokenExpiresAt30d(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ClienteExternoRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes_externos"] });
      toast.success("Token renovado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePendentesEntregasPorCliente(
  tenantId: string | undefined,
  clientes: ClienteExternoRow[] | undefined
) {
  return useQuery({
    queryKey: [
      "atividades_pendentes_por_cliente",
      tenantId,
      clientes?.map((c) => c.id).join(","),
      clientes?.map((c) => (c.projetos_ids ?? []).join("|")).join(";"),
    ],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      if (!tenantId || !clientes?.length) return counts;
      for (const c of clientes) counts[c.id] = 0;
      const ids = clientes.map((c) => c.id);
      const { data, error } = await supabase
        .from("atividades")
        .select("id, aceita_por, status_aceite, projeto_id")
        .eq("tenant_id", tenantId)
        .or(`aceita_por.in.(${ids.join(",")}),status_aceite.eq.enviada`);
      if (error) throw error;
      for (const row of data ?? []) {
        for (const c of clientes) {
          const pids = c.projetos_ids ?? [];
          const match =
            row.aceita_por === c.id ||
            (row.status_aceite === "enviada" && pids.includes(row.projeto_id));
          if (match) counts[c.id] = (counts[c.id] ?? 0) + 1;
        }
      }
      return counts;
    },
    enabled: !!tenantId && !!clientes && clientes.length > 0,
  });
}
