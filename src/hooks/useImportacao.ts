import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";

export interface ResultadoImportacao {
  modulo: string;
  total: number;
  criados: number;
  erros: { linha: number; mensagem: string }[];
}

export interface LinhaImportacao {
  linha: number;
  dados: Record<string, any>;
}

export function useImportarDados() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const [progresso, setProgresso] = useState(0);
  const [processando, setProcessando] = useState(false);

  const importar = async (
    modulo: "portfolios" | "programas" | "projetos" | "atividades" | "subatividades",
    linhas: LinhaImportacao[]
  ): Promise<ResultadoImportacao> => {
    setProcessando(true);
    setProgresso(0);
    const resultado: ResultadoImportacao = { modulo, total: linhas.length, criados: 0, erros: [] };

    for (let i = 0; i < linhas.length; i++) {
      const { linha, dados } = linhas[i];
      setProgresso(Math.round(((i + 1) / linhas.length) * 100));

      try {
        if (modulo === "portfolios") {
          await importarPortfolio(dados, tenant!.id);
        } else if (modulo === "programas") {
          await importarPrograma(dados, tenant!.id);
        } else if (modulo === "projetos") {
          await importarProjeto(dados, tenant!.id);
        } else if (modulo === "atividades") {
          await importarAtividade(dados, tenant!.id);
        } else if (modulo === "subatividades") {
          await importarSubatividade(dados, tenant!.id);
        }
        resultado.criados++;
      } catch (e: any) {
        resultado.erros.push({ linha, mensagem: e.message });
      }
    }

    // Invalidar todas as queries após importação
    qc.invalidateQueries({ queryKey: ["portfolios"] });
    qc.invalidateQueries({ queryKey: ["programas"] });
    qc.invalidateQueries({ queryKey: ["projetos"] });
    qc.invalidateQueries({ queryKey: ["atividades"] });
    qc.invalidateQueries({ queryKey: ["subatividades"] });

    setProcessando(false);
    setProgresso(0);
    return resultado;
  };

  return { importar, progresso, processando };
}

// ─── Helpers de importação por módulo ───────────────────────

async function resolverStatusId(nomeStatus: string, modulo: string): Promise<string | null> {
  if (!nomeStatus) return null;
  const { data } = await supabase
    .from("status")
    .select("id")
    .eq("modulo", modulo)
    .ilike("nome", nomeStatus.trim())
    .maybeSingle();
  return data?.id ?? null;
}

async function resolverPrioridadeId(nomePrio: string): Promise<string | null> {
  if (!nomePrio) return null;
  const { data } = await supabase
    .from("prioridades")
    .select("id")
    .ilike("nome", nomePrio.trim())
    .maybeSingle();
  return data?.id ?? null;
}

async function resolverUsuarioId(email: string): Promise<string | null> {
  if (!email) return null;
  const { data } = await supabase
    .from("usuarios")
    .select("id")
    .ilike("email", email.trim())
    .maybeSingle();
  return data?.id ?? null;
}

async function resolverPortfolioId(nome: string, tenantId: string): Promise<string> {
  const { data } = await supabase
    .from("portfolios")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("nome", nome.trim())
    .maybeSingle();
  if (!data) throw new Error(`Portfólio "${nome}" não encontrado no sistema`);
  return data.id;
}

async function resolverProgramaId(nome: string, tenantId: string): Promise<string> {
  const { data } = await supabase
    .from("programas")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("nome", nome.trim())
    .maybeSingle();
  if (!data) throw new Error(`Programa "${nome}" não encontrado no sistema`);
  return data.id;
}

async function resolverProjetoId(nome: string, tenantId: string): Promise<string> {
  const { data } = await supabase
    .from("projetos")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("nome", nome.trim())
    .maybeSingle();
  if (!data) throw new Error(`Projeto "${nome}" não encontrado no sistema`);
  return data.id;
}

async function resolverAtividadeId(nome: string, projetoId: string): Promise<string> {
  const { data } = await supabase
    .from("atividades")
    .select("id")
    .eq("projeto_id", projetoId)
    .ilike("nome", nome.trim())
    .maybeSingle();
  if (!data) throw new Error(`Atividade "${nome}" não encontrada no projeto`);
  return data.id;
}

async function importarPortfolio(d: any, tenantId: string) {
  if (!d.nome) throw new Error("Campo 'nome' obrigatório");
  if (!d.objetivo) throw new Error("Campo 'objetivo' obrigatório");
  if (!d.justificativa) throw new Error("Campo 'justificativa' obrigatório");

  const statusId = await resolverStatusId(d.status || "Rascunho", "portfolio");
  const prioridadeId = await resolverPrioridadeId(d.prioridade || "");

  const { error } = await supabase.from("portfolios").insert({
    tenant_id: tenantId,
    nome: d.nome.trim(),
    objetivo: d.objetivo.trim(),
    justificativa: d.justificativa.trim(),
    descricao: d.descricao || null,
    status_id: statusId,
    prioridade_id: prioridadeId,
    data_inicio_prevista: d.data_inicio_prevista || null,
    data_fim_prevista: d.data_fim_prevista || null,
    orcamento_previsto: d.orcamento_previsto ? Number(d.orcamento_previsto) : null,
    observacoes: d.observacoes || null,
  });
  if (error) throw new Error(error.message);
}

