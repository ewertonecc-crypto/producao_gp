import {
  definicaoModulo,
  isDataIso,
  isEmailOuVazio,
  isNumeroOuVazio,
  normalizarChaveCelula,
  SUBATIVIDADE_STATUS,
  type ModuloChave,
} from "./planilhaSchema";
import type { LinhaImportacao } from "@/hooks/useImportacao";

export type ListasReferencia = {
  statusPorModulo: Record<"portfolio" | "programa" | "projeto" | "atividade", string[]>;
  prioridades: string[];
  nomesPortfolios: string[];
  nomesProgramas: string[];
  nomesProjetos: string[];
  nomesAtividades: string[];
};

function ignoraLinhaVazia(d: Record<string, unknown>): boolean {
  return Object.values(d).every((v) => !String(v ?? "").trim());
}

function normalizarValor(v: unknown): string {
  return String(v ?? "").trim();
}

/** Compara nome com lista (exata, depois case-insensitive). */
function valorNaLista(val: string, lista: string[]): boolean {
  const t = val.trim();
  if (!t) return true;
  if (lista.some((x) => x === t)) return true;
  const low = t.toLowerCase();
  return lista.some((x) => x.toLowerCase() === low);
}

/**
 * Valida cabeçalho: exige exatamente as colunas do template (nomes normalizados),
 * podendo ter colunas a mais; obrigatórias devem existir.
 */
export function validarCabeçalho(
  modulo: ModuloChave,
  chavesBrutas: string[]
): { ok: true } | { ok: false; mensagem: string } {
  const def = definicaoModulo(modulo);
  const normalizadas = chavesBrutas.map((k) => normalizarChaveCelula(k));
  const set = new Set(normalizadas.filter(Boolean));

  const faltando = def.colunas.filter((c) => !set.has(c));
  if (faltando.length > 0) {
    return {
      ok: false,
      mensagem: `Cabeçalho incorreto. Colunas faltando ou com nome errado: ${faltando.join(", ")}. Use o template exportado (nomes e ordem exatos).`,
    };
  }

  return { ok: true };
}

function validarCampoObr(
  v: string,
  nomeCampo: string
): string | null {
  if (!v.trim()) return `Campo obrigatório vazio: ${nomeCampo}`;
  return null;
}

/**
 * Uma linha (dados) após chaves normalizadas.
 */
