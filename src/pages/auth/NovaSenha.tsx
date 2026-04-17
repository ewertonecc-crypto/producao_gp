import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function NovaSenha() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sessaoOk, setSessaoOk] = useState(false);
  const [tipo, setTipo] = useState<"recovery" | "invite" | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessaoOk(true);
        setTipo("recovery");
      } else if (event === "SIGNED_IN" && session) {
        const url = window.location.href;
        if (url.includes("aceitar-convite") || url.includes("type=invite")) {
          setTipo("invite");
        } else {
          setTipo("recovery");
        }
        setSessaoOk(true);
        await supabase.rpc("fn_ativar_usuario_no_login");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessaoOk(true);
    });
  }, []);

  const validar = () => {
    if (senha.length < 6) return "A senha deve ter pelo menos 6 caracteres";
    if (senha !== confirmar) return "As senhas não coincidem";
    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(senha))
      return "Use letras e números na senha";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validar();
    if (v) { setErro(v); return; }
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: senha });

    setLoading(false);

    if (error) {
      setErro("Erro ao salvar senha: " + error.message);
      return;
    }

    setSucesso(true);
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  if (!sessaoOk) {
    return (
      <div style={{
        minHeight: "100vh", background: "#050508",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif", padding: "1rem",
      }}>
        <div style={{
          maxWidth: "400px", width: "100%",
          background: "#141424", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px", padding: "2rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "40px", marginBottom: "1rem" }}>⏱</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", color: "#F0F0FF", marginBottom: "8px" }}>
            Link inválido ou expirado
          </h2>
          <p style={{ fontSize: "13px", color: "#5A5A80", marginBottom: "1.5rem" }}>
            Este link de recuperação não é mais válido. Solicite um novo.
          </p>
          <a href="/auth/recuperar-senha" style={{
            display: "inline-block", padding: "10px 20px",
            background: "linear-gradient(135deg, #6366F1, #4F46E5)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            fontSize: "13px", fontWeight: 600,
          }}>
            Solicitar novo link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#050508",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif", padding: "1rem",
    }}>
      <div style={{
        width: "100%", maxWidth: "400px",
        background: "#141424", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px", padding: "2rem",
        position: "relative", overflow: "hidden",
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

        {sucesso ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{
              width: "56px", height: "56px", margin: "0 auto 1rem",
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "24px",
            }}>✓</div>
            <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "18px", color: "#F0F0FF", marginBottom: "8px" }}>
              {tipo === "invite" ? "Conta ativada!" : "Senha alterada!"}
            </h2>
            <p style={{ fontSize: "13px", color: "#5A5A80" }}>
              Redirecionando para o dashboard...
            </p>
          </div>
        ) : (
          <>
            <h1 style={{
              fontFamily: "Syne, sans-serif", fontWeight: 700,
              fontSize: "22px", color: "#F0F0FF", marginBottom: "6px", letterSpacing: "-0.02em",
            }}>
              {tipo === "invite" ? "Criar sua senha" : "Nova senha"}
            </h1>
            <p style={{ fontSize: "13px", color: "#5A5A80", marginBottom: "1.5rem" }}>
              {tipo === "invite"
                ? "Defina uma senha para acessar o sistema."
                : "Escolha uma nova senha segura para sua conta."}
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "12px", color: "#A0A0C0", display: "block", marginBottom: "6px" }}>
                  Nova senha
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro(""); }}
                  placeholder="Mínimo 6 caracteres"
                  required
                  style={{
                    width: "100%", background: "#0F0F1A",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "10px", padding: "10px 14px",
                    fontSize: "14px", color: "#F0F0FF", outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "#6366F1"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "#A0A0C0", display: "block", marginBottom: "6px" }}>
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={e => { setConfirmar(e.target.value); setErro(""); }}
                  placeholder="Repita a senha"
                  required
                  style={{
                    width: "100%", background: "#0F0F1A",
                    border: erro ? "1px solid rgba(244,63,94,0.5)" : "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "10px", padding: "10px 14px",
                    fontSize: "14px", color: "#F0F0FF", outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "#6366F1"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                />
              </div>

              {senha.length > 0 && (
                <div>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: senha.length >= n * 3
                          ? n <= 1 ? "#F43F5E" : n <= 2 ? "#F59E0B" : n <= 3 ? "#6366F1" : "#10B981"
                          : "rgba(255,255,255,0.06)",
                        transition: "background 0.2s",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "10px", color: "#5A5A80" }}>
                    {senha.length < 3 ? "Muito fraca" : senha.length < 6 ? "Fraca" : senha.length < 9 ? "Média" : "Forte"}
                  </span>
                </div>
              )}

              {erro && (
                <div style={{
                  background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)",
                  borderRadius: "8px", padding: "10px 12px",
                  fontSize: "12px", color: "#F43F5E",
                }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !senha || !confirmar}
                style={{
                  width: "100%", padding: "11px",
                  background: loading ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366F1, #4F46E5)",
                  color: "#fff", border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: 600,
                  cursor: loading || !senha || !confirmar ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                {loading ? "Salvando..." : tipo === "invite" ? "Ativar conta →" : "Salvar nova senha →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
