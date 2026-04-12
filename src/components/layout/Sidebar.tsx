import { NavLink } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/hooks/useTenant";
import { useAtividades } from "@/hooks/useAtividades";
import {
  LayoutDashboard, FolderKanban, Layers, FolderOpen,
  CheckSquare, Users2, AlertTriangle, Flag, UserCheck,
  UserCircle, Settings, ScrollText, Calendar, BarChart2,
  Trello, Map,
} from "lucide-react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export default function Sidebar() {
  const { tenantId } = useTenant();
  const { data: atividades = [] } = useAtividades(tenantId ?? undefined);

  const pendentes = useMemo(
    () =>
      atividades.filter(
        (a) =>
          a.status_aceite === "enviada" ||
          ((a.status as { nome?: string } | null)?.nome ?? "").toLowerCase().includes("revis")
      ).length,
    [atividades]
  );

  const sections: NavSection[] = useMemo(
    () => [
      {
        label: "Visão Geral",
        items: [
          { to: "/dashboard", icon: <LayoutDashboard size={14} />, label: "Dashboard" },
          { to: "/portfolios", icon: <FolderKanban size={14} />, label: "Portfólios" },
          { to: "/programas", icon: <Layers size={14} />, label: "Programas" },
          { to: "/projetos", icon: <FolderOpen size={14} />, label: "Projetos" },
        ],
      },
      {
        label: "Execução",
        items: [
          {
            to: "/atividades",
            icon: <CheckSquare size={14} />,
            label: "Atividades",
            badge: pendentes > 0 ? pendentes : undefined,
          },
          { to: "/recursos", icon: <Users2 size={14} />, label: "Recursos" },
          { to: "/riscos", icon: <AlertTriangle size={14} />, label: "Riscos" },
          { to: "/marcos", icon: <Flag size={14} />, label: "Marcos" },
        ],
      },
      {
        label: "Visualizações",
        items: [
          { to: "/agenda", icon: <Calendar size={14} />, label: "Agenda" },
          { to: "/gantt", icon: <BarChart2 size={14} />, label: "Gantt" },
          { to: "/kanban", icon: <Trello size={14} />, label: "Kanban" },
          { to: "/mapa", icon: <Map size={14} />, label: "Mapa Estratégico" },
        ],
      },
      {
        label: "Pessoas",
        items: [
          { to: "/usuarios", icon: <UserCheck size={14} />, label: "Usuários" },
          { to: "/clientes", icon: <UserCircle size={14} />, label: "Clientes Externos" },
        ],
      },
      {
        label: "Sistema",
        items: [
          { to: "/configuracoes", icon: <Settings size={14} />, label: "Configurações" },
          { to: "/audit", icon: <ScrollText size={14} />, label: "Audit Log" },
        ],
      },
    ],
    [pendentes]
  );

  return (
    <nav className="w-[220px] flex-shrink-0 bg-[#0A0A12] border-r border-white/[0.04] flex flex-col overflow-y-auto">
      {sections.map((section) => (
        <div key={section.label} className="pt-4 pb-1">
          <div className="px-[18px] pb-1.5 text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--text-dim)]">
            {section.label}
          </div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 px-[18px] py-2 text-[12.5px] transition-all duration-150 relative",
                  isActive
                    ? "text-[var(--text-primary)] bg-indigo-500/10 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[3px] before:h-[18px] before:bg-indigo-500 before:rounded-r-[3px] before:shadow-[0_0_8px_rgba(99,102,241,1)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]"
                )
              }
            >
              <span className={cn("opacity-70 flex-shrink-0")}>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-[9px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/20 px-1.5 py-px rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="mt-auto border-t border-white/[0.04] p-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-400 flex items-center justify-center text-[10px] font-bold text-white">
            AS
          </div>
          <div>
            <div className="text-[12px] font-medium text-[var(--text-primary)] truncate">Ana Silva</div>
            <div className="text-[10px] font-mono text-[var(--text-muted)]">Admin</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
