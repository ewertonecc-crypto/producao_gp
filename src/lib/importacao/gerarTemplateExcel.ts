import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { buscarListasReferencia } from "./importacaoListas";
import { definicaoModulo, MODULOS_PLANILHA, SUBATIVIDADE_STATUS, type ModuloChave } from "./planilhaSchema";

const MAX_LIN = 1000; /* linhas de dados 2..1001, tabela 1:1000 ~ */

const COLS_HIERARQUIA = ["PORTFÓLIO", "PROGRAMA", "PROJETO", "ATIVIDADE", "COD. ATIV.", "PRAZO", "% CONCL."] as const;

function colString(n1: number): string {
  let n = n1;
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

const HEADER_OBR: Partial<ExcelJS.Fill> = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF4F46E5" },
};
const HEADER_OPT: Partial<ExcelJS.Fill> = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF475569" },
};

function aplicarCabecalho(
  row: ExcelJS.Row,
  mod: ReturnType<typeof definicaoModulo>
) {
  mod.colunas.forEach((c, i) => {
    const cell = row.getCell(i + 1);
    const ob = mod.obrigatorios.includes(c);
    const label = ob ? `${c} *` : c;
    cell.value = label;
    cell.fill = (ob ? HEADER_OBR : HEADER_OPT) as ExcelJS.Fill;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}

function exemploLinha(key: ModuloChave): (string | number)[] {
  const x: Record<ModuloChave, (string | number)[]> = {
    portfolios: [
      "Grupo Econômico",
      "Centralizar projetos",
      "Alinhamento",
      "Ativo",
      "Desc.",
      "2026-01-01",
      "2026-12-31",
      500000,
      "",
    ],
    programas: [
      "Transformação Digital",
      "Grupo Econômico",
      "Modernizar",
      "Necessidade",
      "Ativo",
      "Alta",
      "2026-02-01",
      "2026-11-30",
      200000,
      "",
    ],
    projetos: [
      "Sistema Integração",
      "Transformação Digital",
      "Integrar",
      "Escopo",
      "Justif.",
      "Em Planejamento",
      "Alta",
      "2026-03-01",
      "2026-09-30",
      80000,
      "email@exemplo.com",
      "",
    ],
    atividades: [
      "Levantamento requisitos",
      "Sistema Integração",
      "Descrição",
      "Critério",
      "A Fazer",
      "Alta",
      "2026-03-01",
      "2026-03-15",
      16,
      "email@exemplo.com",
      "",
    ],
    subatividades: [
      "Tarefa 1",
      "Levantamento requisitos",
      "Sistema Integração",
      "nao_iniciada",
      "2026-03-10",
      "",
      "",
    ],
  };
  return x[key] ?? [];
}

function escreverListasH(
  sh: ExcelJS.Worksheet,
  ref: Awaited<ReturnType<typeof buscarListasReferencia>>
) {
  const w = (col: string, r: number, v: string) => {
    sh.getCell(`${col}${r}`).value = v;
  };
  w("A", 1, "status_portfolio");
  w("B", 1, "status_programa");
  w("C", 1, "status_projeto");
  w("D", 1, "status_atividade");
  w("E", 1, "prioridades");
  w("F", 1, "nomes_portfolios");
  w("G", 1, "nomes_programas");
  w("H", 1, "nomes_projetos");
  w("I", 1, "nomes_atividades");

  let rA = 2;
  ref.statusPorModulo.portfolio.forEach((n, i) => w("A", rA + i, n));
  const endA = Math.max(2, 1 + ref.statusPorModulo.portfolio.length);

  let rB = 2;
  ref.statusPorModulo.programa.forEach((n, i) => w("B", rB + i, n));
  const endB = Math.max(2, 1 + ref.statusPorModulo.programa.length);

  let rC = 2;
  ref.statusPorModulo.projeto.forEach((n, i) => w("C", rC + i, n));
  const endC = Math.max(2, 1 + ref.statusPorModulo.projeto.length);

  let rD = 2;
  ref.statusPorModulo.atividade.forEach((n, i) => w("D", rD + i, n));
  const endD = Math.max(2, 1 + ref.statusPorModulo.atividade.length);

  let rE = 2;
  ref.prioridades.forEach((n, i) => w("E", rE + i, n));
  const endE = Math.max(2, 1 + ref.prioridades.length);

  let rF = 2;
  ref.nomesPortfolios.forEach((n, i) => w("F", rF + i, n));
  const endF = Math.max(2, 1 + ref.nomesPortfolios.length);

  let rG = 2;
  ref.nomesProgramas.forEach((n, i) => w("G", rG + i, n));
  const endG = Math.max(2, 1 + ref.nomesProgramas.length);

  let rH = 2;
  ref.nomesProjetos.forEach((n, i) => w("H", rH + i, n));
  const endH = Math.max(2, 1 + ref.nomesProjetos.length);

  let rI = 2;
  ref.nomesAtividades.forEach((n, i) => w("I", rI + i, n));
  const endI = Math.max(2, 1 + ref.nomesAtividades.length);

  for (const c of ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const) {
    sh.getRow(1).getCell(c).font = { bold: true, color: { argb: "FF0F172A" } };
    sh.getRow(1).getCell(c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCBD5E1" },
    } as ExcelJS.Fill;
  }

  return {
    rStPf: `=LISTAS!$A$2:$A$${endA}`,
    rStPr: `=LISTAS!$B$2:$B$${endB}`,
    rStPj: `=LISTAS!$C$2:$C$${endC}`,
    rStAt: `=LISTAS!$D$2:$D$${endD}`,
    rPrio: `=LISTAS!$E$2:$E$${endE}`,
    rPf: `=LISTAS!$F$2:$F$${endF}`,
    rProgr: `=LISTAS!$G$2:$G$${endG}`,
    rProj: `=LISTAS!$H$2:$H$${endH}`,
    rAtv: `=LISTAS!$I$2:$I$${endI}`,
  };
}

function addListaValidacao(
  ws: ExcelJS.Worksheet,
  col1: number,
  formulae: string,
  r0 = 2,
  r1 = MAX_LIN
) {
  for (let r = r0; r <= r1; r++) {
    const c = ws.getRow(r).getCell(col1);
    c.dataValidation = {
      type: "list",
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Lista",
      error: "Escolha um valor da lista do sistema (aba LISTAS).",
      formulae: [formulae] as [string],
    } as ExcelJS.DataValidation;
  }
}

function addListaStringFixa(
  ws: ExcelJS.Worksheet,
  col1: number,
  itens: readonly string[]
) {
  const f = `"${itens.join(",")}"`;
  for (let r = 2; r <= MAX_LIN; r++) {
    ws.getRow(r).getCell(col1).dataValidation = {
      type: "list",
      allowBlank: true,
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Status subatividade",
      error: "Use: " + itens.join(", "),
      formulae: [f] as [string],
    } as ExcelJS.DataValidation;
  }
}

export async function gerarBufferTemplateImportacao(tenantId: string): Promise<ArrayBuffer> {
  const ref = await buscarListasReferencia(tenantId);
  const wb = new ExcelJS.Workbook();
  wb.creator = "ProjectOS";
  wb.created = new Date();

  const wsL = wb.addWorksheet("LISTAS", { state: "veryHidden" });
  const rgs = escreverListasH(wsL, ref);
  for (const c of "ABCDEFGHI") {
    const coln = c.charCodeAt(0) - 64;
    const width = 28;
    wsL.getColumn(coln).width = width;
  }

  // INSTRUÇÕES
  const wIns = wb.addWorksheet("INSTRUÇÕES", { properties: { tabColor: { argb: "FF6366F1" } } });
  const linhas: (string | string[])[] = [
    ["ProjectOS — template de importação (tabelas e cores no Excel)"],
    [""],
    ["Regras"],
    ["1) Preencha só as abas de dados; não renomeie colunas. Campos * são obrigatórios (linha 1 colorida)."],
    ["2) Datas: AAAA-MM-DD. Números: use ponto (15000.00). E-mails: formato válido."],
    ["3) Status, prioridade e nomes (portfólio, programa, projeto, atividades na aba Subatividades) possuem listas: use a célula com validação (aba oculta LISTAS)."],
    [""],
    ["Ordem: Portfólios → Programas → Projetos → Atividades → Subatividades."],
  ];
  linhas.forEach((row, i) => {
    const r = wIns.getRow(i + 1);
    if (Array.isArray(row)) {
      (row as string[]).forEach((cell, j) => r.getCell(j + 1).value = cell);
    } else {
      r.getCell(1).value = row;
    }
  });
  wIns.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E1B4B" } };
  wIns.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E7FF" },
  } as ExcelJS.Fill;
  wIns.getColumn(1).width = 100;

  for (const m of MODULOS_PLANILHA) {
    const sh = wb.addWorksheet(m.label.toUpperCase().replace(/[/\\*?:]/g, " "), {
      properties: { tabColor: { argb: "FF6366F1" } },
    });
    sh.views = [{ state: "frozen", ySplit: 1, activeCell: "A2" }];

    const def = definicaoModulo(m.key);
    const nc = def.colunas.length;
    const lastC = colString(nc);
    const headerRow = sh.getRow(1);
    aplicarCabecalho(headerRow, def);
    const ex = exemploLinha(m.key);
    ex.forEach((v, i) => {
      sh.getRow(2).getCell(i + 1).value = v;
    });
    sh.getRow(2).eachCell((cell) => {
      if (cell.value) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } } as ExcelJS.Fill;
    });

    for (let c = 1; c <= nc; c++) {
      sh.getColumn(c).width = 22;
    }

    (sh as { addTable: (p: unknown) => void }).addTable({
      name: `tbl_${m.key}`.replace(/[^a-z0-9_]/gi, "_").slice(0, 32),
      ref: `A1:${lastC}${MAX_LIN}`,
      headerRow: true,
      columns: def.colunas.map((c) => ({
        name: def.obrigatorios.includes(c) ? `${c} *` : c,
      })),
      rows: [
        ex,
        ...Array.from({ length: MAX_LIN - 2 }, () => def.colunas.map(() => "" as string | number)),
      ],
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
        showColumnStripes: false,
      },
    });

    // Validação por módulo (colunas 1-based)
    if (m.key === "portfolios") {
      if (def.statusModulo) addListaValidacao(sh, 4, rgs.rStPf);
    } else if (m.key === "programas") {
      addListaValidacao(sh, 2, rgs.rPf);
      addListaValidacao(sh, 5, rgs.rStPr);
      addListaValidacao(sh, 6, rgs.rPrio);
    } else if (m.key === "projetos") {
      addListaValidacao(sh, 2, rgs.rProgr);
      addListaValidacao(sh, 6, rgs.rStPj);
      addListaValidacao(sh, 7, rgs.rPrio);
    } else if (m.key === "atividades") {
      addListaValidacao(sh, 2, rgs.rProj);
      addListaValidacao(sh, 5, rgs.rStAt);
      addListaValidacao(sh, 6, rgs.rPrio);
    } else if (m.key === "subatividades") {
      addListaValidacao(sh, 2, rgs.rAtv);
      addListaValidacao(sh, 3, rgs.rProj);
      addListaStringFixa(sh, 4, SUBATIVIDADE_STATUS);
    }
  }

  // Hierarquia atual
  const { data: hier } = await supabase
    .from("portfolios")
    .select(
      `
      codigo, nome,
      programas ( codigo, nome, projetos ( codigo, nome, atividades ( codigo, nome, data_fim_prevista, percentual_concluido ) ) )
    `
    )
    .eq("tenant_id", tenantId);

  const hRows: (string | number)[][] = [[...COLS_HIERARQUIA]];
  (hier || []).forEach((po: { nome: string; programas: any[] }) => {
    (po.programas || []).forEach((pr: { nome: string; projetos: any[] }) => {
      (pr.projetos || []).forEach((pj: { nome: string; atividades: any[] }) => {
        if ((pj.atividades || []).length === 0) {
          hRows.push([po.nome, pr.nome, pj.nome, "", "", "", ""]);
        } else {
          (pj.atividades || []).forEach((a: { nome: string; codigo: string; data_fim_prevista: string; percentual_concluido: number }) => {
            hRows.push([po.nome, pr.nome, pj.nome, a.nome, a.codigo, a.data_fim_prevista ?? "", a.percentual_concluido ?? 0]);
          });
        }
      });
    });
  });
  const wh = wb.addWorksheet("HIERARQUIA_ATUAL", { properties: { tabColor: { argb: "FF059669" } } });
  hRows.forEach((row, i) => {
    const r = wh.getRow(i + 1);
    row.forEach((v, j) => {
      const c = r.getCell(j + 1);
      c.value = v;
      if (i === 0) {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } } as ExcelJS.Fill;
      }
    });
  });
  for (let c = 1; c <= 7; c++) wh.getColumn(c).width = c === 4 ? 36 : 22;
  if (hRows.length > 1) {
    (wh as { addTable: (p: unknown) => void }).addTable({
      name: "tbl_hier_atual",
      ref: `A1:G${hRows.length}`,
      headerRow: true,
      columns: COLS_HIERARQUIA.map((name) => ({ name })),
      rows: hRows.slice(1),
      style: { theme: "TableStyleMedium9", showRowStripes: true },
    });
  }

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export async function gerarBufferExportDados(tenantId: string): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "ProjectOS";

  const { data: hier } = await supabase
    .from("portfolios")
    .select(
      `
      codigo, nome,
      programas ( codigo, nome, projetos ( codigo, nome, atividades ( codigo, nome, data_fim_prevista, percentual_concluido ) ) )
    `
    )
    .eq("tenant_id", tenantId);
  const hRows: (string | number)[][] = [[...COLS_HIERARQUIA]];
  (hier || []).forEach((po: { nome: string; programas: any[] }) => {
    (po.programas || []).forEach((pr: { nome: string; projetos: any[] }) => {
      (pr.projetos || []).forEach((pj: { nome: string; atividades: any[] }) => {
        if ((pj.atividades || []).length === 0) {
          hRows.push([po.nome, pr.nome, pj.nome, "", "", "", ""]);
        } else {
          (pj.atividades || []).forEach((a: { nome: string; codigo: string; data_fim_prevista: string; percentual_concluido: number }) => {
            hRows.push([po.nome, pr.nome, pj.nome, a.nome, a.codigo, a.data_fim_prevista ?? "", a.percentual_concluido ?? 0]);
          });
        }
      });
    });
  });
  const wh = wb.addWorksheet("HIERARQUIA_ATUAL");
  hRows.forEach((row, i) => {
    const r = wh.getRow(i + 1);
    row.forEach((v, j) => {
      const c = r.getCell(j + 1);
      c.value = v;
      if (i === 0) {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } } as ExcelJS.Fill;
      }
    });
  });
  for (let c = 1; c <= 7; c++) wh.getColumn(c).width = 24;
  if (hRows.length > 1) {
    (wh as { addTable: (p: unknown) => void }).addTable({
      name: "export_hier",
      ref: `A1:G${hRows.length}`,
      headerRow: true,
      columns: COLS_HIERARQUIA.map((name) => ({ name })),
      rows: hRows.slice(1),
      style: { theme: "TableStyleMedium9", showRowStripes: true },
    });
  }

  for (const m of MODULOS_PLANILHA) {
    const tabela = m.key === "subatividades" ? "v_subatividades" : m.key;
    const { data } = await supabase.from(tabela as never).select("*").eq("tenant_id", tenantId);
    if (!data || data.length === 0) continue;
    const keys = Object.keys(data[0] as object);
    const sh = wb.addWorksheet(m.label.toUpperCase().replace(/[/\\*?:]/g, " ").slice(0, 31));
    const r1 = sh.getRow(1);
    keys.forEach((k, j) => {
      const c = r1.getCell(j + 1);
      c.value = k;
      c.font = { bold: true, color: { argb: "FFFFFFFF" } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } } as ExcelJS.Fill;
    });
    (data as Record<string, unknown>[]).forEach((row, i) => {
      const r = sh.getRow(i + 2);
      keys.forEach((k, j) => {
        r.getCell(j + 1).value = row[k] as string | number | null | undefined;
      });
    });
    const lastR = 1 + data.length;
    const lastC = colString(keys.length);
    keys.forEach((_, j) => {
      sh.getColumn(j + 1).width = 20;
    });
    (sh as { addTable: (p: unknown) => void }).addTable({
      name: `ex_${m.key}`.replace(/[^a-z0-9_]/gi, "_").slice(0, 32),
      ref: `A1:${lastC}${lastR}`,
      headerRow: true,
      columns: keys.map((k) => ({ name: k })),
      rows: (data as Record<string, unknown>[]).map((row) => keys.map((k) => row[k] as string | number | null | undefined)),
      style: { theme: "TableStyleMedium2", showRowStripes: true },
    });
  }

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
