import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useTenant } from "@/hooks/useTenant";
import {
  useClientesExternos,
  useCreateClienteExterno,
  usePendentesEntregasPorCliente,
  useRenovarTokenClienteExterno,
  type ClienteExternoRow,
} from "@/hooks/useClientesExternos";
import { useProjetos } from "@/hooks/useProjetos";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalBase, modalInputClass, modalLabelClass } from "@/components/modals/ModalBase";
import { AnexosPanel } from "@/components/ui/AnexosPanel";
import { cn, avatarInitials } from "@/lib/utils";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("E-mail inválido"),
  empresa: z.string().optional(),
  telefone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function tokenValidUntilLabel(expira: string | null | undefined): { expired: boolean; label: string } {
  if (!expira) return { expired: true, label: "Token expirado" };
  const end = new Date(expira).getTime();
  if (Number.isNaN(end) || end < Date.now()) return { expired: true, label: "Token expirado" };
  return {
    expired: false,
    label: `Token válido até ${format(new Date(expira), "dd/MM/yyyy", { locale: ptBR })}`,
  };
}

function ClienteCard({
  cliente,
  projetoTags,
  pendentes,
  onRenovar,
  renovando,
}: {
  cliente: ClienteExternoRow;
  projetoTags: { id: string; nome: string }[];
  pendentes: number;
  onRenovar: (id: string) => void;
  renovando: boolean;
}) {
  const tokenInfo = tokenValidUntilLabel(cliente.token_expira_em);
  const ativo = cliente.is_ativo !== false;

  const copyPortalLink = async () => {
    const token = cliente.token_portal;
    if (!token) {
      toast.error("Sem token — renove o token primeiro.");
      return;
    }
    const url = `${window.location.origin}/portal?token=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <div
      className={cn(
        "bg-[#141424] border border-white/[0.08] rounded-2xl p-4 transition-colors",
        "hover:border-indigo-500/30 flex flex-col gap-3"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center",
            "bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-[13px] font-display"
          )}
        >
          {avatarInitials(cliente.nome)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-[14px] text-[var(--text-primary)] truncate">{cliente.nome}</div>
          <div className="font-mono text-[11px] text-[var(--text-muted)] truncate">{cliente.email}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        {cliente.empresa?.trim() ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-300 border border-slate-500/25">
            {cliente.empresa}
          </span>
        ) : null}
        {ativo ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Ativo
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Inativo
          </span>
        )}
        <span
          className={cn(
            "text-[10px] font-mono px-2 py-0.5 rounded-full border",
            tokenInfo.expired
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          )}
        >
          {tokenInfo.label}
        </span>
      </div>

      {pendentes > 0 ? (
        <p className="text-[11px] font-mono text-amber-400/90">
          {pendentes} entrega(s) pendente(s) de aceite
        </p>
      ) : (
        <p className="text-[11px] font-mono text-[var(--text-muted)]">Nenhuma entrega pendente</p>
      )}

      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] mb-1.5">Projetos</p>
        {projetoTags.length ? (
          <div className="flex flex-wrap gap-1">
            {projetoTags.map((t) => (
              <span
                key={t.id}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
              >
                {t.nome}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[var(--text-muted)]">Nenhum projeto vinculado</span>
        )}
      </div>

      <div className="border-t border-white/[0.04] pt-3">
        <AnexosPanel entidadeTipo="cliente_externo" entidadeId={cliente.id} />
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        <Button type="button" size="sm" variant="secondary" onClick={copyPortalLink}>
          Acessar Portal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => onRenovar(cliente.id)}
          disabled={renovando}
        >
          {renovando ? "Renovando…" : "Renovar Token"}
        </Button>
      </div>
    </div>
  );
}

function ModalAdicionarCliente({
  open,
  onClose,
  projetoOptions,
}: {
  open: boolean;
  onClose: () => void;
  projetoOptions: { id: string; nome: string; codigo: string | null }[];
}) {
  const createMut = useCreateClienteExterno();
  const [selectedProjetoIds, setSelectedProjetoIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", email: "", empresa: "", telefone: "" },
  });

  const toggleProjeto = (id: string) => {
    setSelectedProjetoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onSubmit = async (values: FormValues) => {
    await createMut.mutateAsync({
      nome: values.nome,
      email: values.email,
      empresa: values.empresa,
      telefone: values.telefone,
      projetos_ids: selectedProjetoIds.length ? selectedProjetoIds : undefined,
    });
    reset();
    setSelectedProjetoIds([]);
    onClose();
  };

  const handleClose = () => {
    reset();
    setSelectedProjetoIds([]);
    onClose();
  };

  return (
    <ModalBase
      open={open}
      onClose={handleClose}
      title="Adicionar cliente externo"
      subtitle="Aprovadores que acessam o portal por link para aceitar entregas."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cliente-externo" disabled={createMut.isPending}>
            {createMut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-cliente-externo" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={modalLabelClass}>Nome *</label>
            <input className={modalInputClass} {...register("nome")} />
            {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>E-mail *</label>
            <input className={modalInputClass} type="email" {...register("email")} />
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={modalLabelClass}>Empresa</label>
            <input className={modalInputClass} {...register("empresa")} />
          </div>
          <div>
            <label className={modalLabelClass}>Telefone</label>
            <input className={modalInputClass} {...register("telefone")} />
          </div>
        </div>
        <div>
          <label className={modalLabelClass}>Projetos vinculados</label>
          <div className="mt-1 max-h-[200px] overflow-y-auto rounded-[10px] border border-white/[0.12] bg-[#0d0d14] p-2 space-y-1">
            {projetoOptions.length === 0 ? (
              <p className="text-[11px] font-mono text-[var(--text-muted)] px-2 py-2">Nenhum projeto no tenant.</p>
            ) : (
              projetoOptions.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="rounded border-white/20"
                    checked={selectedProjetoIds.includes(p.id)}
                    onChange={() => toggleProjeto(p.id)}
                  />
                  <span className="text-[12px] text-[var(--text-primary)] truncate">
                    <span className="font-mono text-[10px] text-[var(--text-muted)] mr-1">{p.codigo ?? "—"}</span>
                    {p.nome}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </form>
    </ModalBase>
  );
}

export default function ClientesExternos() {
  const { tenantId } = useTenant();
  const { data: clientes = [], isLoading } = useClientesExternos();
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);
  const { data: pendentesPorCliente = {} } = usePendentesEntregasPorCliente(tenantId ?? undefined, clientes);
  const renovarMut = useRenovarTokenClienteExterno();
  const [modalOpen, setModalOpen] = useState(false);

  const projetoNomeById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projetos) {
      if (p?.id) m.set(p.id, p.nome ?? p.codigo ?? p.id);
    }
    return m;
  }, [projetos]);

  const projetoOptions = useMemo(
    () =>
      projetos
        .filter((p): p is NonNullable<typeof p> & { id: string } => !!p?.id)
        .map((p) => ({ id: p.id, nome: p.nome ?? "", codigo: p.codigo ?? null }))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [projetos]
  );

  const openModal = () => setModalOpen(true);

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Clientes Externos"
        subtitle={`${clientes.length} cliente(s) cadastrado(s)`}
        actions={
          <Button size="sm" onClick={openModal}>
            + Adicionar Cliente
          </Button>
        }
      />

      <ModalAdicionarCliente open={modalOpen} onClose={() => setModalOpen(false)} projetoOptions={projetoOptions} />

      <div className="p-7">
        {isLoading ? (
          <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon="◎"
            title="Nenhum cliente externo cadastrado"
            description="Adicione clientes para enviar entregas e coletar aceites pelo portal"
            actionLabel="+ Adicionar Cliente"
            onAction={openModal}
          />
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {clientes.map((c) => {
              const ids = c.projetos_ids ?? [];
              const projetoTags = ids.map((id) => ({
                id,
                nome: projetoNomeById.get(id) ?? `${id.slice(0, 8)}…`,
              }));
              return (
                <ClienteCard
                  key={c.id}
                  cliente={c}
                  projetoTags={projetoTags}
                  pendentes={pendentesPorCliente[c.id] ?? 0}
                  onRenovar={(id) => renovarMut.mutate(id)}
                  renovando={renovarMut.isPending && renovarMut.variables === c.id}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
