import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreatePortfolio } from "@/hooks/usePortfolios";
import { usePrioridades } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { cn } from "@/lib/utils";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  objetivo: z.string().min(1, "Objetivo é obrigatório"),
  justificativa: z.string().min(1, "Justificativa é obrigatória"),
  gestor_id: z.string().optional(),
  prioridade_id: z.string().optional(),
  orcamento_previsto: z.string().optional(),
  data_fim_prevista: z.string().optional(),
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

export function ModalNovoPortfolio({ open, onClose }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreatePortfolio();
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
      gestor_id: "",
      prioridade_id: "",
      orcamento_previsto: "",
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
      gestor_id: emptyToNull(values.gestor_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      orcamento_previsto: parseOrcamento(values.orcamento_previsto),
      data_fim_prevista: emptyToNull(values.data_fim_prevista),
    });
    reset();
    onClose();
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Novo portfólio"
      subtitle="Campos gravados na tabela portfolios."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-portfolio" disabled={isSubmitting || createMut.isPending}>
            {createMut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-novo-portfolio" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
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
          <div>
            <label className={modalLabelClass}>Orçamento previsto (BRL)</label>
            <input className={modalInputClass} {...register("orcamento_previsto")} placeholder="0,00" />
          </div>
          <div>
            <label className={modalLabelClass}>Data fim prevista</label>
            <input className={modalInputClass} type="date" {...register("data_fim_prevista")} />
          </div>
        </div>
      </form>
    </ModalBase>
  );
}
