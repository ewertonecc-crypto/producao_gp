import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreateRisco, useUpdateRisco } from "@/hooks/useRiscos";
import { useProjetos } from "@/hooks/useProjetos";
import { useUsuarios } from "@/hooks/useUsuarios";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  projeto_id: z.string().min(1, "Projeto é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  causa: z.string().optional(),
  consequencia: z.string().optional(),
  probabilidade: z.string().optional(),
  impacto: z.string().optional(),
  nivel_risco: z.string().optional(),
  estrategia: z.string().optional(),
  plano_resposta: z.string().optional(),
  responsavel_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  projeto_id: "",
  descricao: "",
  causa: "",
  consequencia: "",
  probabilidade: "",
  impacto: "",
  nivel_risco: "",
  estrategia: "",
  plano_resposta: "",
  responsavel_id: "",
};

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
}

export function ModalNovoRisco({ open, onClose, editId }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreateRisco();
  const updateMut = useUpdateRisco();
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);

  const { data: editRow, isLoading: loadingEdit } = useQuery({
    queryKey: ["risco-edit", editId],
    enabled: open && !!editId,
    queryFn: async () => {
      const { data, error } = await supabase.from("riscos").select("*").eq("id", editId!).single();
      if (error) throw error;
      return data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
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
        projeto_id: editRow.projeto_id ?? "",
        descricao: editRow.descricao ?? "",
        causa: editRow.causa ?? "",
        consequencia: editRow.consequencia ?? "",
        probabilidade: editRow.probabilidade ?? "",
        impacto: editRow.impacto ?? "",
        nivel_risco: editRow.nivel_risco ?? "",
        estrategia: editRow.estrategia ?? "",
        plano_resposta: editRow.plano_resposta ?? "",
        responsavel_id: editRow.responsavel_id ?? "",
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [open, editId, editRow, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) {
      toast.error("Não foi possível identificar a empresa. Verifique o login e tente novamente.");
      return;
    }
    const payload = {
      projeto_id: values.projeto_id,
      descricao: values.descricao,
      causa: emptyToNull(values.causa),
      consequencia: emptyToNull(values.consequencia),
      probabilidade: emptyToNull(values.probabilidade ?? undefined),
      impacto: emptyToNull(values.impacto ?? undefined),
      nivel_risco: emptyToNull(values.nivel_risco ?? undefined),
      estrategia: emptyToNull(values.estrategia ?? undefined),
      plano_resposta: emptyToNull(values.plano_resposta),
      responsavel_id: emptyToNull(values.responsavel_id),
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

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar risco" : "Registrar risco"}
      subtitle="Gravado na tabela riscos."
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-risco" disabled={isSubmitting || pending || showLoader}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {showLoader ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-10 text-center">Carregando…</div>
      ) : (
        <form id="form-novo-risco" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
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
            <label className={modalLabelClass}>Descrição *</label>
            <textarea className={cn(modalInputClass, "min-h-[72px] resize-y")} {...register("descricao")} />
            {errors.descricao && <p className="text-[11px] text-rose-400 mt-1">{errors.descricao.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={modalLabelClass}>Causa</label>
              <textarea className={cn(modalInputClass, "min-h-[48px] resize-y")} {...register("causa")} />
            </div>
            <div>
              <label className={modalLabelClass}>Consequência</label>
              <textarea className={cn(modalInputClass, "min-h-[48px] resize-y")} {...register("consequencia")} />
            </div>
            <div>
              <label className={modalLabelClass}>Probabilidade</label>
              <select className={modalInputClass} {...register("probabilidade")}>
                <option value="">—</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Impacto</label>
              <select className={modalInputClass} {...register("impacto")}>
                <option value="">—</option>
                <option value="Alto">Alto</option>
                <option value="Médio">Médio</option>
                <option value="Baixo">Baixo</option>
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Nível do risco</label>
              <select className={modalInputClass} {...register("nivel_risco")}>
                <option value="">—</option>
                <option value="Crítico">Crítico</option>
                <option value="Alto">Alto</option>
                <option value="Médio">Médio</option>
                <option value="Baixo">Baixo</option>
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Estratégia</label>
              <select className={modalInputClass} {...register("estrategia")}>
                <option value="">—</option>
                <option value="Mitigar">Mitigar</option>
                <option value="Aceitar">Aceitar</option>
                <option value="Transferir">Transferir</option>
                <option value="Evitar">Evitar</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={modalLabelClass}>Plano de resposta</label>
              <textarea className={cn(modalInputClass, "min-h-[56px] resize-y")} {...register("plano_resposta")} />
            </div>
            <div className="col-span-2">
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
          </div>
        </form>
      )}
    </ModalBase>
  );
}
