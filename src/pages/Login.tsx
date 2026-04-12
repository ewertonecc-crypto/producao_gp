import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <p className="text-[12px] font-mono text-[var(--text-muted)]">Carregando…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error: err } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6">
      <div className="w-full max-w-[380px] bg-[#141424] border border-white/[0.08] rounded-2xl p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold font-display">
            ⬡
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-[#F0F0FF] to-[#818CF8] bg-clip-text text-transparent">
            ProjectOS
          </span>
        </div>
        <h1 className="font-display font-bold text-[20px] text-[var(--text-primary)] mb-1">Entrar</h1>
        <p className="text-[11px] font-mono text-[var(--text-muted)] mb-6">Use sua conta Supabase (Auth)</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/[0.12] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Senha</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0F0F1A] border border-white/[0.12] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
              required
            />
          </div>
          {error && (
            <p className="text-[11px] text-rose-400 font-mono">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 py-2.5 rounded-[10px] text-[13px] font-medium text-white bg-gradient-to-br from-indigo-500 to-indigo-600 hover:shadow-[0_8px_24px_rgba(99,102,241,0.35)] disabled:opacity-50 transition-all"
          >
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
