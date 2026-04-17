import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

export interface Subatividade {
  id: string;
  atividade_id: string;
  nome: string;
  status: "nao_iniciada" | "em_andamento" | "concluida" | "cancelada";
  executada: boolean;
  prazo: string;
  data_conclusao: string | null;
  observacao: string | null;
  ordem: number;
  responsavel_id: string | null;
  responsavel_nome?: string;
  atrasada?: boolean;
  total_validas?: number;
  total_concluidas?: number;
}

export function useSubatividades(atividadeId: string | undefined) {
  return useQuery({
    queryKey: ["subatividades", atividadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_subatividades" as any)
        .select("*")
        .eq("atividade_id", atividadeId!)
        .order("ordem");
      if (error) throw error;
      return data as Subatividade[];
    },
    enabled: !!atividadeId,
  });
}

export function useCreateSubatividade() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  return useMutation({
    mutationFn: async (payload: {
      atividade_id: string;
      nome: string;
      prazo: string;
      responsavel_id?: string;
      observacao?: string;
      ordem?: number;
    }) => {
      const { data, error } = await supabase
        .from("subatividades")
        .insert({ ...payload, tenant_id: tenant!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subatividades", vars.atividade_id] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      toast.success("Subatividade criada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateSubatividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      atividadeId,
      ...payload
    }: Partial<Subatividade> & { id: string; atividadeId: string }) => {
      if (payload.status === "concluida" && !payload.data_conclusao) {
        payload.data_conclusao = new Date().toISOString().split("T")[0];
        payload.executada = true;
      }
      if (payload.executada === true && payload.status !== "cancelada") {
        payload.status = "concluida";
        if (!payload.data_conclusao) {
          payload.data_conclusao = new Date().toISOString().split("T")[0];
        }
      }
      const { data, error } = await supabase
        .from("subatividades")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subatividades", vars.atividadeId] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteSubatividade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, atividadeId }: { id: string; atividadeId: string }) => {
      const { error } = await supabase.from("subatividades").delete().eq("id", id);
      if (error) throw error;
      return atividadeId;
    },
    onSuccess: (atividadeId) => {
      qc.invalidateQueries({ queryKey: ["subatividades", atividadeId] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      toast.success("Subatividade removida.");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useReordenarSubatividades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      atividadeId,
      ids,
    }: { atividadeId: string; ids: string[] }) => {
      const updates = ids.map((id, idx) =>
        supabase.from("subatividades").update({ ordem: idx }).eq("id", id)
      );
      await Promise.all(updates);
      return atividadeId;
    },
    onSuccess: (atividadeId) => {
      qc.invalidateQueries({ queryKey: ["subatividades", atividadeId] });
    },
  });
}
