import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useAuth } from "@/hooks/useAuth";
import { useCreateEventoAgenda } from "@/hooks/useVisualizacoes";
import { useProjetos } from "@/hooks/useProjetos";
import { AGENDA_EVENTO_META, AGENDA_EVENTO_TIPOS_CADASTRO_ORDER } from "@/lib/agendaEventoTipos";
import { cn } from "@/lib/utils";

const schema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  data_inicio: z.string().min(1, "Data é obrigatória"),
  data_fim: z.string().optional(),
  hora_inicio: z.string().optional(),
  hora_fim: z.string().optional(),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  cor: z.string().optional(),
  projeto_id: z.string().optional(),
  descricao: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** YYYY-MM-DD pré-preenchido ao abrir */
  dataInicioPadrao?: string;
}

export function ModalNovoEventoAgenda({ open, onClose, dataInicioPadrao }: Props) {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const createMut = useCreateEventoAgenda();
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: "",
      data_inicio: "",
      data_fim: "",
      hora_inicio: "",
      hora_fim: "",
      tipo: "reuniao",
      cor: "",
      projeto_id: "",
      descricao: "",
    },
  });

  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      reset((v) => ({
        ...v,
        data_inicio: dataInicioPadrao ?? v.data_inicio,
      }));
    }
    prevOpen.current = open;
  }, [open, dataInicioPadrao, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) return;
    await createMut.mutateAsync({
      tenant_id: tenantId,
      titulo: values.titulo,
      data_inicio: values.data_inicio,
      data_fim: emptyToNull(values.data_fim),
      hora_inicio: emptyToNull(values.hora_inicio),
      hora_fim: emptyToNull(values.hora_fim),
      tipo: values.tipo,
      cor: emptyToNull(values.cor),
      projeto_id: emptyToNull(values.projeto_id),
      descricao: emptyToNull(values.descricao),
      criado_por: user?.id ?? null,
      dia_inteiro: !values.hora_inicio?.trim(),
    });
    reset({
      titulo: "",
      data_inicio: dataInicioPadrao ?? "",
      data_fim: "",
      hora_inicio: "",
      hora_fim: "",
      tipo: "reuniao",
      cor: "",
      projeto_id: "",
      descricao: "",
    });
    onClose();
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title="Novo evento"
      subtitle="Gravado em eventos_agenda (aparece em v_agenda)."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-evento-agenda" disabled={isSubmitting || createMut.isPending}>
            {createMut.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-novo-evento-agenda" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
        <div>
          <label className={modalLabelClass}>Título *</label>
          <input className={modalInputClass} {...register("titulo")} />
          {errors.titulo && <p className="text-[11px] text-rose-400 mt-1">{errors.titulo.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={modalLabelClass}>Data início *</label>
            <input className={modalInputClass} type="date" {...register("data_inicio")} />
            {errors.data_inicio && <p className="text-[11px] text-rose-400 mt-1">{errors.data_inicio.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Data fim</label>
            <input className={modalInputClass} type="date" {...register("data_fim")} />
          </div>
          <div>
            <label className={modalLabelClass}>Hora início</label>
            <input className={modalInputClass} type="time" {...register("hora_inicio")} />
          </div>
          <div>
            <label className={modalLabelClass}>Hora fim</label>
            <input className={modalInputClass} type="time" {...register("hora_fim")} />
          </div>
        </div>
        <div>
          <label className={modalLabelClass}>Tipo *</label>
          <select className={modalInputClass} {...register("tipo")}>
            {AGENDA_EVENTO_TIPOS_CADASTRO_ORDER.map((value) => (
              <option key={value} value={value}>
                {AGENDA_EVENTO_META[value].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={modalLabelClass}>Projeto (opcional)</label>
          <select className={modalInputClass} {...register("projeto_id")}>
            <option value="">—</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo ? `${p.codigo} · ` : ""}
                {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={modalLabelClass}>Cor override (hex)</label>
          <input className={modalInputClass} {...register("cor")} placeholder="#8b5cf6" />
        </div>
        <div>
          <label className={modalLabelClass}>Descrição</label>
          <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("descricao")} />
        </div>
      </form>
    </ModalBase>
  );
}
