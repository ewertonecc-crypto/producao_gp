import { Bell, LogOut, Search } from "lucide-react";

interface TopbarProps {
  tenantNome?: string;
  userLabel?: string;
  onSignOut?: () => void;
}

export default function Topbar({ tenantNome, userLabel, onSignOut }: TopbarProps) {
  return (
    <header className="h-[52px] flex-shrink-0 bg-[#0A0A12] border-b border-white/[0.04] flex items-center px-5 gap-4 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-2">
        <div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold font-display text-sm flex-shrink-0">
          ⬡
        </div>
        <span className="font-display font-extrabold text-[15px] tracking-tight bg-gradient-to-r from-[#F0F0FF] to-[#818CF8] bg-clip-text text-transparent">
          {tenantNome ?? "ProjectOS"}
        </span>
      </div>

      <div className="w-px h-6 bg-white/[0.04]" />

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#141424] border border-white/[0.12] rounded-[10px] px-3 py-[7px] transition-colors focus-within:border-indigo-500">
        <Search size={13} className="text-[var(--text-muted)] flex-shrink-0" />
        <input
          type="text"
          placeholder="Buscar projetos, atividades..."
          className="bg-transparent border-none outline-none font-sans text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[180px]"
        />
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2.5">
        <button className="w-8 h-8 rounded-[10px] border border-white/[0.08] bg-[#141424] flex items-center justify-center hover:border-indigo-500/35 transition-colors relative">
          <Bell size={14} className="text-[var(--text-muted)]" />
          <span className="absolute top-[5px] right-[5px] w-[7px] h-[7px] rounded-full bg-rose-500 border-[1.5px] border-[#0A0A12]" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#141424] border border-white/[0.08] rounded-[10px] px-2.5 py-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-[9px] font-bold text-white">
              {(userLabel ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[12px] font-medium text-[var(--text-secondary)] max-w-[140px] truncate">
              {userLabel ?? "—"}
            </span>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sair"
              className="w-8 h-8 rounded-[10px] border border-white/[0.08] bg-[#141424] flex items-center justify-center hover:border-rose-500/35 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
