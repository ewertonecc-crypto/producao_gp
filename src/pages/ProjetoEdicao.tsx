import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { useProjetoById, useUpdateProjeto } from "@/hooks/useProjetos";
import { useProgramas } from "@/hooks/useProgramas";
import { usePrioridades, useStatus } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { modalInputClass, modalLabelClass } from "@/components/modals/ModalBase";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  escopo: z.string().min(1, "Escopo é obrigatório"),
  justificativa: z.string().min(1, "Justificativa é obrigatória"),
  programa_id: z.string().min(1, "Programa é obrigatório"),
  gerente_projeto_id: z.string().optional(),
  prioridade_id: z.string().optional(),
  status_id: z.string().optional(),
  data_inicio_prevista: z.string().optional(),
  data_fim_prevista: z.string().optional(),
  orcamento_previsto: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function parseOrcamento(s: string | undefined): number | null {
  if (!s?.trim()) return null;
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function ProjetoEdicao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useTenant();
  const { data: projeto, isLoading, isError } = useProjetoById(id);
  const updateMut = useUpdateProjeto();
  const { data: programas = [], isFetched: programasFetched } = useProgramas(tenantId ?? undefined);
  const { data: prioridades = [], isFetched: prioridadesFetched } = usePrioridades(tenantId ?? undefined);
  const { data: statusProjeto = [], isFetched: statusFetched } = useStatus(tenantId ?? undefined, "projeto");
  const { data: usuarios = [], isFetched: usuariosFetched } = useUsuarios(tenantId ?? undefined);

  const catalogsReady =
    !!tenantId && programasFetched && prioridadesFetched && statusFetched && usuariosFetched;

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
      escopo: "",
      justificativa: "",
      programa_id: "",
      gerente_projeto_id: "",
      prioridade_id: "",
      status_id: "",
      data_inicio_prevista: "",
      data_fim_prevista: "",
      orcamento_previsto: "",
    },
  });

  useEffect(() => {
    if (!projeto || !catalogsReady) return;
    reset({
      nome: projeto.nome,
      objetivo: projeto.objetivo,
      escopo: projeto.escopo,
      justificativa: projeto.justificativa ?? "",
      programa_id: projeto.programa_id,
      gerente_projeto_id: projeto.gerente_projeto_id ?? "",
      prioridade_id: projeto.prioridade_id ?? "",
      status_id: projeto.status_id ?? "",
      data_inicio_prevista: projeto.data_inicio_prevista?.slice(0, 10) ?? "",
      data_fim_prevista: projeto.data_fim_prevista?.slice(0, 10) ?? "",
      orcamento_previsto: projeto.orcamento_previsto != null ? String(projeto.orcamento_previsto) : "",
    });
    // projeto omitido de deps: novo objeto a cada refetch; id + atualizado_em definem a versão no servidor.
  }, [projeto?.id, projeto?.atualizado_em, catalogsReady, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    await updateMut.mutateAsync({
      id,
      nome: values.nome,
      objetivo: values.objetivo,
      escopo: values.escopo,
      justificativa: values.justificativa,
      programa_id: values.programa_id,
      gerente_projeto_id: emptyToNull(values.gerente_projeto_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      status_id: emptyToNull(values.status_id),
      data_inicio_prevista: emptyToNull(values.data_inicio_prevista),
      data_fim_prevista: emptyToNull(values.data_fim_prevista),
      orcamento_previsto: parseOrcamento(values.orcamento_previsto),
    });
  };

  if (isLoading || (projeto && tenantId && !catalogsReady)) {
    return <div className="px-7 pt-5 text-[12px] font-mono text-[var(--text-muted)]">Carregando projeto…</div>;
  }

  if (isError || !projeto) {
    return (
      <div className="px-7 pt-5 pb-7">
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">Projeto não encontrado.</p>
        <Button asChild variant="secondary" size="sm">
          <Link to="/projetos">Voltar aos projetos</Link>
        </Button>
      </div>
    );
  }

  const programaRaw = projeto.programa;
  const programa = (
    Array.isArray(programaRaw) ? programaRaw[0] : programaRaw
  ) as { id: string; nome?: string; codigo?: string | null } | null | undefined;
  const sub =
    `${projeto.codigo ?? "—"}${programa ? ` · Programa: ${programa.codigo ?? programa.nome ?? ""}` : ""}`;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Editar projeto"
        subtitle={sub}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/portfolios")}>
              Portfólios
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/projetos" className="flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Projetos
              </Link>
            </Button>
          </div>
        }
      />

      <div className="px-7 pt-5 flex flex-col gap-5 pb-7">
        <div className="bg-[#141424] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <span className="font-display font-bold text-[13px] text-[var(--text-primary)]">Dados do projeto</span>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Mesmo fluxo do cadastro em Projetos · tabela projetos</p>
          </div>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col"
            autoComplete="off"
          >
            <div className="grid gap-3 p-5">
          <div>
            <label className={modalLabelClass}>Código</label>
            <input className={cn(modalInputClass, "opacity-70 cursor-not-allowed")} value={projeto.codigo ?? "—"} readOnly />
          </div>
          <div>
            <label className={modalLabelClass}>Programa *</label>
            <select className={modalInputClass} {...register("programa_id")}>
              <option value="">Selecione…</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} · ` : ""}
                  {p.nome}
                </option>
              ))}
            </select>
            {errors.programa_id && <p className="text-[11px] text-rose-400 mt-1">{errors.programa_id.message}</p>}
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
              <label className={modalLabelClass}>Escopo *</label>
              <textarea className={cn(modalInputClass, "min-h-[64px] resize-y")} {...register("escopo")} />
              {errors.escopo && <p className="text-[11px] text-rose-400 mt-1">{errors.escopo.message}</p>}
            </div>
            <div className="col-span-2">
              <label className={modalLabelClass}>Justificativa *</label>
              <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("justificativa")} />
              {errors.justificativa && <p className="text-[11px] text-rose-400 mt-1">{errors.justificativa.message}</p>}
            </div>
            <div>
              <label className={modalLabelClass}>Gerente do projeto</label>
              <select className={modalInputClass} {...register("gerente_projeto_id")}>
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
                {statusProjeto.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Orçamento (BRL)</label>
              <input className={modalInputClass} {...register("orcamento_previsto")} />
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
            <Button type="button" variant="secondary" onClick={() => navigate("/projetos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || updateMut.isPending}>
              {updateMut.isPending ? "Salvando…" : "Salvar alterações"}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
