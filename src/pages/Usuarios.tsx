import { useState } from "react";
import { useTenant } from "@/hooks/useTenant";
import { useUsuarios, useUpdateUsuario } from "@/hooks/useUsuarios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, timeAgo } from "@/lib/utils";
import { ModalConvidarUsuario } from "@/components/modals/ModalConvidarUsuario";
import { AnexosPanel } from "@/components/ui/AnexosPanel";

const papelColors: Record<string, string> = {
  admin: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  gerente: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  membro: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  visualizador: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
};

const papelOptions = ["admin", "gerente", "membro", "visualizador"] as const;

export default function Usuarios() {
  const { tenantId } = useTenant();
  const { data: usuarios = [], isLoading } = useUsuarios(tenantId ?? undefined);
  const updateMut = useUpdateUsuario();
  const [modalConvite, setModalConvite] = useState(false);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Usuários"
        subtitle={`${usuarios.length} membro(s) no tenant`}
        actions={
          <Button size="sm" onClick={() => setModalConvite(true)}>
            + Convidar Usuário
          </Button>
        }
      />
      <div className="p-7">
        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <EmptyState
            icon="○"
            title="Nenhum usuário cadastrado"
            description="Convide membros para colaborar nos projetos."
            actionLabel="+ Convidar"
            onAction={() => setModalConvite(true)}
          />
        ) : (
          <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Usuário", "Cargo", "Papel Global", "Último Acesso", "Anexos", "Status"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[10px] font-mono uppercase tracking-[0.1em] text-[var(--text-muted)] border-b border-white/[0.04]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const papel = u.papel_global ?? "membro";
                  const papelCls = papelColors[papel.toLowerCase()] ?? papelColors["membro"];
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04] last:border-0 hover:bg-indigo-500/[0.04]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar nome={u.nome} index={i} size="md" />
                          <div>
                            <div className="text-[13px] font-medium text-[var(--text-primary)]">{u.nome}</div>
                            <div className="text-[10px] font-mono text-[var(--text-muted)]">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] text-[var(--text-secondary)]">{u.cargo ?? "—"}</td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          className={cn(
                            "text-[10px] font-mono px-2 py-1 rounded-lg bg-[#0d0d14] border border-white/[0.12] cursor-pointer max-w-[140px]",
                            papelCls
                          )}
                          value={papel.toLowerCase()}
                          onChange={(e) => updateMut.mutate({ id: u.id, papel_global: e.target.value })}
                          disabled={updateMut.isPending}
                        >
                          {papelOptions.map((p) => (
                            <option key={p} value={p}>
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--text-muted)]">
                        {u.ultimo_acesso ? timeAgo(u.ultimo_acesso) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <AnexosPanel entidadeTipo="usuario" entidadeId={u.id} compact />
                      </td>
                      <td className="px-5 py-3">
                        {u.is_ativo !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-[5px] h-[5px] rounded-full bg-current" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <span className="w-[5px] h-[5px] rounded-full bg-current" />
                            Inativo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ModalConvidarUsuario open={modalConvite} onClose={() => setModalConvite(false)} />
    </div>
  );
}
