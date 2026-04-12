import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type EventoInsert = Database["public"]["Tables"]["eventos_agenda"]["Insert"];

export function useKanban(tenantId: string | undefined, projetoId: string | undefined) {
  return useQuery({
    queryKey: ["v_kanban", tenantId, projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_kanban")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("projeto_id", projetoId!)
        .order("coluna_ordem")
        .order("card_ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!projetoId,
  });
}

export function useGantt(tenantId: string | undefined, projetoId: string | undefined) {
  return useQuery({
    queryKey: ["v_gantt", tenantId, projetoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_gantt")
        .select("*")
        .eq("tenant_id", tenantId!)
        .eq("projeto_id", projetoId!)
        .order("data_inicio_prevista");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && !!projetoId,
  });
}

export function useAgenda(tenantId: string | undefined, ano: number, mes: number) {
  return useQuery({
    queryKey: ["v_agenda", tenantId, ano, mes],
    queryFn: async () => {
      const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const fim = new Date(ano, mes, 0).toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("v_agenda")
        .select("*")
        .eq("tenant_id", tenantId!)
        .gte("data_inicio", inicio)
        .lte("data_inicio", fim)
        .order("data_inicio");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

/** A view não expõe tenant_id nos tipos; o isolamento vem dos dados ligados ao tenant do usuário. */
export function useMapaEstrategico(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["v_mapa_estrategico", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase.from("v_mapa_estrategico").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useCreateEventoAgenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventoInsert) => {
      const { data, error } = await supabase.from("eventos_agenda").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v_agenda"] });
      toast.success("Evento criado!");
    },
    onError: (e: Error) => toast.error("Erro ao criar evento: " + e.message),
  });
}
