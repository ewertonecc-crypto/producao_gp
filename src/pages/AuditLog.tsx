import { useState, useCallback } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useAuditLog, useAuditLogModulos } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

const acaoStyle: Record<string, string> = {
  INSERT: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  UPDATE: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  DELETE: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  LOGIN: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
};

export default function AuditLog() {
  const { tenantId } = useTenant();
  const [moduloFiltro, setModuloFiltro] = useState<string>("");
  const moduloQuery = moduloFiltro || undefined;
  const { data: logs = [], isLoading } = useAuditLog(tenantId ?? undefined, 200, moduloQuery);
  const { data: modulosDistintos = [] } = useAuditLogModulos(tenantId ?? undefined);

  const exportarCsv = useCallback(async () => {
    if (!tenantId) return;
    let q = supabase
      .from("audit_log")
      .select("id, acao, modulo, registro_nome, campos_alterados, ip_address, criado_em, usuario_id")
      .eq("tenant_id", tenantId)
      .order("criado_em", { ascending: false })
      .limit(2000);
    if (moduloQuery) q = q.eq("modulo", moduloQuery);
    const { data, error } = await q;
    if (error) {
      window.alert("Erro ao exportar: " + error.message);
      return;
    }
    const rows = data ?? [];
    const header = ["id", "acao", "modulo", "registro_nome", "campos_alterados", "ip_address", "criado_em", "usuario_id"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : Array.isArray(v) ? v.join(";") : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [header.join(","), ...rows.map((r) => header.map((h) => escape((r as Record<string, unknown>)[h])).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [tenantId, moduloQuery]);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Audit Log"
        subtitle="Histórico completo de ações do sistema"
        actions={
          <>
            <select
              className="h-7 text-[11px] font-mono rounded-[10px] border border-white/[0.12] bg-[#141424] text-[var(--text-secondary)] px-2"
              value={moduloFiltro}
              onChange={(e) => setModuloFiltro(e.target.value)}
            >
              <option value="">Todos os módulos</option>
              {modulosDistintos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <Button variant="secondary" size="sm" type="button" onClick={exportarCsv}>
              ↓ Exportar CSV
            </Button>
          </>
        }
      />
      <div className="p-7">
        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Eventos Recentes</span>
            <span className="text-[10.5px] font-mono text-[var(--text-muted)] bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded">
              Auto-refresh 30s
            </span>
          </div>
          <div className="px-5 divide-y divide-white/[0.04]">
            {isLoading ? (
              <div className="py-6 text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
            ) : logs.length === 0 ? (
              <div className="py-6 text-center text-[12px] font-mono text-[var(--text-muted)]">Nenhuma ação registrada ainda</div>
            ) : (
              logs.map((log) => {
                const sCls = acaoStyle[log.acao] ?? acaoStyle["UPDATE"];
                const campos =
                  (log.campos_alterados ?? []).length > 0
                    ? ` · campos: ${(log.campos_alterados ?? []).slice(0, 3).join(", ")}${(log.campos_alterados ?? []).length > 3 ? "..." : ""}`
                    : "";
                return (
                  <div key={log.id} className="flex items-start gap-3 py-3">
                    <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded flex-shrink-0 mt-0.5", sCls)}>
                      {log.acao}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">
                          {(log.usuario as { nome?: string } | null)?.nome ?? "Sistema"}
                        </strong>
                        {" · "}
                        {log.modulo}
                        {log.registro_nome ? ` · ${log.registro_nome}` : ""}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                        {log.modulo}
                        {campos} · {timeAgo(log.criado_em)}
                        {log.ip_address ? ` · ${log.ip_address}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
