import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useNotificacoes,
  useMarcarNotificacaoLida,
  useMarcarTodasNotificacoesLidas,
} from "@/hooks/useNotificacoes";
import { cn, timeAgo } from "@/lib/utils";

interface TopbarProps {
  tenantNome?: string;
  tenantId?: string;
  userId?: string;
  userLabel?: string;
  onSignOut?: () => void;
}

export default function Topbar({ tenantNome, tenantId, userId, userLabel, onSignOut }: TopbarProps) {
  const navigate = useNavigate();
  const { data: lista = [], isLoading } = useNotificacoes(tenantId, userId);
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasNotificacoesLidas();
  const naoLidas = lista.filter((n) => !n.lida).length;

  const abrirNotificacao = (n: (typeof lista)[number]) => {
    if (tenantId) void marcarLida.mutateAsync({ id: n.id, tenantId });
    const href = n.link?.trim();
    if (!href) return;
    if (href.startsWith("/")) navigate(href);
    else if (href.startsWith("http://") || href.startsWith("https://")) window.open(href, "_blank", "noopener,noreferrer");
  };

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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              title="Notificações"
              disabled={!tenantId || !userId}
              className="w-8 h-8 rounded-[10px] border border-white/[0.08] bg-[#141424] flex items-center justify-center hover:border-indigo-500/35 transition-colors relative disabled:opacity-40 disabled:pointer-events-none"
            >
              <Bell size={14} className="text-[var(--text-muted)]" />
              {naoLidas > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-rose-500 border-[1.5px] border-[#0A0A12] text-[9px] font-bold text-white flex items-center justify-center leading-none tabular-nums">
                  {naoLidas > 99 ? "99+" : naoLidas}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className={cn(
                "z-[200] w-[min(100vw-24px,340px)] rounded-xl border border-white/[0.1] bg-[#12121c] shadow-xl shadow-black/40",
                "data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0 zoom-in-95"
              )}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-white/[0.06]">
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">Notificações</span>
                {naoLidas > 0 && tenantId && userId && (
                  <button
                    type="button"
                    disabled={marcarTodas.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void marcarTodas.mutateAsync({ tenantId, userId });
                    }}
                    className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              <div className="max-h-[min(70vh,320px)] overflow-y-auto py-1">
                {!tenantId || !userId ? (
                  <div className="px-3 py-6 text-center text-[11px] font-mono text-[var(--text-muted)]">Entre para ver alertas</div>
                ) : isLoading ? (
                  <div className="px-3 py-6 text-center text-[11px] font-mono text-[var(--text-muted)]">Carregando…</div>
                ) : lista.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[11px] font-mono text-[var(--text-muted)]">Nenhuma notificação</div>
                ) : (
                  lista.map((n) => (
                    <DropdownMenu.Item
                      key={n.id}
                      className={cn(
                        "px-3 py-2.5 cursor-pointer outline-none text-left border-b border-white/[0.04] last:border-0",
                        "hover:bg-white/[0.04] focus:bg-white/[0.06] data-[highlighted]:bg-white/[0.06]",
                        !n.lida && "bg-indigo-500/[0.06]"
                      )}
                      onSelect={() => abrirNotificacao(n)}
                    >
                      <div className="text-[12px] font-medium text-[var(--text-primary)] leading-snug">{n.titulo}</div>
                      {n.mensagem && (
                        <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.mensagem}</div>
                      )}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-[9px] font-mono uppercase tracking-wide text-[var(--text-muted)]">{n.tipo}</span>
                        <span className="text-[9px] font-mono text-[var(--text-muted)]">{timeAgo(n.criado_em)}</span>
                      </div>
                    </DropdownMenu.Item>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

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
