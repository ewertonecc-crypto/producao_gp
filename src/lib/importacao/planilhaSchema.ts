export type ModuloChave = "portfolios" | "programas" | "projetos" | "atividades" | "subatividades";

export const SUBATIVIDADE_STATUS = ["nao_iniciada", "em_andamento", "concluida", "cancelada"] as const;

export type ModuloDef = {
  key: ModuloChave;
  label: string;
  icon: string;
  obrigatorios: string[];
  colunas: string[];
  statusModulo: "portfolio" | "programa" | "projeto" | "atividade" | null;
};

export const MODULOS_PLANILHA: ModuloDef[] = [
  {
    key: "portfolios",
    label: "Portfólios",
    icon: "◇",
    obrigatorios: ["nome", "objetivo", "justificativa"],
    colunas: [
      "nome",
      "objetivo",
      "justificativa",
      "status",
      "descricao",
      "data_inicio_prevista",
      "data_fim_prevista",
      "orcamento_previsto",
      "observacoes",
    ],
    statusModulo: "portfolio",
  },
  {
    key: "programas",
    label: "Programas",
    obrigatorios: ["nome", "portfolio_nome", "objetivo", "justificativa"],
    colunas: [
      "nome",
      "portfolio_nome",
      "objetivo",
      "justificativa",
      "status",
      "prioridade",
      "data_inicio_prevista",
      "data_fim_prevista",
      "orcamento_previsto",
      "observacoes",
    ],
    icon: "◈",
    statusModulo: "programa",
  },
  {
    key: "projetos",
    label: "Projetos",
    icon: "◉",
    obrigatorios: ["nome", "programa_nome", "objetivo", "escopo", "justificativa"],
    colunas: [
      "nome",
      "programa_nome",
      "objetivo",
      "escopo",
      "justificativa",
      "status",
      "prioridade",
      "data_inicio_prevista",
      "data_fim_prevista",
      "orcamento_previsto",
      "responsavel_email",
      "observacoes",
    ],
    statusModulo: "projeto",
  },
  {
    key: "atividades",
    label: "Atividades",
    icon: "✦",
    obrigatorios: ["nome", "projeto_nome", "data_fim_prevista"],
    colunas: [
      "nome",
      "projeto_nome",
      "descricao",
      "criterio_aceitacao",
      "status",
      "prioridade",
      "data_inicio_prevista",
      "data_fim_prevista",
      "estimativa_horas",
      "responsavel_email",
      "observacoes",
    ],
    statusModulo: "atividade",
  },
  {
    key: "subatividades",
    label: "Subatividades",
    icon: "⊕",
    obrigatorios: ["nome", "atividade_nome", "projeto_nome", "prazo"],
    colunas: ["nome", "atividade_nome", "projeto_nome", "status", "prazo", "responsavel_email", "observacao"],
    statusModulo: null,
  },
];

/** Normaliza chave vinda do Excel (remove *, espaços, minúsculas). */
export function normalizarChaveCelula(k: string): string {
  return k
    .replace(/\s*\*\s*$/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function definicaoModulo(key: ModuloChave): ModuloDef {
  const m = MODULOS_PLANILHA.find((x) => x.key === key);
  if (!m) throw new Error(`Módulo desconhecido: ${key}`);
  return m;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const NUM = /^-?\d+([.,]\d+)?$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isDataIso(s: string): boolean {
  if (!s || !ISO.test(s.trim())) return false;
  const d = new Date(s.trim() + "T12:00:00");
  return !Number.isNaN(d.getTime());
}

export function isNumeroOuVazio(s: string): boolean {
  if (!s || !String(s).trim()) return true;
  return NUM.test(String(s).trim().replace(",", "."));
}

export function isEmailOuVazio(s: string): boolean {
  if (!s || !String(s).trim()) return true;
  return EMAIL_RE.test(String(s).trim());
}
