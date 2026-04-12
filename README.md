# ProjectOS — Gestão de Projetos

SaaS de gestão de projetos com portal de aceite para clientes externos.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Dev:** Lovable + Cursor

## Setup local

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd gestao-projetos

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
VITE_SUPABASE_URL=https://emdveuuzzauxxenvbvyv.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

> ⚠️ **Nunca** suba o `.env` para o repositório. Ele já está no `.gitignore`.

## Estrutura do projeto

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── layout/      # Sidebar, Topbar, AppLayout
│   └── modals/      # Modais de cadastro
├── hooks/           # React Query hooks por entidade
├── integrations/
│   └── supabase/    # Client + tipos gerados
├── lib/             # utils, helpers
├── pages/           # Uma página por rota
└── types/           # Tipos TypeScript do domínio
```

## Branches

| Branch | Responsável | Escopo |
|--------|-------------|--------|
| `dev/banco` | Pessoa 1 | Migrations, RLS, Seeds, Triggers |
| `dev/sistema` | Pessoa 2 | Telas, conexões, dashboards |
| `dev/site` | Pessoa 3 | Landing page, checkout, SEO |
| `main` | — | Produção — merge via PR aprovado |

## Banco de dados

25 tabelas + 5 views no Supabase (`sa-east-1`).  
Projeto: `emdveuuzzauxxenvbvyv` — Gestão de Projetos.
