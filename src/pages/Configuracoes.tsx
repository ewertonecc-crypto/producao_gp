import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronRight,
  ClipboardList,
  Layers,
  LayoutGrid,
  Map,
  Palette,
  Pencil,
  Settings2,
  Shield,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { useTenant, useTenantConfig } from "@/hooks/useTenant";
import {
  useStatus,
  usePrioridades,
  useCategoriasAtividade,
  useCreateStatusItem,
  useCreatePrioridadeItem,
  useCreateCategoriaAtividadeItem,
  usePapeis,
  useTiposRecurso,
  useTiposCadastro,
  useCreateTipoRecurso,
  useCreateTipoCadastro,
  useUpdateTenantConfig,
  useSoftDeleteStatus,
  useUpdateStatusItem,
  useUpdatePrioridadeItem,
  useUpdateCategoriaAtividadeItem,
  useUpdateTipoRecurso,
  useUpdateTipoCadastro,
} from "@/hooks/useStatus";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MODULOS_STATUS = [
  { value: "portfolio", label: "Portfólio" },
  { value: "programa", label: "Programa" },
  { value: "projeto", label: "Projeto" },
  { value: "atividade", label: "Atividade" },
  { value: "subatividade", label: "Subatividade" },
  { value: "recurso", label: "Recurso" },
] as const;

const MODULOS_TIPO_CAD = [
  { value: "portfolio", label: "Portfólio" },
  { value: "programa", label: "Programa" },
  { value: "projeto", label: "Projeto" },
] as const;

type SectionId =
  | "status"
  | "prioridades"
  | "categorias"
  | "papeis"
  | "tipos_recurso"
  | "tipos_cadastro"
  | "aparencia"
  | "modulos";

const inputClass =
  "h-9 rounded-lg border border-white/[0.12] bg-[#141424] px-2.5 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500/40 min-w-0";

function SectionShell({
  id,
  open,
  onToggle,
  icon,
  title,
  countLabel,
  children,
  footer,
}: {
  id: SectionId;
  open: boolean;
  onToggle: (id: SectionId) => void;
  icon: ReactNode;
  title: string;
  countLabel: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-colors",
        open ? "border-indigo-500/30" : "border-white/[0.08] bg-[#141424]"
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors",
          open && "bg-[#141424]"
        )}
      >
        <span className="text-[11px] text-[var(--text-muted)] w-4 shrink-0">{open ? "▼" : "▶"}</span>
        <span className="shrink-0 text-indigo-400/90">{icon}</span>
        <span className="font-display font-semibold text-[14px] text-[var(--text-primary)] flex-1 min-w-0">{title}</span>
        <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">{countLabel}</span>
        <ChevronRight className={cn("h-4 w-4 text-[var(--text-muted)] shrink-0 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="border-t border-white/[0.06] bg-[#141424]">
          <div className="px-4 py-3">{children}</div>
          {footer}
        </div>
      )}
    </div>
  );
}

function tabBtn(active: boolean, onClick: () => void, children: ReactNode) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wide transition-colors",
        active ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/30" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
      )}
    >
      {children}
    </button>
  );
}

