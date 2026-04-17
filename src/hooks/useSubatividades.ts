import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

type StatusRowMin = { id: string; nome: string | null; is_final: boolean | null; is_inicial: boolean | null };

type StatusLegadoSub = "nao_iniciada" | "em_andamento" | "concluida" | "cancelada";

function nomePareceCancelado(nome: string | null | undefined) {
  return String(nome ?? "").toLowerCase().includes("cancel");
}

/** Mantém a coluna legada `status` (text) alinhada ao registro em `status` para leituras diretas na tabela. */
function textoLegadoDeStatusRow(st: StatusRowMin): StatusLegadoSub {
  if (nomePareceCancelado(st.nome)) return "cancelada";
  if (st.is_final) return "concluida";
  if (st.is_inicial) return "nao_iniciada";
  return "em_andamento";
}

async function fetchStatusRow(id: string): Promise<StatusRowMin | null> {
  const { data, error } = await supabase
    .from("status")
    .select("id, nome, is_final, is_inicial")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as StatusRowMin | null;
}

async function fetchStatusInicialSubatividade(tenantId: string) {
  const { data, error } = await supabase
    .from("status")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("modulo", "subatividade")
    .eq("is_inicial", true)
    .eq("is_ativo", true)
    .order("ordem")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

async function fetchStatusConclusaoSubatividade(tenantId: string) {
  const { data, error } = await supabase
    .from("status")
    .select("id, nome, is_final")
    .eq("tenant_id", tenantId)
    .eq("modulo", "subatividade")
    .eq("is_final", true)
    .eq("is_ativo", true)
    .order("ordem");
  if (error) throw error;
  const rows = (data ?? []) as StatusRowMin[];
  return rows.find((r) => !nomePareceCancelado(r.nome))?.id;
}

/** Mesmo payload em paralelo (vários mutate / Enter repetido) → um único INSERT. */
const criacaoEmAndamento = new Map<string, Promise<unknown>>();

function chaveCriacaoSub(
  tenantId: string,
  payload: {
    atividade_id: string;
    nome: string;
    prazo: string;
    responsavel_id?: string;
    observacao?: string;
    ordem?: number;
  }
) {
  return [
    tenantId,
    payload.atividade_id,
    payload.nome,
    payload.prazo,
    String(payload.ordem ?? ""),
    payload.responsavel_id ?? "",
    payload.observacao ?? "",
  ].join("\x1e");
}

export interface Subatividade {
  id: string;
  atividade_id: string;
  nome: string;
  status_id?: string | null;
  status_nome?: string | null;
  status_cor?: string | null;
  status: StatusLegadoSub;
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

export type SubatividadesResumo = { concluidas: number; total: number };

/** Contagem por atividade (total exclui canceladas — igual à lista expandida). */
export function useSubatividadesResumo(atividadeIds: string[]) {
  const sortedKey = [...atividadeIds].sort().join("\x1e");
  return useQuery({
    queryKey: ["subatividades-resumo", sortedKey],
    queryFn: async () => {
      const map = new Map<string, SubatividadesResumo>();
      for (const id of atividadeIds) {
        map.set(id, { concluidas: 0, total: 0 });
      }
      if (atividadeIds.length === 0) return map;
      /** Tabela base: 1 linha por subatividade e `atividade_id` fiel ao vínculo (a view pode duplicar por JOINs). */
      const { data, error } = await supabase
        .from("subatividades" as any)
        .select("atividade_id, status")
        .in("atividade_id", atividadeIds);
      if (error) throw error;
      for (const row of (data ?? []) as { atividade_id: string; status: string }[]) {
        if (row.status === "cancelada") continue;
        const cur = map.get(row.atividade_id);
        if (!cur) continue;
        cur.total++;
        if (row.status === "concluida") cur.concluidas++;
      }
      return map;
    },
    enabled: atividadeIds.length > 0,
  });
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
      const rows = data as Subatividade[];
      const porId = new Map(rows.map((r) => [r.id, r]));
      return [...porId.values()];
    },
    enabled: !!atividadeId,
  });
}

