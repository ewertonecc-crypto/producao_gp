import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type ProjetoInsert = Database["public"]["Tables"]["projetos"]["Insert"];

export function useProjetos(tenantId: string | undefined, programaId?: string) {
  return useQuery({
    queryKey: ["projetos", tenantId, programaId],
    queryFn: async () => {
      let q = supabase
        .from("projetos")
        .select(`
          id, codigo, nome, objetivo, progresso_percentual, programa_id, status_id, prioridade_id, gerente_projeto_id,
          data_inicio_prevista, data_fim_prevista,
          status:status_id(id, nome, cor),
          prioridade:prioridade_id(id, nome, cor),
          gerente:gerente_projeto_id(id, nome),
          programa:programa_id(id, nome, codigo)
        `)
        .eq("tenant_id", tenantId!)
        .order("criado_em");
      if (programaId) q = q.eq("programa_id", programaId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}

export function useProjetoById(id: string | undefined) {
  return useQuery({
    queryKey: ["projetos", "byId", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select(`
          id, tenant_id, codigo, nome, objetivo, escopo, justificativa,
          programa_id, gerente_projeto_id, prioridade_id, status_id,
          data_inicio_prevista, data_fim_prevista, orcamento_previsto, atualizado_em,
          programa:programa_id(id, nome, codigo)
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ProjetoInsert) => {
      const { data, error } = await supabase.from("projetos").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (e: Error) => toast.error("Erro ao criar projeto: " + e.message),
  });
}

export function useUpdateProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ProjetoInsert> & { id: string }) => {
      const { data, error } = await supabase.from("projetos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      qc.setQueryData(["projetos", "byId", variables.id], (old: Record<string, unknown> | undefined) =>
        old ? { ...old, ...data } : old
      );
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const [
        ativ,
        risc,
        mar,
        mud,
        aloc,
        stk,
        upp,
        ev,
        lic,
      ] = await Promise.all([
        supabase.from("atividades").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("riscos").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("marcos").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("mudancas_escopo").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("alocacoes_recurso").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("stakeholders").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("usuario_projeto_papel").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("eventos_agenda").select("id", { count: "exact", head: true }).eq("projeto_id", id),
        supabase.from("licoes_aprendidas").select("id", { count: "exact", head: true }).eq("projeto_id", id),
      ]);
      const errs = [ativ.error, risc.error, mar.error, mud.error, aloc.error, stk.error, upp.error, ev.error, lic.error].filter(
        Boolean
      );
      if (errs.length) throw errs[0];

      const parts: string[] = [];
      if ((ativ.count ?? 0) > 0) parts.push(`${ativ.count} atividade(s)`);
      if ((risc.count ?? 0) > 0) parts.push(`${risc.count} risco(s)`);
      if ((mar.count ?? 0) > 0) parts.push(`${mar.count} marco(s)`);
      if ((mud.count ?? 0) > 0) parts.push(`${mud.count} mudança(s) de escopo`);
      if ((aloc.count ?? 0) > 0) parts.push(`${aloc.count} alocação(ões) de recurso`);
      if ((stk.count ?? 0) > 0) parts.push(`${stk.count} stakeholder(s)`);
      if ((upp.count ?? 0) > 0) parts.push(`${upp.count} vínculo(s) de papel no projeto`);
      if ((ev.count ?? 0) > 0) parts.push(`${ev.count} evento(s) na agenda`);
      if ((lic.count ?? 0) > 0) parts.push(`${lic.count} lição(ões) aprendida(s)`);

      if (parts.length > 0) {
        throw new Error(
          `Não é possível excluir: ainda há ${parts.join(", ")} vinculado(s). Remova ou ajuste esses registros antes.`
        );
      }

      const { error } = await supabase.from("projetos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projetos"] });
      qc.invalidateQueries({ queryKey: ["v_mapa_estrategico"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
      toast.success("Projeto excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir: " + e.message),
  });
}
