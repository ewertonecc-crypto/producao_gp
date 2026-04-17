import { useState } from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetMsg(null);
    setResetLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (err) {
      setResetError(err.message);
    } else {
      setResetMsg("E-mail de redefinição enviado! Verifique sua caixa de entrada.");
    }
  };

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
        {forgotMode ? (
          <>
            <h1 className="font-display font-bold text-[20px] text-[var(--text-primary)] mb-1">Recuperar senha</h1>
            <p className="text-[11px] font-mono text-[var(--text-muted)] mb-6">Enviaremos um link para redefinir sua senha.</p>
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-1.5">E-mail</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-[#0F0F1A] border border-white/[0.12] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
              {resetError && <p className="text-[11px] text-rose-400 font-mono">{resetError}</p>}
              {resetMsg && <p className="text-[11px] text-emerald-400 font-mono">{resetMsg}</p>}
              <button
                type="submit"
                disabled={resetLoading}
                className="mt-2 py-2.5 rounded-[10px] text-[13px] font-medium text-white bg-gradient-to-br from-indigo-500 to-indigo-600 hover:shadow-[0_8px_24px_rgba(99,102,241,0.35)] disabled:opacity-50 transition-all"
              >
                {resetLoading ? "Enviando…" : "Enviar link"}
              </button>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setResetMsg(null); setResetError(null); }}
                className="text-[11px] font-mono text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
              >
                ← Voltar ao login
              </button>
            </form>
          </>
        ) : (
          <>
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0F0F1A] border border-white/[0.12] rounded-[10px] px-3 py-2.5 pr-10 text-[13px] text-[var(--text-primary)] outline-none focus:border-indigo-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-indigo-400 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
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
              <div style={{ textAlign: "right", marginTop: "4px" }}>
                <Link
                  to="/auth/recuperar-senha"
                  style={{ fontSize: "12px", color: "#818CF8", textDecoration: "none" }}
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