export function useCreateSubatividade() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  return useMutation({
    retry: false,
    mutationFn: async (payload: {
      atividade_id: string;
      nome: string;
      prazo: string;
      responsavel_id?: string;
      observacao?: string;
      ordem?: number;
      status_id?: string;
    }) => {
      if (!tenant?.id) throw new Error("Tenant não carregado");
      const key = chaveCriacaoSub(tenant.id, payload);
      const emCurso = criacaoEmAndamento.get(key);
      if (emCurso) return emCurso as Promise<Subatividade>;

      const promise = (async () => {
        let statusId = payload.status_id;
        if (!statusId) {
          statusId = await fetchStatusInicialSubatividade(tenant.id);
        }
        if (!statusId) {
          throw new Error("Configure ao menos um status inicial em Configurações → Status → Subatividade.");
        }
        const st = await fetchStatusRow(statusId);
        const statusLegado = st ? textoLegadoDeStatusRow(st) : "nao_iniciada";
        const { status_id: _omit, ...rest } = payload;
        const { data, error } = await supabase
          .from("subatividades")
          .insert({
            ...rest,
            tenant_id: tenant.id,
            status_id: statusId,
            status: statusLegado,
          })
          .select()
          .single();
        if (error) throw error;
        return data as Subatividade;
      })();

      promise.finally(() => {
        if (criacaoEmAndamento.get(key) === promise) criacaoEmAndamento.delete(key);
      });
      criacaoEmAndamento.set(key, promise);
      return promise;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["subatividades", vars.atividade_id] });
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      toast.success("Subatividade criada!", { id: `sub-criada-${data.id}` });
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateSubatividade() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  return useMutation({
    mutationFn: async ({
      id,
      atividadeId,
      ...payload
    }: Partial<Subatividade> & { id: string; atividadeId: string }) => {
      const patch: Record<string, unknown> = { ...payload };

      if (patch.executada === true && !patch.status_id && tenant?.id) {
        const sid = await fetchStatusConclusaoSubatividade(tenant.id);
        if (sid) patch.status_id = sid;
      }

      if (patch.status_id) {
        const st = await fetchStatusRow(patch.status_id as string);
        if (st) {
          patch.status = textoLegadoDeStatusRow(st);
          if (patch.status === "concluida" && !patch.data_conclusao) {
            patch.data_conclusao = new Date().toISOString().split("T")[0];
            patch.executada = true;
          }
          if (patch.status === "cancelada") {
            patch.executada = false;
            patch.data_conclusao = null;
          }
          if (patch.status === "nao_iniciada" || patch.status === "em_andamento") {
            patch.executada = false;
            patch.data_conclusao = null;
          }
        }
      }

      if (patch.status === "concluida" && !patch.data_conclusao) {
        patch.data_conclusao = new Date().toISOString().split("T")[0];
        patch.executada = true;
      }
      if (patch.executada === true && patch.status !== "cancelada") {
        patch.status = "concluida";
        if (!patch.data_conclusao) {
          patch.data_conclusao = new Date().toISOString().split("T")[0];
        }
        if (tenant?.id && !patch.status_id) {
          const sid = await fetchStatusConclusaoSubatividade(tenant.id);
          if (sid) patch.status_id = sid;
        }
      }
      if (patch.executada === false && patch.status === undefined && !patch.status_id) {
        if (tenant?.id) {
          const sid = await fetchStatusInicialSubatividade(tenant.id);
          if (sid) {
            patch.status_id = sid;
            const st = await fetchStatusRow(sid);
            if (st) patch.status = textoLegadoDeStatusRow(st);
          }
        }
      }

      for (const k of [
        "status_nome",
        "status_cor",
        "atividade_nome",
        "atividade_codigo",
        "responsavel_email",
        "total_validas",
        "total_concluidas",
        "atrasada",
        "responsavel_nome",
      ]) {
        delete patch[k];
      }
      const { data, error } = await supabase.from("subatividades").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subatividades", vars.atividadeId] });
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
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
      qc.invalidateQueries({ queryKey: ["subatividades-resumo"] });
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
