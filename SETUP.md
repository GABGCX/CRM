# OutboundCRM (Nuxt) — Setup em 5 passos

## Pré-requisitos
- Node.js 20+ (`node --version`)
- Git

---

## 1. Instalar dependências

```bash
cd outbound-crm-nuxt
npm install
```

---

## 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Preencha o `.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

NUXT_PUBLIC_APP_DOMAIN=crm.io
NUXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Configurar Supabase

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** → cole e rode `supabase/migrations/001_init.sql`
3. Vá em **Authentication → Hooks** → ative **Custom access token hook** → selecione `public.custom_access_token_hook`

---

## 4. Rodar

```bash
npm run dev
```

Acesse http://localhost:3000/register para criar sua organização.

---

## 5. Deploy (Vercel)

```bash
git init && git add . && git commit -m "init"
# push para GitHub, depois importe na Vercel
# Adicione as env vars no painel da Vercel
```

---

## Estrutura

```
outbound-crm-nuxt/
├── nuxt.config.ts              ← configuração principal
├── app.vue                     ← tema white-label + head
├── assets/css/main.css         ← Tailwind + CSS vars
├── tailwind.config.ts
├── middleware/
│   └── tenant.global.ts        ← resolve tenant + redirect auth
├── server/
│   ├── middleware/tenant.ts    ← injeção de tenant no SSR
│   └── api/
│       ├── auth/register.post.ts
│       ├── leads/              ← CRUD de leads
│       ├── diary/              ← diário
│       └── settings/           ← configurações da org
├── composables/
│   ├── useTenant.ts
│   ├── useProfile.ts
│   └── useTheme.ts
├── layouts/
│   └── dashboard.vue           ← sidebar + layout autenticado
├── pages/
│   ├── login.vue
│   ├── register.vue
│   └── dashboard/
│       ├── index.vue           ← dashboard
│       ├── diario.vue          ← diário de bordo
│       ├── pipeline.vue        ← pipeline de leads
│       ├── followup.vue        ← follow-up
│       └── configuracoes.vue   ← configurações white-label
├── types/index.ts
└── supabase/migrations/001_init.sql
```
