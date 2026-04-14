import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { fmtDate } from "@/lib/utils";

type RelNome = { nome?: string | null } | { nome?: string | null }[] | null | undefined;

/** Tipos alinhados ao retorno do Supabase (relação pode vir como objeto ou array). */
export type DashboardPdfProjeto = {
  codigo?: string | null;
  nome?: string | null;
  progresso_percentual?: number | null;
  data_fim_prevista?: string | null;
  status?: RelNome;
  prioridade?: RelNome;
  gerente?: RelNome;
};

export type DashboardPdfMarco = {
  nome: string;
  data_prevista?: string | null;
  data_real?: string | null;
  status?: string | null;
  is_critico?: boolean | null;
  projeto?: RelNome;
  programa?: RelNome;
};

function nomeDeRel(r: RelNome): string {
  if (r == null) return "—";
  if (Array.isArray(r)) return r[0]?.nome ?? "—";
  return r.nome ?? "—";
}

const M = 14;
const PAGE_W = 210;
const PAGE_H = 297;

const COL_TEXT: [number, number, number] = [15, 23, 42];
const COL_MUTED: [number, number, number] = [100, 116, 139];
const COL_LINE: [number, number, number] = [226, 232, 240];
const COL_TRACK: [number, number, number] = [241, 245, 249];

const STATUS_BAR_COLORS: Record<string, [number, number, number]> = {
  "Em Execução": [6, 182, 212],
  "Em Planejamento": [99, 102, 241],
  Concluído: [16, 185, 129],
  "Em Revisão": [245, 158, 11],
};

function statusBarColor(nome: string): [number, number, number] {
  return STATUS_BAR_COLORS[nome] ?? [79, 70, 229];
}

function ensureSpace(doc: jsPDF, y: number, needMm: number): number {
  if (y + needMm > PAGE_H - M) {
    doc.addPage();
    return M;
  }
  return y;
}

function sectionHeading(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COL_TEXT);
  doc.text(title, M, y);
  doc.setDrawColor(...COL_LINE);
  doc.setLineWidth(0.3);
  doc.line(M, y + 1.5, PAGE_W - M, y + 1.5);
  return y + 9;
}

function drawKpiRow(
  doc: jsPDF,
  y: number,
  items: { label: string; value: string; hint: string }[],
): number {
  y = ensureSpace(doc, y, 28);
  const gap = 4;
  const n = items.length;
  const boxW = (PAGE_W - 2 * M - (n - 1) * gap) / n;
  const boxH = 22;
  let x = M;
  doc.setFontSize(8);
  for (const it of items) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...COL_LINE);
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD");
    doc.setTextColor(...COL_MUTED);
    doc.setFont("helvetica", "normal");
    doc.text(it.label.toUpperCase(), x + 3, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COL_TEXT);
    doc.text(it.value, x + 3, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COL_MUTED);
    const hintLines = doc.splitTextToSize(it.hint, boxW - 6) as string[];
    doc.text(hintLines, x + 3, y + 19);
    x += boxW + gap;
  }
  return y + boxH + 6;
}

function drawHorizontalBars(
  doc: jsPDF,
  y: number,
  title: string,
  entries: { label: string; value: number; color?: [number, number, number] }[],
  total: number,
): number {
  y = sectionHeading(doc, y, title);
  if (entries.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...COL_MUTED);
    doc.text("Sem dados para exibir.", M, y);
    return y + 8;
  }
  const labelW = 48;
  const barLeft = M + labelW;
  const barRight = PAGE_W - M;
  const barMaxW = barRight - barLeft - 18;
  const rowH = 7;
  for (const e of entries) {
    y = ensureSpace(doc, y, rowH + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...COL_TEXT);
    const lab = doc.splitTextToSize(e.label, labelW - 2) as string[];
    doc.text(lab[0] ?? e.label, M, y + 4);
    const frac = total > 0 ? e.value / total : 0;
    doc.setFillColor(...COL_TRACK);
    doc.rect(barLeft, y, barMaxW, 4.5, "F");
    const [r, g, b] = e.color ?? statusBarColor(e.label);
    doc.setFillColor(r, g, b);
    doc.rect(barLeft, y, Math.max(0.3, barMaxW * frac), 4.5, "F");
    doc.setTextColor(...COL_MUTED);
    doc.setFontSize(8);
    doc.text(`${e.value} (${Math.round(frac * 100)}%)`, barLeft + barMaxW + 2, y + 3.8);
    y += rowH + 2;
  }
  return y + 4;
}