export default function Configuracoes() {
  const { tenantId } = useTenant();
  const { config, loading: loadingConfig } = useTenantConfig(tenantId);

  const { data: status = [], isLoading: loadingStatus } = useStatus(tenantId ?? undefined, undefined, true);
  const { data: prioridades = [], isLoading: loadingPrio } = usePrioridades(tenantId ?? undefined, true);
  const { data: categorias = [], isLoading: loadingCat } = useCategoriasAtividade(tenantId ?? undefined, true);
  const { data: papeis = [], isLoading: loadingPapeis } = usePapeis(tenantId ?? undefined);
  const { data: tiposRecurso = [], isLoading: loadingTR } = useTiposRecurso(tenantId ?? undefined);
  const { data: tiposCadastro = [], isLoading: loadingTC } = useTiposCadastro(tenantId ?? undefined);

  const createStatus = useCreateStatusItem();
  const createPrio = useCreatePrioridadeItem();
  const createCat = useCreateCategoriaAtividadeItem();
  const createTipoRec = useCreateTipoRecurso();
  const createTipoCad = useCreateTipoCadastro();
  const updateConfigMut = useUpdateTenantConfig();
  const softDeleteStatus = useSoftDeleteStatus();
  const updateStatus = useUpdateStatusItem();
  const updatePrio = useUpdatePrioridadeItem();
  const updateCat = useUpdateCategoriaAtividadeItem();
  const updateTipoRec = useUpdateTipoRecurso();
  const updateTipoCad = useUpdateTipoCadastro();

  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const toggleSection = useCallback((id: SectionId) => {
    setOpenSection((s) => (s === id ? null : id));
  }, []);

  const [moduloStatusTab, setModuloStatusTab] = useState<string>("portfolio");
  const [moduloTipoCadTab, setModuloTipoCadTab] = useState<string>("portfolio");

  const [novoStatus, setNovoStatus] = useState({
    nome: "",
    cor: "#6366F1",
    modulo: "portfolio",
    is_inicial: false,
    is_final: false,
  });
  const [novaPrio, setNovaPrio] = useState({ nome: "", cor: "#6366F1" });
  const [novaCat, setNovaCat] = useState({ nome: "", cor: "#6366F1" });
  const [novoTipoRec, setNovoTipoRec] = useState({ nome: "", descricao: "" });
  const [novoTipoCad, setNovoTipoCad] = useState({ nome: "", descricao: "", modulo: "portfolio" });

  const [editStatus, setEditStatus] = useState<{ id: string; nome: string; cor: string } | null>(null);
  const [editPrio, setEditPrio] = useState<{ id: string; nome: string; cor: string } | null>(null);
  const [editCat, setEditCat] = useState<{ id: string; nome: string; cor: string } | null>(null);
  const [editTipoRec, setEditTipoRec] = useState<{ id: string; nome: string; descricao: string } | null>(null);
  const [editTipoCad, setEditTipoCad] = useState<{ id: string; nome: string; descricao: string; modulo: string } | null>(null);

  const [nomeSistema, setNomeSistema] = useState("");
  const [corPrimaria, setCorPrimaria] = useState("#6366F1");
  const [diasAviso, setDiasAviso] = useState(3);
  const [exigirAprovacao, setExigirAprovacao] = useState(true);
  const [permitirClienteComentar, setPermitirClienteComentar] = useState(true);

  useEffect(() => {
    if (!config) return;
    setNomeSistema(config.nome_sistema ?? "");
    setCorPrimaria(config.cor_primaria ?? "#6366F1");
    setDiasAviso(config.dias_aviso_prazo ?? 3);
    setExigirAprovacao(config.exigir_aprovacao_interna !== false);
    setPermitirClienteComentar(config.permitir_cliente_comentar !== false);
  }, [config]);

  const statusDoModulo = useMemo(
    () => status.filter((s) => s.modulo === moduloStatusTab).sort((a, b) => a.ordem - b.ordem),
    [status, moduloStatusTab]
  );

  const tiposCadDoModulo = useMemo(
    () => tiposCadastro.filter((t) => t.modulo === moduloTipoCadTab),
    [tiposCadastro, moduloTipoCadTab]
  );

  const salvarPreferencias = () => {
    if (!tenantId) return;
    updateConfigMut.mutate(
      {
        tenantId,
        payload: {
          nome_sistema: nomeSistema.trim() || null,
          cor_primaria: corPrimaria || null,
          dias_aviso_prazo: diasAviso,
          exigir_aprovacao_interna: exigirAprovacao,
          permitir_cliente_comentar: permitirClienteComentar,
        },
      },
      {
        onSuccess: () => toast.success("Preferências salvas."),
      }
    );
  };

  const setModulo = (field: keyof NonNullable<typeof config>, value: boolean) => {
    if (!tenantId) return;
    updateConfigMut.mutate({ tenantId, payload: { [field]: value } as Record<string, unknown> });
  };

  const modField = (k: keyof NonNullable<typeof config>) => config?.[k] !== false;

  const loading =
    loadingConfig || loadingStatus || loadingPrio || loadingCat || loadingPapeis || loadingTR || loadingTC;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="Configurações" subtitle="Tabelas de apoio, papéis e preferências do tenant" />
      <div className="p-7 flex flex-col gap-3 max-w-4xl">
        {loading && !config && (
          <div className="text-[12px] text-[var(--text-muted)] font-mono">Carregando configurações…</div>
        )}

        <SectionShell
          id="status"
          open={openSection === "status"}
          onToggle={toggleSection}
          icon={<Layers className="h-4 w-4" />}
          title="Status por módulo"
          countLabel={`${status.length} itens`}
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Nome *</span>
                <input
                  className={inputClass}
                  value={novoStatus.nome}
                  onChange={(e) => setNovoStatus((s) => ({ ...s, nome: e.target.value }))}
                  placeholder="Nome do status"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Cor</span>
                <input
                  type="color"
                  className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5"
                  value={novoStatus.cor}
                  onChange={(e) => setNovoStatus((s) => ({ ...s, cor: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Módulo</span>
                <select
                  className={inputClass}
                  value={novoStatus.modulo}
                  onChange={(e) => setNovoStatus((s) => ({ ...s, modulo: e.target.value }))}
                >
                  {MODULOS_STATUS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)] shrink-0 pt-5">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
                  checked={novoStatus.is_inicial}
                  onChange={(e) => setNovoStatus((s) => ({ ...s, is_inicial: e.target.checked }))}
                />
                Inicial
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-[var(--text-secondary)] shrink-0 pt-5">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
                  checked={novoStatus.is_final}
                  onChange={(e) => setNovoStatus((s) => ({ ...s, is_final: e.target.checked }))}
                />
                Final
              </label>
              <Button
                size="sm"
                type="button"
                className="shrink-0"
                disabled={!novoStatus.nome.trim() || !tenantId || createStatus.isPending}
                onClick={() => {
                  if (!tenantId) return;
                  const ordem = status.filter((x) => x.modulo === novoStatus.modulo).length + 1;
                  createStatus.mutate(
                    {
                      tenant_id: tenantId,
                      nome: novoStatus.nome.trim(),
                      modulo: novoStatus.modulo,
                      ordem,
                      cor: novoStatus.cor,
                      is_ativo: true,
                      is_inicial: novoStatus.is_inicial,
                      is_final: novoStatus.is_final,
                    },
                    {
                      onSuccess: () =>
                        setNovoStatus((s) => ({ ...s, nome: "", is_inicial: false, is_final: false })),
                    }
                  );
                }}
              >
                Adicionar
              </Button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MODULOS_STATUS.map((m) => tabBtn(moduloStatusTab === m.value, () => setModuloStatusTab(m.value), m.label))}
          </div>
          <ul className="max-h-[280px] overflow-y-auto">
            {statusDoModulo.length === 0 ? (
              <li className="py-3 text-[12px] text-[var(--text-muted)]">Nenhum status neste módulo.</li>
            ) : (
              statusDoModulo.map((s) => {
                const podeRemover = !s.is_inicial && !s.is_final;
                const isEditing = editStatus?.id === s.id;
                return (
                  <li
                    key={s.id}
                    className="py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-wrap"
                  >
                    {isEditing && editStatus ? (
                      <>
                        <input
                          type="color"
                          className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5 shrink-0"
                          value={editStatus.cor}
                          onChange={(e) => setEditStatus({ ...editStatus, cor: e.target.value })}
                        />
                        <input
                          className={cn(inputClass, "flex-1 min-w-[120px]")}
                          value={editStatus.nome}
                          onChange={(e) => setEditStatus({ ...editStatus, nome: e.target.value })}
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className="h-3 w-3 rounded-full shrink-0 border border-white/10"
                          style={{ backgroundColor: s.cor ?? "#6366f1" }}
                        />
                        <span className="text-[13px] text-[var(--text-primary)] flex-1 min-w-[120px]">{s.nome}</span>
                      </>
                    )}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-[#141424] text-emerald-500 focus:ring-emerald-500/30"
                          checked={!!s.is_inicial}
                          disabled={updateStatus.isPending}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({ id: s.id, is_inicial: e.target.checked });
                          }}
                        />
                        <span className={s.is_inicial ? "text-emerald-300" : undefined}>Inicial</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-[#141424] text-amber-500 focus:ring-amber-500/30"
                          checked={!!s.is_final}
                          disabled={updateStatus.isPending}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateStatus.mutate({ id: s.id, is_final: e.target.checked });
                          }}
                        />
                        <span className={s.is_final ? "text-amber-200" : undefined}>Final</span>
                      </label>
                    </div>
                    {s.is_ativo === false && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">
                        inativo
                      </span>
                    )}
                    {isEditing && editStatus ? (
                      <div className="ml-auto flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          type="button"
                          className="h-8 text-[11px]"
                          disabled={!editStatus.nome.trim() || updateStatus.isPending}
                          onClick={() =>
                            updateStatus.mutate(
                              { id: editStatus.id, nome: editStatus.nome.trim(), cor: editStatus.cor },
                              {
                                onSuccess: () => {
                                  toast.success("Status atualizado.");
                                  setEditStatus(null);
                                },
                              }
                            )
                          }
                        >
                          Salvar
                        </Button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-white/[0.06]"
                          onClick={() => setEditStatus(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="ml-auto flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-300 hover:bg-indigo-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditStatus({ id: s.id, nome: s.nome, cor: s.cor ?? "#6366F1" });
                          }}
                          aria-label="Editar status"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {podeRemover ? (
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10"
                            disabled={softDeleteStatus.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              softDeleteStatus.mutate({ id: s.id });
                            }}
                            aria-label="Desativar status"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-white/[0.15] cursor-not-allowed"
                            title="Status inicial ou final não podem ser removidos; são usados pelo fluxo do sistema."
                            disabled
                            aria-label="Não é possível remover"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </SectionShell>

        <SectionShell
          id="prioridades"
          open={openSection === "prioridades"}
          onToggle={toggleSection}
          icon={<Tag className="h-4 w-4" />}
          title="Prioridades"
          countLabel={`${prioridades.length} itens`}
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[160px] flex-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Nome *</span>
                <input
                  className={inputClass}
                  value={novaPrio.nome}
                  onChange={(e) => setNovaPrio({ ...novaPrio, nome: e.target.value })}
                  placeholder="Nova prioridade"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Cor</span>
                <input
                  type="color"
                  className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5"
                  value={novaPrio.cor}
                  onChange={(e) => setNovaPrio({ ...novaPrio, cor: e.target.value })}
                />
              </div>
              <Button
                size="sm"
                type="button"
                disabled={!novaPrio.nome.trim() || !tenantId || createPrio.isPending}
                onClick={() => {
                  if (!tenantId) return;
                  createPrio.mutate(
                    {
                      tenant_id: tenantId,
                      nome: novaPrio.nome.trim(),
                      cor: novaPrio.cor,
                      ordem: prioridades.length + 1,
                      is_ativo: true,
                    },
                    { onSuccess: () => setNovaPrio({ nome: "", cor: "#6366F1" }) }
                  );
                }}
              >
                Adicionar
              </Button>
            </div>
          }
        >
          <ul>
            {prioridades.map((p) => {
              const isEditing = editPrio?.id === p.id;
              return (
                <li key={p.id} className="py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-wrap">
                  {isEditing && editPrio ? (
                    <>
                      <input
                        type="color"
                        className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5 shrink-0"
                        value={editPrio.cor}
                        onChange={(e) => setEditPrio({ ...editPrio, cor: e.target.value })}
                      />
                      <input
                        className={cn(inputClass, "flex-1 min-w-[120px]")}
                        value={editPrio.nome}
                        onChange={(e) => setEditPrio({ ...editPrio, nome: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-white/10"
                        style={{ backgroundColor: p.cor ?? "#6366f1" }}
                      />
                      <span className="text-[13px] text-[var(--text-primary)] flex-1 min-w-[100px]">{p.nome}</span>
                    </>
                  )}
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">ordem {p.ordem}</span>
                  {p.is_ativo === false && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">
                      inativo
                    </span>
                  )}
                  {isEditing && editPrio ? (
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        type="button"
                        className="h-8 text-[11px]"
                        disabled={!editPrio.nome.trim() || updatePrio.isPending}
                        onClick={() =>
                          updatePrio.mutate(
                            { id: editPrio.id, nome: editPrio.nome.trim(), cor: editPrio.cor },
                            { onSuccess: () => setEditPrio(null) }
                          )
                        }
                      >
                        Salvar
                      </Button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-white/[0.06]"
                        onClick={() => setEditPrio(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                      onClick={() => setEditPrio({ id: p.id, nome: p.nome, cor: p.cor ?? "#6366F1" })}
                      aria-label="Editar prioridade"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionShell>

        <SectionShell
          id="categorias"
          open={openSection === "categorias"}
          onToggle={toggleSection}
          icon={<ClipboardList className="h-4 w-4" />}
          title="Categorias de atividade"
          countLabel={`${categorias.length} itens`}
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[160px] flex-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Nome *</span>
                <input
                  className={inputClass}
                  value={novaCat.nome}
                  onChange={(e) => setNovaCat({ ...novaCat, nome: e.target.value })}
                  placeholder="Nova categoria"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Cor</span>
                <input
                  type="color"
                  className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5"
                  value={novaCat.cor}
                  onChange={(e) => setNovaCat({ ...novaCat, cor: e.target.value })}
                />
              </div>
              <Button
                size="sm"
                type="button"
                disabled={!novaCat.nome.trim() || !tenantId || createCat.isPending}
                onClick={() => {
                  if (!tenantId) return;
                  createCat.mutate(
                    {
                      tenant_id: tenantId,
                      nome: novaCat.nome.trim(),
                      cor: novaCat.cor,
                      is_ativo: true,
                    },
                    { onSuccess: () => setNovaCat({ nome: "", cor: "#6366F1" }) }
                  );
                }}
              >
                Adicionar
              </Button>
            </div>
          }
        >
          <ul>
            {categorias.map((c) => {
              const isEditing = editCat?.id === c.id;
              return (
                <li key={c.id} className="py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-wrap">
                  {isEditing && editCat ? (
                    <>
                      <input
                        type="color"
                        className="h-9 w-12 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5 shrink-0"
                        value={editCat.cor}
                        onChange={(e) => setEditCat({ ...editCat, cor: e.target.value })}
                      />
                      <input
                        className={cn(inputClass, "flex-1 min-w-[120px]")}
                        value={editCat.nome}
                        onChange={(e) => setEditCat({ ...editCat, nome: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-white/10"
                        style={{ backgroundColor: c.cor ?? "#6366f1" }}
                      />
                      <span className="text-[13px] text-[var(--text-primary)] flex-1 min-w-[100px]">{c.nome}</span>
                    </>
                  )}
                  {c.is_ativo === false && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">
                      inativo
                    </span>
                  )}
                  {isEditing && editCat ? (
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        type="button"
                        className="h-8 text-[11px]"
                        disabled={!editCat.nome.trim() || updateCat.isPending}
                        onClick={() =>
                          updateCat.mutate(
                            { id: editCat.id, nome: editCat.nome.trim(), cor: editCat.cor },
                            { onSuccess: () => setEditCat(null) }
                          )
                        }
                      >
                        Salvar
                      </Button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-white/[0.06]"
                        onClick={() => setEditCat(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                      onClick={() => setEditCat({ id: c.id, nome: c.nome, cor: c.cor ?? "#6366F1" })}
                      aria-label="Editar categoria"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionShell>

        <SectionShell
          id="papeis"
          open={openSection === "papeis"}
          onToggle={toggleSection}
          icon={<Shield className="h-4 w-4" />}
          title="Papéis e permissões"
          countLabel={`${papeis.length} itens`}
        >
          <p className="text-[11px] text-[var(--text-muted)] mb-3 leading-relaxed">
            Papéis do sistema não podem ser alterados. Para papéis customizados, entre em contato.
          </p>
          <ul>
            {papeis.map((p) => (
              <li key={p.id} className="py-2.5 border-b border-white/[0.04] flex items-center gap-3">
                <span className="text-[11px] font-mono text-[var(--text-muted)] w-6">{p.nivel}</span>
                <span className="text-[13px] text-[var(--text-primary)] flex-1">{p.nome}</span>
                {p.is_sistema ? (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-200 border border-cyan-500/25">
                    Sistema
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>

        <SectionShell
          id="tipos_recurso"
          open={openSection === "tipos_recurso"}
          onToggle={toggleSection}
          icon={<Users className="h-4 w-4" />}
          title="Tipos de recurso"
          countLabel={`${tiposRecurso.length} itens`}
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Nome *</span>
                <input
                  className={inputClass}
                  value={novoTipoRec.nome}
                  onChange={(e) => setNovoTipoRec({ ...novoTipoRec, nome: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Descrição</span>
                <input
                  className={inputClass}
                  value={novoTipoRec.descricao}
                  onChange={(e) => setNovoTipoRec({ ...novoTipoRec, descricao: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <Button
                size="sm"
                type="button"
                disabled={!novoTipoRec.nome.trim() || !tenantId || createTipoRec.isPending}
                onClick={() => {
                  if (!tenantId) return;
                  createTipoRec.mutate(
                    {
                      tenant_id: tenantId,
                      nome: novoTipoRec.nome.trim(),
                      descricao: novoTipoRec.descricao.trim() || null,
                      is_ativo: true,
                    },
                    { onSuccess: () => setNovoTipoRec({ nome: "", descricao: "" }) }
                  );
                }}
              >
                Adicionar
              </Button>
            </div>
          }
        >
          <ul>
            {tiposRecurso.map((t) => {
              const isEditing = editTipoRec?.id === t.id;
              return (
                <li key={t.id} className="py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-wrap">
                  {isEditing && editTipoRec ? (
                    <>
                      <input
                        className={cn(inputClass, "min-w-[120px] flex-1")}
                        value={editTipoRec.nome}
                        onChange={(e) => setEditTipoRec({ ...editTipoRec, nome: e.target.value })}
                        placeholder="Nome"
                      />
                      <input
                        className={cn(inputClass, "min-w-[160px] flex-1")}
                        value={editTipoRec.descricao}
                        onChange={(e) => setEditTipoRec({ ...editTipoRec, descricao: e.target.value })}
                        placeholder="Descrição"
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] text-[var(--text-primary)] font-medium">{t.nome}</span>
                      {t.descricao ? (
                        <span className="text-[12px] text-[var(--text-muted)] flex-1 min-w-[140px]">{t.descricao}</span>
                      ) : (
                        <span className="flex-1" />
                      )}
                    </>
                  )}
                  {t.is_ativo === false && (
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">
                      inativo
                    </span>
                  )}
                  {isEditing && editTipoRec ? (
                    <div className="ml-auto flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        type="button"
                        className="h-8 text-[11px]"
                        disabled={!editTipoRec.nome.trim() || updateTipoRec.isPending}
                        onClick={() =>
                          updateTipoRec.mutate(
                            {
                              id: editTipoRec.id,
                              nome: editTipoRec.nome.trim(),
                              descricao: editTipoRec.descricao.trim() || null,
                            },
                            { onSuccess: () => setEditTipoRec(null) }
                          )
                        }
                      >
                        Salvar
                      </Button>
                      <button
                        type="button"
                        className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-white/[0.06]"
                        onClick={() => setEditTipoRec(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                      onClick={() =>
                        setEditTipoRec({ id: t.id, nome: t.nome, descricao: t.descricao ?? "" })
                      }
                      aria-label="Editar tipo de recurso"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionShell>

        <SectionShell
          id="tipos_cadastro"
          open={openSection === "tipos_cadastro"}
          onToggle={toggleSection}
          icon={<Layers className="h-4 w-4" />}
          title="Tipos de cadastro"
          countLabel={`${tiposCadastro.length} itens`}
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1 min-w-[140px] flex-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Nome *</span>
                <input
                  className={inputClass}
                  value={novoTipoCad.nome}
                  onChange={(e) => setNovoTipoCad({ ...novoTipoCad, nome: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Descrição</span>
                <input
                  className={inputClass}
                  value={novoTipoCad.descricao}
                  onChange={(e) => setNovoTipoCad({ ...novoTipoCad, descricao: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[120px]">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Módulo</span>
                <select
                  className={inputClass}
                  value={novoTipoCad.modulo}
                  onChange={(e) => setNovoTipoCad({ ...novoTipoCad, modulo: e.target.value })}
                >
                  {MODULOS_TIPO_CAD.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                type="button"
                disabled={!novoTipoCad.nome.trim() || !tenantId || createTipoCad.isPending}
                onClick={() => {
                  if (!tenantId) return;
                  createTipoCad.mutate(
                    {
                      tenant_id: tenantId,
                      nome: novoTipoCad.nome.trim(),
                      descricao: novoTipoCad.descricao.trim() || null,
                      modulo: novoTipoCad.modulo,
                      is_ativo: true,
                    },
                    { onSuccess: () => setNovoTipoCad((s) => ({ ...s, nome: "", descricao: "" })) }
                  );
                }}
              >
                Adicionar
              </Button>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MODULOS_TIPO_CAD.map((m) => tabBtn(moduloTipoCadTab === m.value, () => setModuloTipoCadTab(m.value), m.label))}
          </div>
          <ul>
            {tiposCadDoModulo.length === 0 ? (
              <li className="py-3 text-[12px] text-[var(--text-muted)]">Nenhum tipo cadastrado.</li>
            ) : (
              tiposCadDoModulo.map((t) => {
                const isEditing = editTipoCad?.id === t.id;
                return (
                  <li key={t.id} className="py-2.5 border-b border-white/[0.04] flex items-center gap-3 flex-wrap">
                    {isEditing && editTipoCad ? (
                      <>
                        <input
                          className={cn(inputClass, "min-w-[100px] flex-1")}
                          value={editTipoCad.nome}
                          onChange={(e) => setEditTipoCad({ ...editTipoCad, nome: e.target.value })}
                          placeholder="Nome"
                        />
                        <input
                          className={cn(inputClass, "min-w-[140px] flex-1")}
                          value={editTipoCad.descricao}
                          onChange={(e) => setEditTipoCad({ ...editTipoCad, descricao: e.target.value })}
                          placeholder="Descrição"
                        />
                        <select
                          className={cn(inputClass, "w-[130px]")}
                          value={editTipoCad.modulo}
                          onChange={(e) => setEditTipoCad({ ...editTipoCad, modulo: e.target.value })}
                        >
                          {MODULOS_TIPO_CAD.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="text-[13px] text-[var(--text-primary)] flex-1 min-w-[100px]">{t.nome}</span>
                        {t.descricao ? (
                          <span className="text-[12px] text-[var(--text-muted)] flex-1 min-w-[120px]">{t.descricao}</span>
                        ) : null}
                      </>
                    )}
                    {t.is_ativo === false && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)]">
                        inativo
                      </span>
                    )}
                    {isEditing && editTipoCad ? (
                      <div className="ml-auto flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
                        <Button
                          size="sm"
                          type="button"
                          className="h-8 text-[11px]"
                          disabled={!editTipoCad.nome.trim() || updateTipoCad.isPending}
                          onClick={() =>
                            updateTipoCad.mutate(
                              {
                                id: editTipoCad.id,
                                nome: editTipoCad.nome.trim(),
                                descricao: editTipoCad.descricao.trim() || null,
                                modulo: editTipoCad.modulo,
                              },
                              { onSuccess: () => setEditTipoCad(null) }
                            )
                          }
                        >
                          Salvar
                        </Button>
                        <button
                          type="button"
                          className="px-2 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:bg-white/[0.06]"
                          onClick={() => setEditTipoCad(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="ml-auto p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-300 hover:bg-indigo-500/10 shrink-0"
                        onClick={() =>
                          setEditTipoCad({
                            id: t.id,
                            nome: t.nome,
                            descricao: t.descricao ?? "",
                            modulo: t.modulo,
                          })
                        }
                        aria-label="Editar tipo de cadastro"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </SectionShell>

        <SectionShell
          id="aparencia"
          open={openSection === "aparencia"}
          onToggle={toggleSection}
          icon={<Palette className="h-4 w-4" />}
          title="Aparência e preferências"
          countLabel="—"
          footer={
            <div className="bg-[#0F0F1A] border-t border-white/[0.04] p-4 flex">
              <Button type="button" size="sm" disabled={!tenantId || updateConfigMut.isPending} onClick={salvarPreferencias}>
                Salvar preferências
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">Nome do sistema</span>
              <input className={cn(inputClass, "w-full max-w-md")} value={nomeSistema} onChange={(e) => setNomeSistema(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">Cor primária</span>
                <input
                  type="color"
                  className="h-9 w-14 rounded-lg border border-white/[0.12] bg-[#141424] cursor-pointer p-0.5"
                  value={corPrimaria}
                  onChange={(e) => setCorPrimaria(e.target.value)}
                />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">Dias de aviso de prazo</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={cn(inputClass, "w-24")}
                  value={diasAviso}
                  onChange={(e) => setDiasAviso(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
                  checked={exigirAprovacao}
                  onChange={(e) => setExigirAprovacao(e.target.checked)}
                />
                <span className="text-[13px] text-[var(--text-primary)]">Exigir aprovação interna</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-white/20 bg-[#141424] text-indigo-500 focus:ring-indigo-500/30"
                  checked={permitirClienteComentar}
                  onChange={(e) => setPermitirClienteComentar(e.target.checked)}
                />
                <span className="text-[13px] text-[var(--text-primary)]">Permitir cliente comentar</span>
              </label>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">Prefixos (somente leitura)</span>
              <div className="text-[12px] font-mono text-[var(--text-secondary)] flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">{config?.prefixo_portfolio ?? "—"}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">{config?.prefixo_programa ?? "—"}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">{config?.prefixo_projeto ?? "—"}</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06]">{config?.prefixo_atividade ?? "—"}</span>
              </div>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="modulos"
          open={openSection === "modulos"}
          onToggle={toggleSection}
          icon={<Settings2 className="h-4 w-4" />}
          title="Módulos ativos"
          countLabel="6 módulos"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {(
              [
                { field: "modulo_riscos" as const, label: "Riscos", icon: AlertTriangle },
                { field: "modulo_recursos" as const, label: "Recursos", icon: Users },
                { field: "modulo_gantt" as const, label: "Gantt", icon: BarChart3 },
                { field: "modulo_kanban" as const, label: "Kanban", icon: LayoutGrid },
                { field: "modulo_agenda" as const, label: "Agenda", icon: Calendar },
                { field: "modulo_mapa_estrategico" as const, label: "Mapa estratégico", icon: Map },
              ] as const
            ).map(({ field, label, icon: Ico }) => {
              const on = modField(field);
              return (
                <div
                  key={field}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-white/[0.06] bg-[#0F0F1A]"
                >
                  <Ico className="h-4 w-4 text-indigo-400/80 shrink-0" />
                  <span className="text-[13px] text-[var(--text-primary)] flex-1">{label}</span>
                  <span
                    className={cn(
                      "text-[9px] uppercase font-mono px-1.5 py-0.5 rounded",
                      on ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20" : "bg-white/[0.06] text-[var(--text-muted)]"
                    )}
                  >
                    {on ? "Ativo" : "Inativo"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    disabled={!tenantId || updateConfigMut.isPending}
                    onClick={() => setModulo(field, !on)}
                    className={cn(
                      "relative h-7 w-12 rounded-full transition-colors shrink-0",
                      on ? "bg-indigo-600" : "bg-white/[0.12]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                        on && "translate-x-6"
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </SectionShell>
      </div>
    </div>
  );
}
