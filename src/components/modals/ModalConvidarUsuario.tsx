import { useState } from "react";
import { useConvidarUsuario } from "@/hooks/useConvidarUsuario";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PAPEIS = [
  { value: "admin",        label: "Admin",              desc: "Acesso total" },
  { value: "gerente",      label: "Gerente",            desc: "Gerencia projetos" },
  { value: "membro",       label: "Membro",             desc: "Trabalha nas atividades" },
  { value: "visualizador", label: "Visualizador",       desc: "Apenas leitura" },
] as const;

export function ModalConvidarUsuario({ open, onClose }: Props) {
  const { mutateAsync: convidar, isPending } = useConvidarUsuario();
  const [form, setForm] = useState({ nome: "", email: "", cargo: "", departamento: "", papel_global: "membro" as const });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
    if (!form.email.trim()) errs.email = "Email é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await convidar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        cargo: form.cargo.trim() || undefined,
        departamento: form.departamento.trim() || undefined,
        papel_global: form.papel_global,
      });
      setForm({ nome: "", email: "", cargo: "", departamento: "", papel_global: "membro" });
      onClose();
    } catch { /* erro tratado no hook */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#141424] border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-[18px] tracking-tight text-[var(--text-primary)]">Convidar Usuário</h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Um email de convite será enviado automaticamente</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-[var(--text-muted)] transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* Nome */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-1.5">Nome completo <span className="text-rose-400">*</span></label>
            <input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Ex: João Silva"
              className={cn("w-full bg-[#0F0F1A] border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-dim)]",
                errors.nome ? "border-rose-500/50 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]" : "border-white/[0.10] focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]")} />
            {errors.nome && <p className="text-[11px] text-rose-400 mt-1">{errors.nome}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-1.5">Email <span className="text-rose-400">*</span></label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="joao@empresa.com"
              className={cn("w-full bg-[#0F0F1A] border rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text-primary)] outline-none transition-all font-mono placeholder:font-sans placeholder:text-[var(--text-dim)]",
                errors.email ? "border-rose-500/50 focus:shadow-[0_0_0_3px_rgba(244,63,94,0.08)]" : "border-white/[0.10] focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]")} />
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
          </div>

          {/* Cargo + Depto */}
          <div className="grid grid-cols-2 gap-3">
            {["cargo", "departamento"].map(field => (
              <div key={field}>
                <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-1.5 capitalize">{field === "departamento" ? "Departamento" : "Cargo"}</label>
                <input value={(form as any)[field]} onChange={e => set(field, e.target.value)}
                  placeholder={field === "cargo" ? "Ex: Dev" : "Ex: TI"}
                  className="w-full bg-[#0F0F1A] border border-white/[0.10] rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[var(--text-primary)] outline-none focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all placeholder:text-[var(--text-dim)]" />
              </div>
            ))}
          </div>

          {/* Papel */}
          <div>
            <label className="text-[12px] font-medium text-[var(--text-secondary)] block mb-1.5">Papel no sistema</label>
            <div className="grid grid-cols-2 gap-2">
              {PAPEIS.map(p => (
                <button key={p.value} onClick={() => set("papel_global", p.value)}
                  className={cn("text-left px-3 py-2.5 rounded-[10px] border transition-all",
                    form.papel_global === p.value ? "bg-indigo-500/10 border-indigo-500/40 text-[var(--text-primary)]" : "bg-[#0F0F1A] border-white/[0.08] text-[var(--text-muted)] hover:border-white/[0.16]")}>
                  <div className="text-[12.5px] font-medium">{p.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-indigo-500/[0.06] border border-indigo-500/15 rounded-[10px] px-3.5 py-2.5 flex gap-2.5">
            <span className="text-indigo-400 flex-shrink-0">ℹ</span>
            <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">O convidado receberá um email com link para criar senha. O acesso fica inativo até aceitar o convite.</p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.04]">
            <button onClick={onClose} disabled={isPending} className="px-4 py-2 text-[12.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={isPending}
              className="px-5 py-2 text-[12.5px] font-medium text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-[10px] hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(99,102,241,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {isPending ? "Enviando..." : "Enviar Convite →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
