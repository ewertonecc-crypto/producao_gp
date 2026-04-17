import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que escuta mudanças em `atividades` via Supabase Realtime
 * e invalida automaticamente os caches de Kanban, Gantt e Agenda.
 * Deve ser montado UMA VEZ no layout pai das 3 visões.
 */
export function useAtividadesSync(tenantId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel("atividades-sync")
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT | UPDATE | DELETE
          schema: "public",
          table: "atividades",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          // Invalida todas as queries das 3 visões
          qc.invalidateQueries({ queryKey: ["v_kanban"] });
          qc.invalidateQueries({ queryKey: ["v_gantt"] });
          qc.invalidateQueries({ queryKey: ["v_agenda"] });
          qc.invalidateQueries({ queryKey: ["atividades"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "eventos_agenda" },
        () => qc.invalidateQueries({ queryKey: ["v_agenda"] })
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "marcos" },
        () => {
          qc.invalidateQueries({ queryKey: ["v_agenda"] });
          qc.invalidateQueries({ queryKey: ["v_gantt"] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, qc]);
}

// RPCs de drag-and-drop — chamadas pelas 3 visões
export function useDragActions() {
  const qc = useQueryClient();

  const moverCardKanban = useCallback(
    async (atividadeId: string, novoStatusId: string, novaOrdem: number) => {
      const { error } = await supabase.rpc("fn_mover_card_kanban", {
        p_atividade_id: atividadeId,
        p_novo_status_id: novoStatusId,
        p_nova_ordem: novaOrdem,
      });
      if (error) throw error;
      // Realtime vai propagar, mas invalidamos imediatamente para UX instantânea
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
    },
    [qc]
  );

  const moverBarraGantt = useCallback(
    async (
      atividadeId: string,
      dataInicio: string, // "YYYY-MM-DD"
      dataFim: string,
      percentualConcluido?: number
    ) => {
      const { error } = await supabase.rpc("fn_mover_barra_gantt", {
        p_atividade_id: atividadeId,
        p_data_inicio: dataInicio,
        p_data_fim: dataFim,
        p_percentual_concluido: percentualConcluido ?? null,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
      qc.invalidateQueries({ queryKey: ["v_agenda"] });
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["v_mapa_estrategico"] });
    },
    [qc]
  );

  const moverEventoAgenda = useCallback(
    async (
      atividadeId: string,
      dataInicio: string,
      dataFim?: string,
      horaInicio?: string, // "HH:MM:SS"
      horaFim?: string
    ) => {
      const { error } = await supabase.rpc("fn_mover_evento_agenda", {
        p_atividade_id: atividadeId,
        p_data_inicio: dataInicio,
        p_data_fim: dataFim ?? null,
        p_hora_inicio: horaInicio ?? null,
        p_hora_fim: horaFim ?? null,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["v_agenda"] });
      qc.invalidateQueries({ queryKey: ["v_gantt"] });
    },
    [qc]
  );

  const reordenarColunaKanban = useCallback(
    async (idsEmOrdem: string[]) => {
      const { error } = await supabase.rpc("fn_reordenar_coluna_kanban", {
        p_ids_em_ordem: idsEmOrdem,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["v_kanban"] });
    },
    [qc]
  );

  return { moverCardKanban, moverBarraGantt, moverEventoAgenda, reordenarColunaKanban };
}
