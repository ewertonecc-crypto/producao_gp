import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "./useTenant";
import { toast } from "sonner";

export type EntidadeTipo =
  | "portfolio" | "programa" | "projeto"
  | "atividade" | "subatividade" | "risco"
  | "marco" | "recurso" | "cliente_externo" | "usuario";

export interface Anexo {
  id: string;
  tenant_id: string;
  entidade_tipo: EntidadeTipo;
  entidade_id: string;
  nome_original: string;
  nome_storage: string;
  bucket: string;
  mime_type: string | null;
  tamanho_bytes: number | null;
  descricao: string | null;
  criado_por: string | null;
  criado_em: string;
}

export function useAnexos(entidadeTipo: EntidadeTipo, entidadeId: string | undefined) {
  return useQuery({
    queryKey: ["anexos", entidadeTipo, entidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anexos")
        .select("*")
        .eq("entidade_tipo", entidadeTipo)
        .eq("entidade_id", entidadeId!)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data as Anexo[];
    },
    enabled: !!entidadeId,
  });
}

export function useUploadAnexo() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();

  return useMutation({
    mutationFn: async ({
      file,
      entidadeTipo,
      entidadeId,
      descricao,
    }: {
      file: File;
      entidadeTipo: EntidadeTipo;
      entidadeId: string;
      descricao?: string;
    }) => {
      const timestamp = Date.now();
      const nomeSeguro = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${tenant!.id}/${entidadeTipo}/${entidadeId}/${timestamp}_${nomeSeguro}`;

      const { error: errUpload } = await supabase.storage
        .from("anexos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (errUpload) throw new Error("Erro no upload: " + errUpload.message);

      const { data, error: errInsert } = await supabase
        .from("anexos")
        .insert({
          tenant_id: tenant!.id,
          entidade_tipo: entidadeTipo,
          entidade_id: entidadeId,
          nome_original: file.name,
          nome_storage: path,
          bucket: "anexos",
          mime_type: file.type || null,
          tamanho_bytes: file.size,
          descricao: descricao || null,
        })
        .select()
        .single();
      if (errInsert) {
        await supabase.storage.from("anexos").remove([path]);
        throw new Error("Erro ao registrar: " + errInsert.message);
      }

      return data as Anexo;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["anexos", data.entidade_tipo, data.entidade_id] });
      toast.success("Anexo salvo com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAnexo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (anexo: Anexo) => {
      const { error: errStorage } = await supabase.storage
        .from(anexo.bucket)
        .remove([anexo.nome_storage]);
      if (errStorage) throw new Error("Erro ao remover arquivo: " + errStorage.message);

      const { error } = await supabase.from("anexos").delete().eq("id", anexo.id);
      if (error) throw new Error("Erro ao remover registro: " + error.message);

      return anexo;
    },
    onSuccess: (anexo) => {
      qc.invalidateQueries({ queryKey: ["anexos", anexo.entidade_tipo, anexo.entidade_id] });
      toast.success("Anexo removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function getUrlAnexo(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(path, 3600);
  if (error || !data) throw new Error("Erro ao gerar URL: " + error?.message);
  return data.signedUrl;
}

export function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function iconeAnexo(mime: string | null): string {
  if (!mime) return "📎";
  if (mime.startsWith("image/")) return "🖼";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word")) return "📝";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "📊";
  if (mime.includes("powerpoint") || mime.includes("presentation")) return "📋";
  if (mime.includes("zip") || mime.includes("rar")) return "🗜";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.startsWith("text/")) return "📃";
  return "📎";
}
