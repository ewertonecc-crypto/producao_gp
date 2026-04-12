#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  ProjectOS — Setup GitHub
#  Execute: bash setup-github.sh <URL_DO_SEU_REPO>
#  Exemplo: bash setup-github.sh https://github.com/seu-usuario/gestao-projetos.git
# ═══════════════════════════════════════════════════════════════

set -e

REPO_URL=${1:-""}

if [ -z "$REPO_URL" ]; then
  echo ""
  echo "❌  Informe a URL do repositório GitHub como argumento:"
  echo "    bash setup-github.sh https://github.com/seu-usuario/gestao-projetos.git"
  echo ""
  exit 1
fi

echo ""
echo "🚀  ProjectOS — Setup GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Instalar dependências
echo "📦  Instalando dependências..."
npm install

# 2. Inicializar git (se necessário)
if [ ! -d ".git" ]; then
  echo "🔧  Inicializando repositório Git..."
  git init
fi

# 3. Configurar .env se não existir
if [ ! -f ".env" ]; then
  echo "⚙️   Criando .env a partir do .env.example..."
  cp .env.example .env
  echo ""
  echo "⚠️   ATENÇÃO: Edite o arquivo .env com suas credenciais Supabase antes de continuar!"
  echo "    VITE_SUPABASE_URL=https://emdveuuzzauxxenvbvyv.supabase.co"
  echo "    VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui"
  echo ""
fi

# 4. Commit inicial na main
echo "📝  Criando commit inicial..."
git add .
git commit -m "feat: initial project structure — Lovable + Supabase + Cursor

Stack:
- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS (design system ProjectOS)
- Supabase client (25 tabelas tipadas + React Query hooks)
- React Router v6 com 17 rotas
- Sonner para toasts

Estrutura:
- src/integrations/supabase/ — client + types gerados
- src/hooks/ — 11 hooks React Query (portfolios, programas, projetos, atividades, etc.)
- src/components/ui/ — button, badge, avatar, progress-bar, stat-card, empty-state
- src/components/layout/ — AppLayout, Sidebar, Topbar
- src/pages/ — Dashboard (completo), Portfolios, Programas, Projetos, Atividades, etc.
- Design system: Syne + DM Mono + Inter | dark theme indigo × cyan"

# 5. Adicionar remote e push para main
echo "🌐  Conectando ao repositório remoto..."
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git branch -M main
git push -u origin main

# 6. Criar branches de trabalho
echo ""
echo "🌿  Criando branches de trabalho..."

git checkout -b dev/banco
git push -u origin dev/banco
echo "  ✓  dev/banco — Pessoa 1 (Migrations · RLS · Triggers · Seeds)"

git checkout main
git checkout -b dev/sistema
git push -u origin dev/sistema
echo "  ✓  dev/sistema — Pessoa 2 (Telas · Conexões · Dashboards)"

git checkout main
git checkout -b dev/site
git push -u origin dev/site
echo "  ✓  dev/site — Pessoa 3 (Landing · Checkout · SEO)"

# 7. Voltar para main
git checkout main

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Setup concluído!"
echo ""
echo "Próximos passos:"
echo "  1. Edite o .env com as credenciais Supabase"
echo "  2. Execute: npm run dev"
echo "  3. Cada pessoa faz checkout na sua branch:"
echo "     - Pessoa 1: git checkout dev/banco"
echo "     - Pessoa 2: git checkout dev/sistema"
echo "     - Pessoa 3: git checkout dev/site"
echo ""
echo "Repositório: $REPO_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
