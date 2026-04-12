import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ModalBase, modalInputClass, modalLabelClass } from "./ModalBase";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/hooks/useTenant";
import { useCreateRecurso, useUpdateRecurso } from "@/hooks/useRecursos";
import { useStatus, useTiposRecurso } from "@/hooks/useStatus";
import { useUsuarios } from "@/hooks/useUsuarios";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const schema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo_recurso_id: z.string().min(1, "Tipo é obrigatório"),
  usuario_id: z.string().optional(),
  capacidade_horas_semana: z.string().optional(),
  custo_hora: z.string().optional(),
  moeda: z.string().optional(),
  disponivel_de: z.string().optional(),
  disponivel_ate: z.string().optional(),
  status_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  nome: "",
  tipo_recurso_id: "",
  usuario_id: "",
  capacidade_horas_semana: "40",
  custo_hora: "",
  moeda: "BRL",
  disponivel_de: "",
  disponivel_ate: "",
  status_id: "",
};

function emptyToNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function parseNum(s: string | undefined, fallback: number | null): number | null {
  if (!s?.trim()) return fallback;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null;
}

export function ModalNovoRecurso({ open, onClose, editId }: Props) {
  const { tenantId } = useTenant();
  const createMut = useCreateRecurso();
  const updateMut = useUpdateRecurso();
  const { data: tiposRaw = [] } = useTiposRecurso(tenantId ?? undefined);
  const tipos = useMemo(() => tiposRaw.filter((t) => t.is_ativo !== false), [tiposRaw]);
  const { data: statusRecurso = [] } = useStatus(tenantId ?? undefined, "recurso");
  const { data: usuarios = [] } = useUsuarios(tenantId ?? undefined);

  const defaultStatusId = useMemo(() => {
    const disp = statusRecurso.find((s) => s.nome.toLowerCase().includes("dispon"));
    return disp?.id ?? statusRecurso[0]?.id ?? "";
  }, [statusRecurso]);

  const { data: editRow, isLoading: loadingEdit } = useQuery({
    queryKey: ["recurso-edit", editId],
    enabled: open && !!editId,
    queryFn: async () => {
      const { data, error } = await supabase.from("recursos").select("*").eq("id", editId!).single();
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
        tipo_recurso_id: editRow.tipo_recurso_id ?? "",
        usuario_id: editRow.usuario_id ?? "",
        capacidade_horas_semana:
          editRow.capacidade_horas_semana != null ? String(editRow.capacidade_horas_semana) : "40",
        custo_hora: editRow.custo_hora != null ? String(editRow.custo_hora) : "",
        moeda: editRow.moeda?.trim() || "BRL",
        disponivel_de: (editRow.disponivel_de ?? "").slice(0, 10),
        disponivel_ate: (editRow.disponivel_ate ?? "").slice(0, 10),
        status_id: editRow.status_id ?? "",
      });
    } else {
      reset({
        ...EMPTY_VALUES,
        status_id: defaultStatusId || "",
      });
    }
  }, [open, editId, editRow, reset, defaultStatusId]);

  const onSubmit = async (values: FormValues) => {
    if (!tenantId) {
      toast.error("Não foi possível identificar a empresa. Verifique o login e tente novamente.");
      return;
    }
    const cap = parseNum(values.capacidade_horas_semana, 40) ?? 40;
    const custo = parseNum(values.custo_hora, null);
    const statusId = emptyToNull(values.status_id) ?? (defaultStatusId || null);
    if (editId) {
      await updateMut.mutateAsync({
        id: editId,
        nome: values.nome,
        tipo_recurso_id: values.tipo_recurso_id,
        usuario_id: emptyToNull(values.usuario_id),
        capacidade_horas_semana: cap,
        custo_hora: custo,
        moeda: values.moeda?.trim() || "BRL",
        disponivel_de: emptyToNull(values.disponivel_de),
        disponivel_ate: emptyToNull(values.disponivel_ate),
        status_id: statusId,
      });
    } else {
      await createMut.mutateAsync({
        tenant_id: tenantId,
        nome: values.nome,
        tipo_recurso_id: values.tipo_recurso_id,
        usuario_id: emptyToNull(values.usuario_id),
        capacidade_horas_semana: cap,
        custo_hora: custo,
        moeda: values.moeda?.trim() || "BRL",
        disponivel_de: emptyToNull(values.disponivel_de),
        disponivel_ate: emptyToNull(values.disponivel_ate),
        status_id: statusId,
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
      title={isEdit ? "Editar recurso" : "Novo recurso"}
      subtitle="Gravado na tabela recursos."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="form-novo-recurso" disabled={isSubmitting || pending || showLoader}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </>
      }
    >
      {showLoader ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)] py-10 text-center">Carregando…</div>
      ) : (
        <form id="form-novo-recurso" onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <div>
            <label className={modalLabelClass}>Nome *</label>
            <input className={modalInputClass} {...register("nome")} />
            {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Tipo de recurso *</label>
            <select className={modalInputClass} {...register("tipo_recurso_id")}>
              <option value="">Selecione…</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            {errors.tipo_recurso_id && <p className="text-[11px] text-rose-400 mt-1">{errors.tipo_recurso_id.message}</p>}
          </div>
          <div>
            <label className={modalLabelClass}>Usuário vinculado (opcional)</label>
            <select className={modalInputClass} {...register("usuario_id")}>
              <option value="">—</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={modalLabelClass}>Capacidade (h/semana)</label>
              <input className={modalInputClass} {...register("capacidade_horas_semana")} />
            </div>
            <div>
              <label className={modalLabelClass}>Custo / hora</label>
              <input className={modalInputClass} {...register("custo_hora")} />
            </div>
            <div>
              <label className={modalLabelClass}>Moeda</label>
              <input className={modalInputClass} {...register("moeda")} />
            </div>
            <div>
              <label className={modalLabelClass}>Status</label>
              <select className={modalInputClass} {...register("status_id")}>
                <option value="">— (padrão: disponível)</option>
                {statusRecurso.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={modalLabelClass}>Disponível de</label>
              <input className={modalInputClass} type="date" {...register("disponivel_de")} />
            </div>
            <div>
              <label className={modalLabelClass}>Disponível até</label>
              <input className={modalInputClass} type="date" {...register("disponivel_ate")} />
            </div>
          </div>
        </form>
      )}
    </ModalBase>
  );
}
