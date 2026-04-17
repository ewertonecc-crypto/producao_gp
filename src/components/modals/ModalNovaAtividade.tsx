import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreateAtividade, useUpdateAtividade } from "@/hooks/useAtividades";
import { useProjetos } from "@/hooks/useProjetos";
import { usePrioridades, useStatus, useCategoriasAtividade } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z
  .object({
    nome: z.string().min(1, "Nome é obrigatório"),
    descricao: z.string().min(1, "Descrição é obrigatória"),
    criterio_aceitacao: z.string().min(1, "Critério de aceitação é obrigatório"),
    projeto_id: z.string().min(1, "Projeto é obrigatório"),
    responsavel_id: z.string().optional(),
    prioridade_id: z.string().optional(),
    status_id: z.string().optional(),
    categoria_id: z.string().optional(),
    data_fim_prevista: z.string().min(1, "Data fim prevista é obrigatória"),
    data_inicio_prevista: z.string().optional(),
    hora_inicio: z.string().optional(),
    hora_fim: z.string().optional(),
    estimativa_horas: z.string().optional(),
    percentual_concluido: z.string().optional(),
    kanban_cor_etiqueta: z.string().optional(),
    is_evento_agenda: z.boolean().optional(),
  })
  .refine(
    (d) => {
      const ini = d.data_inicio_prevista?.trim();
      if (!ini) return true;
      return d.data_fim_prevista >= ini;
    },
    { message: "A data fim não pode ser anterior à data de início.", path: ["data_fim_prevista"] }
  );

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  nome: "",
  descricao: "",
  criterio_aceitacao: "",
  projeto_id: "",
  responsavel_id: "",
  prioridade_id: "",
  status_id: "",
  categoria_id: "",
  data_fim_prevista: "",
  data_inicio_prevista: "",
  hora_inicio: "",
  hora_fim: "",
  estimativa_horas: "",
  percentual_concluido: "",
  kanban_cor_etiqueta: "",
  is_evento_agenda: false,
};

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function parseNum(s: string | undefined): number | null {
  if (!s?.trim()) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function sliceTime(t: string | null | undefined): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pré-preenche o projeto ao abrir (ex.: Kanban). */
  projetoIdPadrao?: string;
  /** Pré-preenche o status ao abrir (ex.: botão na coluna do Kanban). */
  statusIdPadrao?: string;
  /** Modo edição: carrega a atividade pelo id. */
  editId?: string | null;
  /** Pré-preenche datas (yyyy-MM-dd), ex.: clique no dia na Agenda. */
  dataInicioPadrao?: string;
  dataFimPadrao?: string;
}