export function validarLinhaDados(
  modulo: ModuloChave,
  dados: Record<string, string>,
  ref: ListasReferencia
): string | null {
  const d = { ...dados };

  if (ignoraLinhaVazia(d as Record<string, unknown>)) return null;

  if (modulo === "portfolios") {
    const e1 = validarCampoObr(d.nome, "nome");
    if (e1) return e1;
    const e2 = validarCampoObr(d.objetivo, "objetivo");
    if (e2) return e2;
    const e3 = validarCampoObr(d.justificativa, "justificativa");
    if (e3) return e3;
    if (d.status && !valorNaLista(d.status, ref.statusPorModulo.portfolio)) {
      return `Status inválido para portfólio. Use: ${ref.statusPorModulo.portfolio.join(" | ")}`;
    }
    for (const k of ["data_inicio_prevista", "data_fim_prevista"] as const) {
      if (d[k] && !isDataIso(d[k])) return `${k} deve ser AAAA-MM-DD`;
    }
    if (d.orcamento_previsto && !isNumeroOuVazio(d.orcamento_previsto)) return "orcamento_previsto: número inválido";
    return null;
  }

  if (modulo === "programas") {
    const e1 = validarCampoObr(d.nome, "nome");
    if (e1) return e1;
    const e2 = validarCampoObr(d.portfolio_nome, "portfolio_nome");
    if (e2) return e2;
    if (d.portfolio_nome && ref.nomesPortfolios.length > 0 && !valorNaLista(d.portfolio_nome, ref.nomesPortfolios)) {
      return `portfolio_nome "${d.portfolio_nome}" não encontrado no cadastro.`;
    }
    const e3 = validarCampoObr(d.objetivo, "objetivo");
    if (e3) return e3;
    const e4 = validarCampoObr(d.justificativa, "justificativa");
    if (e4) return e4;
    if (d.status && !valorNaLista(d.status, ref.statusPorModulo.programa)) {
      return `Status inválido. Use: ${ref.statusPorModulo.programa.join(" | ")}`;
    }
    if (d.prioridade && !valorNaLista(d.prioridade, ref.prioridades)) {
      return `Prioridade inválida. Use: ${ref.prioridades.join(" | ")}`;
    }
    for (const k of ["data_inicio_prevista", "data_fim_prevista"] as const) {
      if (d[k] && !isDataIso(d[k])) return `${k} deve ser AAAA-MM-DD`;
    }
    if (d.orcamento_previsto && !isNumeroOuVazio(d.orcamento_previsto)) return "orcamento_previsto: número inválido";
    return null;
  }

  if (modulo === "projetos") {
    for (const f of ["nome", "programa_nome", "objetivo", "escopo", "justificativa"] as const) {
      const e = validarCampoObr(d[f] ?? "", f);
      if (e) return e;
    }
    if (d.programa_nome && ref.nomesProgramas.length > 0 && !valorNaLista(d.programa_nome, ref.nomesProgramas)) {
      return `programa_nome "${d.programa_nome}" não encontrado no cadastro.`;
    }
    if (d.status && !valorNaLista(d.status, ref.statusPorModulo.projeto)) {
      return `Status inválido. Use: ${ref.statusPorModulo.projeto.join(" | ")}`;
    }
    if (d.prioridade && !valorNaLista(d.prioridade, ref.prioridades)) {
      return `Prioridade inválida. Use: ${ref.prioridades.join(" | ")}`;
    }
    for (const k of ["data_inicio_prevista", "data_fim_prevista"] as const) {
      if (d[k] && !isDataIso(d[k])) return `${k} deve ser AAAA-MM-DD`;
    }
    if (d.orcamento_previsto && !isNumeroOuVazio(d.orcamento_previsto)) return "orcamento_previsto: número inválido";
    if (d.responsavel_email && !isEmailOuVazio(d.responsavel_email)) return "responsavel_email inválido";
    return null;
  }

  if (modulo === "atividades") {
    const e1 = validarCampoObr(d.nome, "nome");
    if (e1) return e1;
    const e2 = validarCampoObr(d.projeto_nome, "projeto_nome");
    if (e2) return e2;
    if (d.projeto_nome && ref.nomesProjetos.length > 0 && !valorNaLista(d.projeto_nome, ref.nomesProjetos)) {
      return `projeto_nome "${d.projeto_nome}" não encontrado no cadastro.`;
    }
    const e3 = validarCampoObr(d.data_fim_prevista, "data_fim_prevista");
    if (e3) return e3;
    if (d.data_fim_prevista && !isDataIso(d.data_fim_prevista)) return "data_fim_prevista deve ser AAAA-MM-DD";
    if (d.data_inicio_prevista && !isDataIso(d.data_inicio_prevista)) return "data_inicio_prevista deve ser AAAA-MM-DD";
    if (d.status && !valorNaLista(d.status, ref.statusPorModulo.atividade)) {
      return `Status inválido. Use: ${ref.statusPorModulo.atividade.join(" | ")}`;
    }
    if (d.prioridade && !valorNaLista(d.prioridade, ref.prioridades)) {
      return `Prioridade inválida. Use: ${ref.prioridades.join(" | ")}`;
    }
    if (d.estimativa_horas && !isNumeroOuVazio(d.estimativa_horas)) return "estimativa_horas: número inválido";
    if (d.responsavel_email && !isEmailOuVazio(d.responsavel_email)) return "responsavel_email inválido";
    return null;
  }

  if (modulo === "subatividades") {
    for (const f of ["nome", "atividade_nome", "projeto_nome", "prazo"] as const) {
      const e = validarCampoObr(d[f] ?? "", f);
      if (e) return e;
    }
    if (d.atividade_nome && ref.nomesAtividades.length > 0 && !valorNaLista(d.atividade_nome, ref.nomesAtividades)) {
      return `atividade_nome "${d.atividade_nome}" não encontrado no cadastro.`;
    }
    if (d.projeto_nome && ref.nomesProjetos.length > 0 && !valorNaLista(d.projeto_nome, ref.nomesProjetos)) {
      return `projeto_nome "${d.projeto_nome}" não encontrado no cadastro.`;
    }
    if (d.prazo && !isDataIso(d.prazo)) return "prazo deve ser AAAA-MM-DD";
    if (d.status && d.status !== "" && !SUBATIVIDADE_STATUS.includes(d.status as (typeof SUBATIVIDADE_STATUS)[number])) {
      return `status deve ser: ${SUBATIVIDADE_STATUS.join(" | ")}`;
    }
    if (d.responsavel_email && !isEmailOuVazio(d.responsavel_email)) return "responsavel_email inválido";
    return null;
  }

  return "Módulo desconhecido";
}

export type ResultadoValidacao = {
  cabecalho: { ok: true } | { ok: false; mensagem: string };
  erros: { linha: number; mensagem: string }[];
  linhasOk: LinhaImportacao[];
};

/**
 * @param rawRows resultado de sheet_to_json
 * @param linhaBase 2 = primeira linha de dados no Excel
 */
export function validarPlanilhaCompleta(
  modulo: ModuloChave,
  rawRows: Record<string, unknown>[],
  ref: ListasReferencia,
  linhaBase = 2
): ResultadoValidacao {
  if (rawRows.length === 0) {
    return {
      cabecalho: { ok: false, mensagem: "Nenhum dado na aba (planilha vazia ou só cabeçalho inexistente)." },
      erros: [],
      linhasOk: [],
    };
  }

  const chaves0 = Object.keys(rawRows[0] ?? {});
  const cabecalho = validarCabeçalho(modulo, chaves0);
  if (!cabecalho.ok) {
    return { cabecalho, erros: [], linhasOk: [] };
  }

  const def = definicaoModulo(modulo);
  const erros: { linha: number; mensagem: string }[] = [];
  const linhasOk: LinhaImportacao[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i] ?? {};
    const dados: Record<string, string> = {};
    for (const col of def.colunas) {
      const rawKey = chaves0.find((k) => normalizarChaveCelula(k) === col);
      const v = rawKey != null ? row[rawKey] : "";
      dados[col] = normalizarValor(v);
    }

    if (ignoraLinhaVazia(dados as Record<string, unknown>)) continue;

    const nLinha = linhaBase + i;
    const err = validarLinhaDados(modulo, dados, ref);
    if (err) erros.push({ linha: nLinha, mensagem: err });
    else linhasOk.push({ linha: nLinha, dados });
  }

  return { cabecalho: { ok: true }, erros, linhasOk };
}
