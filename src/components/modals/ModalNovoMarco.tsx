import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreateMarco, useUpdateMarco } from "@/hooks/useMarcos";
import { useProjetos } from "@/hooks/useProjetos";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  projeto_id: z.string().optional(),
  data_prevista: z.string().min(1, "Data prevista é obrigatória"),
  is_critico: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  nome: "",
  projeto_id: "",
  data_prevista: "",
  is_critico: false,
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

export function ModalNovoMarco({ open, onClose, editId }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreateMarco();
  const updateMut = useUpdateMarco();
  const { data: projetos = [] } = useProjetos(tenantId ?? undefined);

  const { data: editRow, isLoading: loadingEdit } = useQuery({
    queryKey: ["marco-edit", editId],
    enabled: open && !!editId,
    queryFn: async () => {
      const { data, error } = await supabase.from("marcos").select("*").eq("id", editId!).single();
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
        nome: editRow.nome ?? "",
        projeto_id: editRow.projeto_id ?? "",
        data_prevista: (editRow.data_prevista ?? "").slice(0, 10),
        is_critico: editRow.is_critico ?? false,
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
    const pid = emptyToNull(values.projeto_id);
    if (editId) {
      const updates: Parameters<typeof updateMut.mutateAsync>[0] = {
        id: editId,
        nome: values.nome,
        data_prevista: values.data_prevista,
        is_critico: values.is_critico ?? false,
      };
      if (pid) {
        updates.projeto_id = pid;
        updates.programa_id = null;
        updates.portfolio_id = null;
      } else if (editRow?.projeto_id) {
        updates.projeto_id = null;
      }
      await updateMut.mutateAsync(updates);
    } else {
      await createMut.mutateAsync({
        tenant_id: tenantId,
        nome: values.nome,
        data_prevista: values.data_prevista,
        projeto_id: pid,
        is_critico: values.is_critico ?? false,
      });
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
      title={isEdit ? "Editar marco" : "Novo marco"}
      subtitle="Milestone vinculado opcionalmente a um projeto."
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-marco" disabled={isSubmitting || pending || showLoader}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {showLoader ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-10 text-center">Carregando…</div>
      ) : (
        <form id="form-novo-marco" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div>
            <label className={modalLabelClass}>Nome *</label>
            <input className={modalInputClass} {...register("nome")} />
            {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Projeto</label>
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
            <label className={modalLabelClass}>Data prevista *</label>
            <input className={modalInputClass} type="date" {...register("data_prevista")} />
            {errors.data_prevista && <p className="text-[11px] text-rose-400 mt-1">{errors.data_prevista.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_critico_marco" className="rounded border-white/20" {...register("is_critico")} />
            <label htmlFor="is_critico_marco" className="text-[12px] text-[var(--text-secondary)] cursor-pointer">
              Marco crítico
            </label>
          </div>
        </form>
      )}
    </ModalBase>
  );
}