async function importarPrograma(d: any, tenantId: string) {
  if (!d.nome) throw new Error("Campo 'nome' obrigatório");
  if (!d.portfolio_nome) throw new Error("Campo 'portfolio_nome' obrigatório");
  if (!d.objetivo) throw new Error("Campo 'objetivo' obrigatório");
  if (!d.justificativa) throw new Error("Campo 'justificativa' obrigatório");

  const portfolioId = await resolverPortfolioId(d.portfolio_nome, tenantId);
  const statusId = await resolverStatusId(d.status || "Rascunho", "programa");
  const prioridadeId = await resolverPrioridadeId(d.prioridade || "");

  const { error } = await supabase.from("programas").insert({
    tenant_id: tenantId,
    portfolio_id: portfolioId,
    nome: d.nome.trim(),
    objetivo: d.objetivo.trim(),
    justificativa: d.justificativa.trim(),
    status_id: statusId,
    prioridade_id: prioridadeId,
    data_inicio_prevista: d.data_inicio_prevista || null,
    data_fim_prevista: d.data_fim_prevista || null,
    orcamento_previsto: d.orcamento_previsto ? Number(d.orcamento_previsto) : null,
    observacoes: d.observacoes || null,
  });
  if (error) throw new Error(error.message);
}

async function importarProjeto(d: any, tenantId: string) {
  if (!d.nome) throw new Error("Campo 'nome' obrigatório");
  if (!d.programa_nome) throw new Error("Campo 'programa_nome' obrigatório");
  if (!d.objetivo) throw new Error("Campo 'objetivo' obrigatório");
  if (!d.escopo) throw new Error("Campo 'escopo' obrigatório");
  if (!d.justificativa) throw new Error("Campo 'justificativa' obrigatório");

  const programaId = await resolverProgramaId(d.programa_nome, tenantId);
  const statusId = await resolverStatusId(d.status || "Em Planejamento", "projeto");
  const prioridadeId = await resolverPrioridadeId(d.prioridade || "");
  const gerenteId = await resolverUsuarioId(d.responsavel_email || "");

  const { error } = await supabase.from("projetos").insert({
    tenant_id: tenantId,
    programa_id: programaId,
    nome: d.nome.trim(),
    objetivo: d.objetivo.trim(),
    escopo: d.escopo.trim(),
    justificativa: d.justificativa.trim(),
    status_id: statusId,
    prioridade_id: prioridadeId,
    gerente_projeto_id: gerenteId,
    data_inicio_prevista: d.data_inicio_prevista || null,
    data_fim_prevista: d.data_fim_prevista || null,
    orcamento_previsto: d.orcamento_previsto ? Number(d.orcamento_previsto) : null,
    observacoes: d.observacoes || null,
  });
  if (error) throw new Error(error.message);
}

async function importarAtividade(d: any, tenantId: string) {
  if (!d.nome) throw new Error("Campo 'nome' obrigatório");
  if (!d.projeto_nome) throw new Error("Campo 'projeto_nome' obrigatório");
  if (!d.data_fim_prevista) throw new Error("Campo 'data_fim_prevista' obrigatório");

  const projetoId = await resolverProjetoId(d.projeto_nome, tenantId);
  const statusId = await resolverStatusId(d.status || "A Fazer", "atividade");
  const prioridadeId = await resolverPrioridadeId(d.prioridade || "");
  const responsavelId = await resolverUsuarioId(d.responsavel_email || "");

  const { error } = await supabase.from("atividades").insert({
    tenant_id: tenantId,
    projeto_id: projetoId,
    nome: d.nome.trim(),
    descricao: d.descricao?.trim() || d.nome.trim(),
    criterio_aceitacao: d.criterio_aceitacao?.trim() || "Conforme combinado",
    status_id: statusId,
    prioridade_id: prioridadeId,
    responsavel_id: responsavelId,
    data_inicio_prevista: d.data_inicio_prevista || null,
    data_fim_prevista: d.data_fim_prevista,
    estimativa_horas: d.estimativa_horas ? Number(d.estimativa_horas) : null,
    observacoes: d.observacoes || null,
  });
  if (error) throw new Error(error.message);
}

async function importarSubatividade(d: any, tenantId: string) {
  if (!d.nome) throw new Error("Campo 'nome' obrigatório");
  if (!d.atividade_nome) throw new Error("Campo 'atividade_nome' obrigatório");
  if (!d.projeto_nome) throw new Error("Campo 'projeto_nome' obrigatório");
  if (!d.prazo) throw new Error("Campo 'prazo' obrigatório");

  const projetoId = await resolverProjetoId(d.projeto_nome, tenantId);
  const atividadeId = await resolverAtividadeId(d.atividade_nome, projetoId);
  const responsavelId = await resolverUsuarioId(d.responsavel_email || "");

  const statusValidos = ["nao_iniciada", "em_andamento", "concluida", "cancelada"];
  const status = statusValidos.includes(d.status) ? d.status : "nao_iniciada";

  const { error } = await supabase.from("subatividades").insert({
    tenant_id: tenantId,
    atividade_id: atividadeId,
    nome: d.nome.trim(),
    prazo: d.prazo,
    status,
    responsavel_id: responsavelId,
    observacao: d.observacao || null,
  });
  if (error) throw new Error(error.message);
}
