import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-4">
      <div className="font-display font-bold text-[48px] tracking-tight bg-gradient-to-r from-[#F0F0FF] to-[#818CF8] bg-clip-text text-transparent">404</div>
      <div className="text-[var(--text-secondary)] text-[16px]">Página não encontrada</div>
      <Link to="/dashboard" className="text-[var(--accent-bright)] text-[13px] font-mono hover:underline">← Voltar ao Dashboard</Link>
    </div>
  );
}
