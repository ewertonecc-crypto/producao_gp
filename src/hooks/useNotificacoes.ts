import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const notificacoesQueryKey = (tenantId: string | undefined, userId: string | undefined) =>
  ["notificacoes", tenantId, userId] as const;

function visibilidadeOr(userId: string) {
  return `usuario_id.eq.${userId},usuario_id.is.null`;
}

export function useNotificacoes(tenantId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: notificacoesQueryKey(tenantId, userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("id, titulo, mensagem, tipo, lida, criado_em, link")
        .eq("tenant_id", tenantId!)
        .or(visibilidadeOr(userId!))
        .order("criado_em", { ascending: false })
        .limit(40);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId && !!userId,
  });
}

export function useMarcarNotificacaoLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; tenantId: string }) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("id", payload.id)
        .eq("tenant_id", payload.tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notificacoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarcarTodasNotificacoesLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { tenantId: string; userId: string }) => {
      const { error } = await supabase
        .from("notificacoes")
        .update({ lida: true, lida_em: new Date().toISOString() })
        .eq("tenant_id", payload.tenantId)
        .eq("lida", false)
        .or(visibilidadeOr(payload.userId));
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notificacoes"] });
      toast.success("Notificações marcadas como lidas.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