export function ModalNovaAtividade({
  open,
  onClose,
  projetoIdPadrao,
  statusIdPadrao,
  editId,
  dataInicioPadrao,
  dataFimPadrao,
}: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreateAtividade();
  const updateMut = useUpdateAtividade();
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);
  const { data: prioridades = [] } = usePrioridades(tenantId ?? undefined);
  const { data: statusAtividade = [] } = useStatus(tenantId ?? undefined, "atividade");
  const { data: categorias = [] } = useCategoriasAtividade(tenantId ?? undefined);
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);

  const { data: editRow, isLoading: loadingEdit } = useQuery({
    queryKey: ["atividade-edit", editId],
    enabled: open && !!editId,
    queryFn: async () => {
      const { data, error } = await supabase.from("atividades").select("*").eq("id", editId!).single();
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    if (editId) {
      if (!editRow) return;
      reset({
        nome: editRow.nome ?? "",
        descricao: editRow.descricao ?? "",
        criterio_aceitacao: editRow.criterio_aceitacao ?? "",
        projeto_id: editRow.projeto_id,
        responsavel_id: editRow.responsavel_id ?? "",
        prioridade_id: editRow.prioridade_id ?? "",
        status_id: editRow.status_id ?? "",
        categoria_id: editRow.categoria_id ?? "",
        data_fim_prevista: (editRow.data_fim_prevista ?? "").slice(0, 10),
        data_inicio_prevista: (editRow.data_inicio_prevista ?? "").slice(0, 10),
        hora_inicio: sliceTime(editRow.hora_inicio),
        hora_fim: sliceTime(editRow.hora_fim),
        estimativa_horas: editRow.estimativa_horas != null ? String(editRow.estimativa_horas) : "",
        percentual_concluido: editRow.percentual_concluido != null ? String(editRow.percentual_concluido) : "",
        kanban_cor_etiqueta: editRow.kanban_cor_etiqueta ?? "",
        is_evento_agenda: editRow.is_evento_agenda ?? false,
      });
    } else {
      reset({
        ...EMPTY_VALUES,
        projeto_id: projetoIdPadrao ?? "",
        status_id: statusIdPadrao ?? "",
        data_inicio_prevista: dataInicioPadrao ?? "",
        data_fim_prevista: dataFimPadrao ?? "",
      });
    }
  }, [open, editId, editRow, projetoIdPadrao, statusIdPadrao, dataInicioPadrao, dataFimPadrao, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) {
      toast.error("Não foi possível identificar a empresa. Verifique o login e tente novamente.");
      return;
    }
    const payload = {
      nome: values.nome,
      descricao: values.descricao,
      criterio_aceitacao: values.criterio_aceitacao,
      projeto_id: values.projeto_id,
      responsavel_id: emptyToNull(values.responsavel_id),
      prioridade_id: emptyToNull(values.prioridade_id),
      status_id: emptyToNull(values.status_id),
      categoria_id: emptyToNull(values.categoria_id),
      data_fim_prevista: values.data_fim_prevista,
      data_inicio_prevista: emptyToNull(values.data_inicio_prevista),
      hora_inicio: emptyToNull(values.hora_inicio),
      hora_fim: emptyToNull(values.hora_fim),
      estimativa_horas: parseNum(values.estimativa_horas),
      percentual_concluido: parseNum(values.percentual_concluido),
      kanban_cor_etiqueta: emptyToNull(values.kanban_cor_etiqueta),
      is_evento_agenda: values.is_evento_agenda ?? false,
    };
    if (editId) {
      await updateMut.mutateAsync({ id: editId, ...payload });
    } else {
      await createMut.mutateAsync({ tenant_id: tenantId, ...payload });
    }
    reset(EMPTY_VALUES);
    onClose();
  };

  const isEdit = !!editId;
  const pending = createMut.isPending || updateMut.isPending;
  const showLoader = isEdit && loadingEdit;
  const dataInicioW = watch("data_inicio_prevista");
  const dataFimW = watch("data_fim_prevista");
  const dataInicioTrim = dataInicioW?.trim() ?? "";
  const dataFimTrim = dataFimW?.trim() ?? "";

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar atividade" : "Nova atividade"}
      subtitle="Gravado na tabela atividades."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-nova-atividade" disabled={isSubmitting || pending || showLoader}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {showLoader ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-10 text-center">Carregando…</div>
      ) : (
        <form id="form-nova-atividade" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div>
            <label className={modalLabelClass}>Projeto *</label>
            <select className={modalInputClass} {...register("projeto_id")}>
              <option value="">Selecione…</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} · ` : ""}
                  {p.nome}
                </option>
              ))}
            </select>
            {errors.projeto_id && <p className="text-[11px] text-rose-400 mt-1">{errors.projeto_id.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Nome *</label>
            <input className={modalInputClass} {...register("nome")} />
            {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Descrição *</label>
            <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("descricao")} />
            {errors.descricao && <p className="text-[11px] text-rose-400 mt-1">{errors.descricao.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Critério de aceitação *</label>
            <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("criterio_aceitacao")} />
            {errors.criterio_aceitacao && (
              <p className="text-[11px] text-rose-400 mt-1">{errors.criterio_aceitacao.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={modalLabelClass}>Responsável</label>
              <select className={modalInputClass} {...register("responsavel_id")}>
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
                {statusAtividade.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Categoria</label>
              <select className={modalInputClass} {...register("categoria_id")}>
                <option value="">—</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Data início prevista</label>
              <input
                className={modalInputClass}
                type="date"
                max={dataFimTrim || undefined}
                {...register("data_inicio_prevista")}
              />
            </div>
            <div>
              <label className={modalLabelClass}>Data fim prevista *</label>
              <input
                className={modalInputClass}
                type="date"
                min={dataInicioTrim || undefined}
                {...register("data_fim_prevista")}
              />
              {errors.data_fim_prevista && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.data_fim_prevista.message}</p>
              )}
            </div>
            <div>
              <label className={modalLabelClass}>Hora início</label>
              <input className={modalInputClass} type="time" {...register("hora_inicio")} />
            </div>
            <div>
              <label className={modalLabelClass}>Hora fim</label>
              <input className={modalInputClass} type="time" {...register("hora_fim")} />
            </div>
            <div>
              <label className={modalLabelClass}>Estimativa (h)</label>
              <input className={modalInputClass} {...register("estimativa_horas")} />
            </div>
            <div>
              <label className={modalLabelClass}>% concluído</label>
              <input className={modalInputClass} {...register("percentual_concluido")} />
            </div>
            <div className="col-span-2">
              <label className={modalLabelClass}>Cor etiqueta Kanban (hex)</label>
              <input className={modalInputClass} {...register("kanban_cor_etiqueta")} placeholder="#6366f1" />
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-1">
              <input type="checkbox" id="is_evento_agenda" className="rounded border-white/20" {...register("is_evento_agenda")} />
              <label htmlFor="is_evento_agenda" className="text-[12px] text-[var(--text-secondary)] cursor-pointer">
                Exibir como evento na agenda
              </label>
            </div>
          </div>
        </form>
      )}
    </ModalBase>
  );
}
