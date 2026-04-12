import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreateProjeto } from "@/hooks/useProjetos";
import { useProgramas } from "@/hooks/useProgramas";
import { usePrioridades, useStatus } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { cn } from "@/lib/utils";

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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ModalNovoProjeto({ open, onClose }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreateProjeto();
  const { data: programas = [] } = useProgramas(tenantId ?? undefined);
  const { data: prioridades = [] } = usePrioridades(tenantId ?? undefined);
  const { data: statusProjeto = [] } = useStatus(tenantId ?? undefined, "projeto");
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);

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

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) return;
    await createMut.mutateAsync({
      tenant_id: tenantId,
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
    reset();
    onClose();
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Novo projeto"
      subtitle="Gravado na tabela projetos."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-projeto" disabled={isSubmitting || createMut.isPending}>
            {createMut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-novo-projeto" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
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
      </form>
    </ModalBase>
  );
}
