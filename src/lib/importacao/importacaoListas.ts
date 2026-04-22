import { supabase } from "@/integrations/supabase/client";
import type { ListasReferencia } from "./validarPlanilhaImportacao";

function uniqSort(a: string[]) {
  return [...new Set(a.map((s) => s.trim()).filter(Boolean))].sort((x, y) => x.localeCompare(y, "pt-BR"));
}

export async function buscarListasReferencia(tenantId: string): Promise<ListasReferencia> {
  const { data: statusRows } = await supabase
    .from("status")
    .select("nome, modulo, ordem, is_ativo")
    .eq("tenant_id", tenantId)
    .order("ordem", { ascending: true });

  const { data: priRows } = await supabase
    .from("prioridades")
    .select("nome, ordem, is_ativo")
    .eq("tenant_id", tenantId)
    .order("ordem", { ascending: true });

  const { data: pf } = await supabase.from("portfolios").select("nome").eq("tenant_id", tenantId).order("nome");
  const { data: pr } = await supabase.from("programas").select("nome").eq("tenant_id", tenantId).order("nome");
  const { data: pj } = await supabase.from("projetos").select("nome").eq("tenant_id", tenantId).order("nome");
  const { data: at } = await supabase.from("atividades").select("nome").eq("tenant_id", tenantId).order("nome");

  const st = (statusRows ?? []).filter((r) => r.is_ativo !== false);
  const g = (m: string) => uniqSort(st.filter((r) => r.modulo === m).map((r) => r.nome));

  return {
    statusPorModulo: {
      portfolio: g("portfolio"),
      programa: g("programa"),
      projeto: g("projeto"),
      atividade: g("atividade"),
    },
    prioridades: uniqSort((priRows ?? []).filter((p) => p.is_ativo !== false).map((p) => p.nome)),
    nomesPortfolios: uniqSort((pf ?? []).map((x) => x.nome)),
    nomesProgramas: uniqSort((pr ?? []).map((x) => x.nome)),
    nomesProjetos: uniqSort((pj ?? []).map((x) => x.nome)),
    nomesAtividades: uniqSort((at ?? []).map((x) => x.nome)),
  };
}
