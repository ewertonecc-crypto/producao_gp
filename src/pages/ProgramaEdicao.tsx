import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useProgramaById, useUpdatePrograma } from "@/hooks/useProgramas";
import { useProjetos } from "@/hooks/useProjetos";
import { usePortfolios } from "@/hooks/usePortfolios";
import { usePrioridades, useStatus } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";
import { modalInputClass, modalLabelClass } from "@/components/modals/ModalBase";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  justificativa: z.string().min(1, "Justificativa é obrigatória"),
  portfolio_id: z.string().min(1, "Portfólio é obrigatório"),
  gestor_id: z.string().optional(),
  prioridade_id: z.string().optional(),
  status_id: z.string().optional(),
  data_inicio_prevista: z.string().optional(),
  data_fim_prevista: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export default function ProgramaEdicao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { data: programa, isLoading, isError } = useProgramaById(id);
  const updateMut = useUpdatePrograma();
  const { data: projetos = [], isLoading: loadingProj } = useProjetos(tenantId ?? undefined, id);
  const { data: portfolios = [], isFetched: portfoliosFetched } = usePortfolios(tenantId ?? undefined);
  const { data: prioridades = [], isFetched: prioridadesFetched } = usePrioridades(tenantId ?? undefined);
  const { data: statusPrograma = [], isFetched: statusProgramaFetched } = useStatus(tenantId ?? undefined, "programa");
  const { data: usuarios = [], isFetched: usuariosFetched } = useUsuarios(tenantId ?? undefined);

  const catalogsReady =
    !!tenantId && portfoliosFetched && prioridadesFetched && statusProgramaFetched && usuariosFetched;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      objetivo: "",
      justificativa: "",
      portfolio_id: "",
      gestor_id: "",
      prioridade_id: "",
      status_id: "",
      data_inicio_prevista: "",
      data_fim_prevista: "",
    },
  });

  // Só sincroniza com o servidor quando o registro muda de verdade (id / atualizado_em) ou quando
  // os catálogos terminam de carregar — evita reset a cada refetch do React Query, que apagava edições.
  useEffect(() => {
    if (!programa || !catalogsReady) return;
    reset({
      nome: programa.nome,
      objetivo: programa.objetivo,
      justificativa: programa.justificativa ?? "",
      portfolio_id: programa.portfolio_id,
      gestor_id: programa.gestor_id ?? "",
      prioridade_id: programa.prioridade_id ?? "",
      status_id: programa.status_id ?? "",
      data_inicio_prevista: programa.data_inicio_prevista?.slice(0, 10) ?? "",
      data_fim_prevista: programa.data_fim_prevista?.slice(0, 10) ?? "",
    });
    // programa omitido de deps de propósito: objeto muda a cada refetch; id + atualizado_em definem a versão.
  }, [programa?.id, programa?.atualizado_em, catalogsReady, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    await updateMut.mutateAsync({
      id,
      nome: values.nome,
      objetivo: values.objetivo,
      justificativa: values.justificativa,
      portfolio_id: values.portfolio_id,
      gestor_id: emptyToNull(values.gestor_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      status_id: emptyToNull(values.status_id),
      data_inicio_prevista: emptyToNull(values.data_inicio_prevista),
      data_fim_prevista: emptyToNull(values.data_fim_prevista),
    });
  };

  if (isLoading || (programa && tenantId && !catalogsReady)) {
    return <div className="p-7 text-[12px] font-mono text-[var(--text-muted)]">Carregando programa…</div>;
  }

  if (isError || !programa) {
    return (
      <div className="p-7">
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">Programa não encontrado.</p>
        <Button asChild variant="secondary" size="sm">
          <Link to="/programas">Voltar aos programas</Link>
        </Button>
      </div>
    );
  }

  const port = programa.portfolio as { nome?: string; codigo?: string } | null;
  const sub = `${programa.codigo ?? "—"}${port ? ` · Portfólio: ${port.codigo ?? port.nome ?? ""}` : ""}`;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Editar programa"
        subtitle={sub}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/portfolios")}>
              Portfólios
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/programas" className="flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Programas
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Dados do programa</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Mesmo fluxo do cadastro em Programas · tabela programas</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="grid gap-3 p-5">
          <div>
            <label className={modalLabelClass}>Código</label>
            <input className={cn(modalInputClass, "opacity-70 cursor-not-allowed")} value={programa.codigo ?? "—"} readOnly />
          </div>
          <div>
            <label className={modalLabelClass}>Portfólio *</label>
            <select className={modalInputClass} {...register("portfolio_id")}>
              <option value="">Selecione…</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} · ` : ""}
                  {p.nome}
                </option>
              ))}
            </select>
            {errors.portfolio_id && <p className="text-[11px] text-rose-400 mt-1">{errors.portfolio_id.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={modalLabelClass}>Nome *</label>
              <input className={modalInputClass} {...register("nome")} />
              {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={modalLabelClass}>Objetivo *</label>
              <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("objetivo")} />
              {errors.objetivo && <p className="text-[11px] text-rose-400 mt-1">{errors.objetivo.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={modalLabelClass}>Justificativa *</label>
              <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("justificativa")} />
              {errors.justificativa && <p className="text-[11px] text-rose-400 mt-1">{errors.justificativa.message}</p>}
            </div>
            <div>
              <label className={modalLabelClass}>Gestor</label>
              <select className={modalInputClass} {...register("gestor_id")}>
                <option value="">—</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Prioridade</label>
              <select className={modalInputClass} {...register("prioridade_id")}>
                <option value="">—</option>
                {prioridades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Status</label>
              <select className={modalInputClass} {...register("status_id")}>
                <option value="">—</option>
                {statusPrograma.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Início previsto</label>
              <input className={modalInputClass} type="date" {...register("data_inicio_prevista")} />
            </div>
            <div>
              <label className={modalLabelClass}>Fim previsto</label>
              <input className={modalInputClass} type="date" {...register("data_fim_prevista")} />
            </div>
          </div>
            </div>
          <div className="flex flex-wrap justify-end gap-2 px-5 py-3.5 border-t border-white/[0.04] bg-[#0d0d12]/50">
            <Button type="button" variant="secondary" onClick={() => navigate("/programas")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMut.isPending}>
              {updateMut.isPending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
        </div>

        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Projetos do programa</span>
          </div>
          <div className="p-5">
            {loadingProj ? (
              <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando projetos…</div>
            ) : projetos.length === 0 ? (
              <div className="text-[12px] text-[var(--text-muted)]">Nenhum projeto neste programa.</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {projetos.map((p) => {
                  const pct = Math.round(p.progresso_percentual ?? 0);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => navigate(`/projetos/${p.id}`)}
                      className="text-left bg-[#0d0d14] border border-white/[0.08] rounded-xl p-4 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="font-mono text-[10px] text-[var(--text-muted)] mb-1">{p.codigo ?? "—"}</div>
                      <div className="font-medium text-[13px] text-[var(--text-primary)] mb-2">{p.nome}</div>
                      <ProgressBar value={pct} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
