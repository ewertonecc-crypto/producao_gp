import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/nova-senha`,
      }
    );

    setLoading(false);

    if (error) {
      console.error(error);
    }

    setEnviado(true);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050508",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-body, Inter, sans-serif)",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#141424",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent, #6366F1, #22D3EE, transparent)",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #6366F1, #22D3EE)",
            borderRadius: "8px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "16px",
          }}>⬡</div>
          <span style={{
            fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "18px",
            background: "linear-gradient(135deg, #F0F0FF, #818CF8)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>ProjectOS</span>
        </div>

        {!enviado ? (
          <>
            <h1 style={{
              fontFamily: "Syne, sans-serif", fontWeight: 700,
              fontSize: "22px", color: "#F0F0FF", marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}>
              Recuperar senha
            </h1>
            <p style={{ fontSize: "13px", color: "#5A5A80", marginBottom: "1.5rem" }}>
              Informe seu email e enviaremos um link para criar uma nova senha.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#A0A0C0", display: "block", marginBottom: "6px" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: "100%", background: "#0F0F1A",
                    border: erro ? "1px solid rgba(244,63,94,0.5)" : "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "10px", padding: "10px 14px",
                    fontSize: "14px", color: "#F0F0FF", outline: "none",
                    boxSizing: "border-box", fontFamily: "DM Mono, monospace",
                  }}
                  onFocus={e => e.target.style.borderColor = "#6366F1"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                />
                {erro && (
                  <p style={{ fontSize: "11px", color: "#F43F5E", marginTop: "4px" }}>{erro}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                style={{
                  width: "100%", padding: "11px",
                  background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                  color: "#fff", border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação →"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "56px", height: "56px", margin: "0 auto 1rem",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "24px",
            }}>✉</div>
            <h2 style={{
              fontFamily: "Syne, sans-serif", fontWeight: 700,
              fontSize: "18px", color: "#F0F0FF", marginBottom: "8px",
            }}>
              Email enviado!
            </h2>
            <p style={{ fontSize: "13px", color: "#5A5A80", lineHeight: "1.6", marginBottom: "1.5rem" }}>
              Se <strong style={{ color: "#A0A0C0" }}>{email}</strong> estiver cadastrado no sistema,
              você receberá um link para criar uma nova senha em instantes.
            </p>
            <p style={{ fontSize: "11px", color: "#2E2E50" }}>
              Verifique também a pasta de spam.
            </p>
          </div>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "1rem" }}>
          <Link
            to="/login"
            style={{ fontSize: "13px", color: "#818CF8", textDecoration: "none" }}
          >
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
