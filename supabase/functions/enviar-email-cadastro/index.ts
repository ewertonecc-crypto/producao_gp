import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nome, email, empresa, plano, login_url } = await req.json();

    if (!nome || !email || !empresa) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY  = Deno.env.get("RESEND_API_KEY")!;
    const SEU_EMAIL       = Deno.env.get("SEU_EMAIL")!;
    const EMAIL_REMETENTE = Deno.env.get("EMAIL_REMETENTE")!;

    const APP_LOGIN_URL = login_url || Deno.env.get("APP_LOGIN_URL") || "https://app.projectos.com.br/login";

    const planosNomes: Record<string, string> = {
      starter:    "Starter — R$ 149/mês",
      pro:        "Pro — R$ 349/mês",
      enterprise: "Enterprise — Sob consulta",
    };
    const planoNome = planosNomes[plano] || plano;
    const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Email 1: Boas-vindas para o cliente
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_REMETENTE,
        to: [email],
        subject: `Bem-vindo ao ProjectOS, ${nome}! 🚀`,
        html: templateBoasVindas(nome, email, empresa, planoNome, APP_LOGIN_URL),
      }),
    });

    // Email 2: Notificação interna
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_REMETENTE,
        to: [SEU_EMAIL],
        subject: `🔔 Novo cadastro — ${nome} (${empresa})`,
        html: templateNotificacao(nome, email, empresa, planoNome, agora),
      }),
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Erro na edge function:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno ao enviar email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function templateBoasVindas(nome: string, email: string, empresa: string, plano: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050508;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:#0F0F1A;border:1px solid rgba(99,102,241,0.3);border-radius:16px;padding:12px 24px;">
        <span style="font-size:18px;font-weight:800;color:#F0F0FF;letter-spacing:-0.02em;">⬡ ProjectOS</span>
      </div>
    </div>
    <div style="background:#0F0F1A;border:1px solid rgba(99,102,241,0.2);border-radius:20px;overflow:hidden;">
      <div style="height:3px;background:linear-gradient(90deg,#6366F1,#22D3EE);"></div>
      <div style="padding:36px 32px;">
        <div style="font-size:40px;margin-bottom:16px;">🚀</div>
        <h1 style="font-size:22px;font-weight:800;color:#F0F0FF;margin:0 0 12px;letter-spacing:-0.02em;">
          Bem-vindo ao ProjectOS, ${nome}!
        </h1>
        <p style="font-size:15px;color:#A0A0C0;line-height:1.7;margin:0 0 24px;">
          Seu trial gratuito de <strong style="color:#F0F0FF;">14 dias</strong> está ativado para
          <strong style="color:#F0F0FF;">${empresa}</strong>.<br>
          Plano: <strong style="color:#818CF8;">${plano}</strong>
        </p>
        <div style="background:#141424;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:16px;">
          <div style="font-size:11px;color:#5A5A80;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">Seu acesso</div>
          <div style="font-size:14px;color:#A0A0C0;line-height:1.8;">
            Login: <strong style="color:#F0F0FF;">${email}</strong><br>
            Se for seu primeiro acesso, use "Esqueceu a senha?" para criar sua senha.
          </div>
        </div>
        <a href="${loginUrl}" style="display:block;text-align:center;padding:13px 24px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;margin-bottom:24px;">
          Acessar sistema →
        </a>
        <div style="background:#141424;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="font-size:11px;color:#5A5A80;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">O que acontece agora</div>
          <div style="font-size:14px;color:#A0A0C0;line-height:1.8;">
            ✓ Você já pode acessar o sistema pelo botão acima<br>
            ✓ Nossa equipe entrará em contato em até 24h úteis<br>
            ✓ Onboarding guiado incluso no trial
          </div>
        </div>
        <p style="font-size:13px;color:#5A5A80;margin:0;">
          Dúvidas? Responda este email ou escreva para
          <a href="mailto:suporte@projectos.com.br" style="color:#818CF8;">suporte@projectos.com.br</a>
        </p>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#2E2E50;margin-top:24px;">
      ProjectOS · Gestão de Projetos para Times de TI · Brasil 🇧🇷
    </p>
  </div>
</body>
</html>`;
}

function templateNotificacao(nome: string, email: string, empresa: string, plano: string, agora: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050508;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#0F0F1A;border:1px solid rgba(34,211,238,0.25);border-radius:20px;overflow:hidden;">
      <div style="height:3px;background:linear-gradient(90deg,#22D3EE,#6366F1);"></div>
      <div style="padding:32px;">
        <div style="display:inline-block;background:rgba(34,211,238,0.1);border:1px solid rgba(34,211,238,0.2);border-radius:100px;padding:4px 14px;font-size:11px;color:#22D3EE;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">
          🔔 Novo cadastro
        </div>
        <h2 style="font-size:20px;font-weight:800;color:#F0F0FF;margin:0 0 20px;">
          ${nome} quer experimentar o ProjectOS
        </h2>
        <table style="width:100%;border-collapse:collapse;background:#141424;border-radius:12px;overflow:hidden;margin-bottom:20px;">
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
            <td style="padding:14px 18px;font-size:11px;color:#5A5A80;text-transform:uppercase;letter-spacing:0.06em;width:100px;">Nome</td>
            <td style="padding:14px 18px;font-size:13px;color:#F0F0FF;font-weight:500;">${nome}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
            <td style="padding:14px 18px;font-size:11px;color:#5A5A80;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
            <td style="padding:14px 18px;font-size:13px;color:#818CF8;">${email}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
            <td style="padding:14px 18px;font-size:11px;color:#5A5A80;text-transform:uppercase;letter-spacing:0.06em;">Empresa</td>
            <td style="padding:14px 18px;font-size:13px;color:#F0F0FF;font-weight:500;">${empresa}</td>
          </tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
            <td style="padding:14px 18px;font-size:11px;color:#5A5A80;text-transform:uppercase;letter-spacing:0.06em;">Plano</td>
            <td style="padding:14px 18px;font-size:13px;color:#22D3EE;font-weight:500;">${plano}</td>
          </tr>
          <tr>
            <td style="padding:14px 18px;font-size:11px;color:#5A5A80;text-transform:uppercase;letter-spacing:0.06em;">Data/Hora</td>
            <td style="padding:14px 18px;font-size:13px;color:#F0F0FF;font-family:monospace;">${agora}</td>
          </tr>
        </table>
        <a href="mailto:${email}?subject=Bem-vindo ao ProjectOS — Próximos passos&body=Olá ${nome}," style="display:block;text-align:center;padding:13px 24px;background:linear-gradient(135deg,#6366F1,#4F46E5);color:#fff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:500;">
          Responder para ${nome} →
        </a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#2E2E50;margin-top:20px;">
      ProjectOS · Notificação interna automática
    </p>
  </div>
</body>
</html>`;
}
