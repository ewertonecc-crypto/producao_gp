import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { useImportarDados, ResultadoImportacao } from "@/hooks/useImportacao";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buscarListasReferencia } from "@/lib/importacao/importacaoListas";
import { gerarBufferExportDados, gerarBufferTemplateImportacao } from "@/lib/importacao/gerarTemplateExcel";
import { MODULOS_PLANILHA, type ModuloChave } from "@/lib/importacao/planilhaSchema";
import { validarPlanilhaCompleta } from "@/lib/importacao/validarPlanilhaImportacao";
import { toast } from "sonner";

const MODULOS = MODULOS_PLANILHA;

export function ImportacaoExcel() {
  const { data: tenant } = useTenant();
  const { importar, progresso, processando } = useImportarDados();
  const [moduloSelecionado, setModuloSelecionado] = useState<ModuloChave>("projetos");
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [previa, setPrevia] = useState<Record<string, string>[]>([]);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [errosEstrutura, setErrosEstrutura] = useState<{ linha: number; mensagem: string }[]>([]);
  const [avisoCabeçalho, setAvisoCabeçalho] = useState<string | null>(null);
  const [linhasValidasCount, setLinhasValidasCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const modulo = MODULOS.find((m) => m.key === moduloSelecionado)!;

  const exportarTemplate = useCallback(async () => {
    if (!tenant?.id) {
      toast.error("Não foi possível identificar o tenant.");
      return;
    }
    try {
      const buf = await gerarBufferTemplateImportacao(tenant.id);
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `projectos_template_importacao_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(u);
      toast.success("Template exportado: tabelas, cores e listas (aba LISTAS) alinhados ao cadastro.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao gerar o template.");
    }
  }, [tenant?.id]);

  const exportarDadosAtuais = useCallback(async () => {
    if (!tenant?.id) {
      toast.error("Não foi possível identificar o tenant.");
      return;
    }
    try {
      const buf = await gerarBufferExportDados(tenant.id);
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = `projectos_exportacao_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(u);
      toast.success("Dados exportados (tabelas e cabeçalhos).");
    } catch (e) {
      console.error(e);
      toast.error("Falha na exportação.");
    }
  }, [tenant?.id]);

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant?.id) return;
    setNomeArquivo(file.name);
    setResultado(null);
    setErrosEstrutura([]);
    setAvisoCabeçalho(null);
    setLinhasValidasCount(0);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target!.result, { type: "binary" });
      const abaAlvo = modulo.label.toUpperCase();
      const ws = wb.Sheets[abaAlvo] || wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error(`Aba "${abaAlvo}" não encontrada no arquivo.`);
        return;
      }
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const listas = await buscarListasReferencia(tenant.id);
      const v = validarPlanilhaCompleta(moduloSelecionado, rows, listas, 2);

      if (!v.cabecalho.ok) {
        setAvisoCabeçalho(v.cabecalho.mensagem);
        setPrevia((rows as Record<string, string>[]).slice(0, 5));
        return;
      }
      setAvisoCabeçalho(null);
      setErrosEstrutura(v.erros);
      setLinhasValidasCount(v.linhasOk.length);
      setPrevia(
        (rows as Record<string, string>[]).map((row) => {
          const o: Record<string, string> = {};
          for (const k of Object.keys(row)) {
            o[k] = String(row[k] ?? "");
          }
          return o;
        }).slice(0, 5)
      );
    };
    reader.readAsBinaryString(file);
  };

  const executarImportacao = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file || !tenant?.id) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target!.result, { type: "binary" });
      const abaAlvo = modulo.label.toUpperCase();
      const ws = wb.Sheets[abaAlvo] || wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        toast.error("Planilha inválida.");
        return;
      }
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const listas = await buscarListasReferencia(tenant.id);
      const v = validarPlanilhaCompleta(moduloSelecionado, rows, listas, 2);

      if (!v.cabecalho.ok) {
        toast.error(v.cabecalho.mensagem);
        return;
      }
      if (v.linhasOk.length === 0) {
        toast.error("Nenhuma linha passou na validação de estrutura e regras.");
        setErrosEstrutura(v.erros);
        setAvisoCabeçalho(null);
        return;
      }

      const res = await importar(moduloSelecionado, v.linhasOk);
      setResultado({
        ...res,
        total: v.linhasOk.length,
        erros: [...v.erros.map((e) => ({ linha: e.linha, mensagem: `Validação: ${e.mensagem}` })), ...res.erros],
        criados: res.criados,
        modulo: res.modulo,
      });

      if (res.erros.length === 0 && v.erros.length === 0) {
        toast.success(`${res.criados} ${modulo.label.toLowerCase()} importado(s) com sucesso!`);
      } else if (res.criados > 0) {
        toast.warning(
          `${res.criados} importado(s). ${v.erros.length} linha(s) recusadas na validação, ${res.erros.length} erro(s) no envio.`
        );
      } else {
        toast.error("Nenhum registro gravado. Revise a validação e os erros abaixo.");
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mb-1">
        Template com <strong className="text-[var(--text-secondary)]">tabelas Excel</strong>, cabeçalhos em cores (obrigatório
        = índigo, opcional = cinza) e <strong>listas</strong> iguais ao cadastro (aba <span className="font-mono">LISTAS</span>{" "}
        oculta). A importação valida colunas, datas AAAA-MM-DD, status e prioridades.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" className="text-[12px] h-9" onClick={exportarTemplate}>
          ↓ Baixar template Excel
        </Button>
        <Button type="button" size="sm" variant="secondary" className="text-[12px] h-9 border-emerald-500/25 hover:text-emerald-300" onClick={exportarDadosAtuais}>
          ↓ Exportar dados atuais
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {MODULOS.map((m, i) => (
          <button
            type="button"
            key={m.key}
            onClick={() => {
              setModuloSelecionado(m.key);
              setResultado(null);
              setPrevia([]);
              setNomeArquivo("");
              setErrosEstrutura([]);
              setAvisoCabeçalho(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all",
              moduloSelecionado === m.key
                ? "bg-indigo-500/10 border-indigo-500/40 text-[var(--text-primary)]"
                : "bg-[#0F0F1A] border-white/[0.08] text-[var(--text-muted)] hover:border-white/[0.16]"
            )}
          >
            <span className="text-[18px]">{m.icon}</span>
            <span className="text-[11.5px] font-medium">{m.label}</span>
            <span className="text-[9px] font-mono text-[var(--text-dim)]">
              {i === 0 ? "1º" : i === 1 ? "2º" : i === 2 ? "3º" : i === 3 ? "4º" : "5º"}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-[#0F0F1A] border border-white/[0.06] rounded-xl p-4">
        <div className="font-display font-semibold text-[13px] text-[var(--text-primary)] mb-2">
          {modulo.icon} Estrutura do módulo: {modulo.label}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {modulo.colunas.map((col) => (
            <span
              key={col}
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded border",
                modulo.obrigatorios.includes(col)
                  ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/35"
                  : "bg-slate-800/50 text-[var(--text-muted)] border-white/[0.08]"
              )}
            >
              {col}
              {modulo.obrigatorios.includes(col) ? " *" : ""}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">* = obrigatório · Linha 1 do Excel deve trazer exatamente esses nomes de coluna.</p>
      </div>

      <div
        className="border-2 border-dashed border-white/[0.12] rounded-xl p-6 text-center bg-[#0F0F1A]/50 hover:border-indigo-500/30 transition-all cursor-pointer relative"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f && inputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(f);
            inputRef.current.files = dt.files;
            handleArquivo({ target: inputRef.current } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleArquivo} />
        <div className="text-[28px] mb-2 opacity-50">📂</div>
        {nomeArquivo ? (
          <div>
            <div className="text-[13px] font-medium text-[var(--text-primary)]">{nomeArquivo}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Arquivo selecionado</div>
          </div>
        ) : (
          <div>
            <div className="text-[13px] text-[var(--text-secondary)]">Arraste o arquivo ou clique para selecionar</div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">.xlsx, .xls ou .csv (preferir template oficial)</div>
          </div>
        )}
      </div>

      {avisoCabeçalho && (
        <div className="text-[12px] rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-200">
          <span className="font-semibold">Estrutura rejeitada: </span>
          {avisoCabeçalho}
        </div>
      )}

      {!avisoCabeçalho && nomeArquivo && (errosEstrutura.length > 0 || linhasValidasCount > 0) && (
        <div
          className={cn(
            "text-[12px] rounded-lg border px-3 py-2",
            errosEstrutura.length > 0
              ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
              : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
          )}
        >
          {linhasValidasCount > 0 && <span>Linhas aceitas na validação: {linhasValidasCount}.</span>}
          {errosEstrutura.length > 0 && (
            <span>
              {linhasValidasCount > 0 ? " " : ""}
              Problemas em {errosEstrutura.length} linha(s) (não serão importadas enquanto houver correção requerida; linhas
              corretas seguem no envio).
            </span>
          )}
        </div>
      )}

      {errosEstrutura.length > 0 && (
        <div className="max-h-[120px] overflow-y-auto text-[11px] space-y-1 border border-amber-500/20 rounded-lg p-2 bg-amber-500/5">
          {errosEstrutura.slice(0, 20).map((e, i) => (
            <div key={i} className="font-mono text-amber-200/90">
              L{e.linha}: {e.mensagem}
            </div>
          ))}
          {errosEstrutura.length > 20 && <div className="text-[10px] text-[var(--text-muted)]">+{errosEstrutura.length - 20}…</div>}
        </div>
      )}

      {previa.length > 0 && !avisoCabeçalho && (
        <div className="bg-[#0F0F1A] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.04] flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--text-primary)]">Prévia (até 5 linhas)</span>
            <span className="text-[10px] font-mono text-emerald-400/90">aba {modulo.label.toUpperCase()}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  {Object.keys(previa[0]).map((k) => (
                    <th
                      key={k}
                      className="px-3 py-2 text-left font-mono text-[var(--text-muted)] border-b border-white/[0.04] bg-[#0a0a12] whitespace-nowrap"
                    >
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previa.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] last:border-0">
                    {Object.values(row).map((v: string, j) => (
                      <td key={j} className="px-3 py-2 text-[var(--text-secondary)] whitespace-nowrap max-w-[200px] truncate">
                        {v || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {processando && (
        <div>
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1.5">
            <span>Importando {modulo.label.toLowerCase()}…</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-2 bg-[#050508] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-200"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {nomeArquivo && !processando && !resultado && !avisoCabeçalho && (
        <Button
          type="button"
          className="w-full h-10 text-[13px] font-medium"
          disabled={linhasValidasCount === 0}
          onClick={executarImportacao}
        >
          {linhasValidasCount === 0
            ? "Nenhuma linha válida para importar"
            : `↑ Importar ${linhasValidasCount} linha(s) de ${modulo.label}`}
        </Button>
      )}

      {resultado && (
        <div
          className={cn(
            "border rounded-xl p-4",
            resultado.erros.length === 0
              ? "bg-emerald-500/[0.06] border-emerald-500/20"
              : "bg-amber-500/[0.06] border-amber-500/20"
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[16px]">{resultado.erros.length === 0 ? "✓" : "⚠"}</span>
            <span className="font-display font-semibold text-[14px] text-[var(--text-primary)]">
              {resultado.erros.length === 0 ? "Concluído" : "Concluído com avisos / erros"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <div className="text-[20px] font-bold text-[var(--text-primary)]">{resultado.total}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Enviadas</div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-bold text-emerald-400">{resultado.criados}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Gravadas</div>
            </div>
            <div className="text-center">
              <div className="text-[20px] font-bold text-rose-400">{resultado.erros.length}</div>
              <div className="text-[10px] text-[var(--text-muted)]">Problemas</div>
            </div>
          </div>
          {resultado.erros.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto">
              {resultado.erros.map((e, i) => (
                <div key={i} className="text-[11px] bg-rose-500/[0.08] border border-rose-500/15 rounded-[8px] px-3 py-2">
                  <span className="font-mono text-rose-400">Linha {e.linha}:</span>{" "}
                  <span className="text-[var(--text-secondary)]">{e.mensagem}</span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setResultado(null);
              setPrevia([]);
              setNomeArquivo("");
              setErrosEstrutura([]);
              setAvisoCabeçalho(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="mt-3 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Nova importação
          </button>
        </div>
      )}
    </div>
  );
}
