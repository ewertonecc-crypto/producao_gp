import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreatePrograma } from "@/hooks/useProgramas";
import { usePortfolios } from "@/hooks/usePortfolios";
import { usePrioridades } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { cn } from "@/lib/utils";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  justificativa: z.string().min(1, "Justificativa é obrigatória"),
  portfolio_id: z.string().min(1, "Portfólio é obrigatório"),
  gestor_id: z.string().optional(),
  prioridade_id: z.string().optional(),
  data_fim_prevista: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ModalNovoPrograma({ open, onClose }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreatePrograma();
  const { data: portfolios = [] } = usePortfolios(tenantId ?? undefined);
  const { data: prioridades = [] } = usePrioridades(tenantId ?? undefined);
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
      justificativa: "",
      portfolio_id: "",
      gestor_id: "",
      prioridade_id: "",
      data_fim_prevista: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) return;
    await createMut.mutateAsync({
      tenant_id: tenantId,
      nome: values.nome,
      objetivo: values.objetivo,
      justificativa: values.justificativa,
      portfolio_id: values.portfolio_id,
      gestor_id: emptyToNull(values.gestor_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      data_fim_prevista: emptyToNull(values.data_fim_prevista),
    });
    reset();
    onClose();
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Novo programa"
      subtitle="Gravado na tabela programas."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-programa" disabled={isSubmitting || createMut.isPending}>
            {createMut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-novo-programa" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
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
        <div>
          <label className={modalLabelClass}>Nome *</label>
          <input className={modalInputClass} {...register("nome")} />
          {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
        </div>
        <div>
          <label className={modalLabelClass}>Objetivo *</label>
          <textarea className={cn(modalInputClass, "min-h-[72px] resize-y")} {...register("objetivo")} />
          {errors.objetivo && <p className="text-[11px] text-rose-400 mt-1">{errors.objetivo.message}</p>}
        </div>
        <div>
          <label className={modalLabelClass}>Justificativa *</label>
          <textarea className={cn(modalInputClass, "min-h-[64px] resize-y")} {...register("justificativa")} />
          {errors.justificativa && <p className="text-[11px] text-rose-400 mt-1">{errors.justificativa.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div className="col-span-2">
            <label className={modalLabelClass}>Data fim prevista</label>
            <input className={modalInputClass} type="date" {...register("data_fim_prevista")} />
          </div>
        </div>
      </form>
    </ModalBase>
  );
}
