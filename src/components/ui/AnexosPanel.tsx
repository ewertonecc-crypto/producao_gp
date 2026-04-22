import { useRef, useState } from "react";
import {
  useAnexos, useUploadAnexo, useDeleteAnexo,
  getUrlAnexo, formatarTamanho, iconeAnexo,
  type EntidadeTipo, type Anexo,
} from "@/hooks/useAnexos";
import { cn } from "@/lib/utils";

interface Props {
  entidadeTipo: EntidadeTipo;
  entidadeId: string | undefined;
  readonly?: boolean;
  compact?: boolean;
}

const TIPOS_ACEITOS = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov";

export function AnexosPanel({ entidadeTipo, entidadeId, readonly = false, compact = false }: Props) {
  const { data: anexos = [], isLoading } = useAnexos(entidadeTipo, entidadeId);
  const { mutateAsync: upload, isPending: uploading } = useUploadAnexo();
  const { mutate: deletar } = useDeleteAnexo();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [descricao, setDescricao] = useState("");

  if (!entidadeId) return null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (file.size > 52428800) {
        alert(`Arquivo "${file.name}" excede o limite de 50MB`);
        continue;
      }
      await upload({ file, entidadeTipo, entidadeId, descricao });
    }
    setDescricao("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (anexo: Anexo) => {
    try {
      const url = await getUrlAnexo(anexo.nome_storage);
      const a = document.createElement("a");
      a.href = url;
      a.download = anexo.nome_original;
      a.target = "_blank";
      a.click();
    } catch (e: any) {
      alert("Erro ao baixar: " + e.message);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => !readonly && inputRef.current?.click()}
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-[6px] border transition-all",
            readonly
              ? "border-white/[0.06] text-[var(--text-dim)] cursor-default"
              : "border-white/[0.10] text-[var(--text-muted)] hover:border-indigo-500/30 hover:text-[var(--accent-bright)] cursor-pointer"
          )}
          title="Gerenciar anexos"
        >
          📎 {anexos.length > 0 ? anexos.length : "Anexar"}
        </button>
        {!readonly && (
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={TIPOS_ACEITOS}
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">Anexos</span>
          {anexos.length > 0 && (
            <span className="text-[10px] font-mono bg-[#1A1A2E] border border-white/[0.08] px-2 py-0.5 rounded text-[var(--text-muted)]">
              {anexos.length} arquivo(s)
            </span>
          )}
        </div>
        {!readonly && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-[11.5px] font-medium text-[var(--accent-bright)] hover:text-indigo-300 transition-colors disabled:opacity-50"
          >
            {uploading ? "Enviando..." : "+ Adicionar arquivo"}
          </button>
        )}
      </div>

      {!readonly && (
        <div
          className={cn(
            "border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer",
            dragOver
              ? "border-indigo-500/50 bg-indigo-500/[0.06]"
              : "border-white/[0.08] hover:border-indigo-500/25"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={TIPOS_ACEITOS}
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <div className="text-[20px] mb-1 opacity-50">📎</div>
          <div className="text-[12px] text-[var(--text-muted)]">
            {uploading ? (
              <span className="text-indigo-400">Enviando arquivos...</span>
            ) : (
              "Arraste arquivos ou clique para selecionar"
            )}
          </div>
          <div className="text-[10px] text-[var(--text-dim)] mt-0.5">
            PDF, Word, Excel, imagens, ZIP · Máx 50MB por arquivo
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-[12px] font-mono text-[var(--text-muted)]">Carregando...</div>
      ) : anexos.length === 0 ? (
        <div className="text-[12px] text-[var(--text-muted)] italic py-1">
          Nenhum anexo
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {anexos.map(a => (
            <div
              key={a.id}
              className="flex items-center gap-2.5 bg-[#0F0F1A] border border-white/[0.06] rounded-[10px] px-3 py-2.5 group hover:border-white/[0.12] transition-all"
            >
              <span className="text-[18px] flex-shrink-0">{iconeAnexo(a.mime_type)}</span>

              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-[var(--text-primary)] truncate">
                  {a.nome_original}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {formatarTamanho(a.tamanho_bytes)}
                  </span>
                  {a.descricao && (
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      · {a.descricao}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(a)}
                  className="w-7 h-7 rounded-[6px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-colors text-[12px]"
                  title="Baixar"
                >
                  ↓
                </button>
                {!readonly && (
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${a.nome_original}"?`)) deletar(a);
                    }}
                    className="w-7 h-7 rounded-[6px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-colors text-[11px]"
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