function drawProgressHistogram(doc: jsPDF, y: number, projetos: DashboardPdfProjeto[]): number {
  const buckets = [
    { label: "0–24%", min: 0, max: 24 },
    { label: "25–49%", min: 25, max: 49 },
    { label: "50–74%", min: 50, max: 74 },
    { label: "75–100%", min: 75, max: 100 },
  ];
  const counts = buckets.map((b) => ({
    label: b.label,
    value: projetos.filter((p) => {
      const pct = Math.round(p.progresso_percentual ?? 0);
      return pct >= b.min && pct <= b.max;
    }).length,
  }));
  const maxC = Math.max(1, ...counts.map((c) => c.value));
  y = sectionHeading(doc, y, "Distribuição de progresso");
  const chartH = 40;
  y = ensureSpace(doc, y, chartH + 14);
  const chartLeft = M;
  const chartW = PAGE_W - 2 * M;
  const baseY = y + chartH;
  const barW = (chartW - (counts.length - 1) * 6) / counts.length;
  let x = chartLeft;
  for (let i = 0; i < counts.length; i++) {
    const c = counts[i]!;
    const h = (c.value / maxC) * (chartH - 8);
    const trackTop = y + 8;
    const trackH = chartH - 8;
    doc.setFillColor(...COL_TRACK);
    doc.rect(x, trackTop, barW, trackH, "F");
    doc.setFillColor(99, 102, 241);
    doc.rect(x, trackTop + trackH - h, barW, h, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COL_TEXT);
    doc.text(String(c.value), x + barW / 2, baseY - 1, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(...COL_MUTED);
    doc.text(c.label, x + barW / 2, baseY + 4, { align: "center" });
    x += barW + 6;
  }
  return baseY + 12;
}

export function buildDashboardPdf(projetos: DashboardPdfProjeto[], marcos: DashboardPdfMarco[]): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const hoje = new Date();
  const emExec = projetos.filter((p) => nomeDeRel(p.status).toLowerCase().includes("execu")).length;
  const conc = projetos.filter((p) => nomeDeRel(p.status).toLowerCase().includes("conclu")).length;
  const atrasados = projetos.filter(
    (p) => p.data_fim_prevista && new Date(p.data_fim_prevista) < hoje && (p.progresso_percentual ?? 0) < 100,
  ).length;

  let y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COL_TEXT);
  doc.text("Relatório executivo — Portfólio", M, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COL_MUTED);
  doc.text(`Gerado em ${format(hoje, "dd/MM/yyyy HH:mm", { locale: ptBR })} · Indicadores e projetos`, M, y);
  y += 10;

  y = drawKpiRow(doc, y, [
    { label: "Total de projetos", value: String(projetos.length), hint: "Cadastrados no portfólio" },
    { label: "Em execução", value: String(emExec), hint: "Status ativo" },
    { label: "Concluídos", value: String(conc), hint: "Finalizados" },
    {
      label: "Em atraso",
      value: String(atrasados),
      hint: atrasados > 0 ? "Prazo vencido e progresso < 100%" : "Nenhum atraso identificado",
    },
  ]);

  const groups: Record<string, number> = {};
  projetos.forEach((p) => {
    const n = nomeDeRel(p.status);
    const key = n === "—" ? "Sem status" : n;
    groups[key] = (groups[key] ?? 0) + 1;
  });
  const statusEntries = Object.entries(groups)
    .map(([label, value]) => ({ label, value, color: statusBarColor(label) }))
    .sort((a, b) => b.value - a.value);

  y = drawHorizontalBars(doc, y, "Projetos por status", statusEntries, projetos.length || 1);
  y = drawProgressHistogram(doc, y, projetos);

  y = sectionHeading(doc, y, "Próximos marcos (amostra)");
  const marcosSample = marcos.slice(0, 12);
  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Marco", "Projeto / programa", "Previsto", "Situação"]],
    body: marcosSample.map((m) => {
      const ctxP = nomeDeRel(m.projeto);
      const ctxPr = nomeDeRel(m.programa);
      const ctx = ctxP !== "—" ? ctxP : ctxPr !== "—" ? ctxPr : "—";
      const done = !!m.data_real || m.status === "atingido";
      const sit = done ? "Concluído" : m.is_critico ? "Crítico" : "Pendente";
      return [m.nome, ctx, fmtDate(m.data_prevista), sit];
    }),
    styles: { fontSize: 8, cellPadding: 2, textColor: COL_TEXT },
    headStyles: { fillColor: [241, 245, 249], textColor: COL_TEXT, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 254] },
    theme: "plain",
  });
  const docAfterMarcos = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  y = (docAfterMarcos.lastAutoTable?.finalY ?? y) + 10;

  y = ensureSpace(doc, y, 16);
  y = sectionHeading(doc, y, "Projetos (detalhamento)");

  const tableBody = projetos.map((p) => {
    const pct = Math.round(p.progresso_percentual ?? 0);
    const g = nomeDeRel(p.gerente);
    const gerenteCurto = g !== "—" ? (g.split(" ")[0] ?? g) : "—";
    return [
      p.codigo ?? "—",
      p.nome ?? "—",
      nomeDeRel(p.status),
      nomeDeRel(p.prioridade),
      `${pct}%`,
      fmtDate(p.data_fim_prevista),
      gerenteCurto,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: M, right: M },
    head: [["Código", "Projeto", "Status", "Prioridade", "Progresso", "Prazo", "Gerente"]],
    body: tableBody.length ? tableBody : [["—", "Nenhum projeto", "—", "—", "—", "—", "—"]],
    styles: { fontSize: 7.5, cellPadding: 1.5, textColor: COL_TEXT },
    headStyles: { fillColor: [241, 245, 249], textColor: COL_TEXT, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [252, 252, 254] },
    theme: "plain",
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COL_MUTED);
    doc.text(`Página ${i} / ${pageCount}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }

  return doc;
}

export function saveDashboardPdf(projetos: DashboardPdfProjeto[], marcos: DashboardPdfMarco[]): void {
  const doc = buildDashboardPdf(projetos, marcos);
  const slug = format(new Date(), "yyyy-MM-dd");
  doc.save(`dashboard-relatorio-${slug}.pdf`);
}
