# Deploy - Prospecta CRM

Stack: Nuxt 3 (Nitro) + Supabase. Recomendado: **Vercel** (deploy automatico a partir do GitHub).

---

## 0. Pre-requisitos

- [ ] Codigo na `main` do GitHub (`GABGCX/CRM`). Se estiver num branch (ex: `feat/...`), abra o PR e faca **merge na main** primeiro.
- [ ] Projeto Supabase de producao criado.
- [ ] **Migrations aplicadas no banco de producao** (SQL Editor): `*_loss_reason_forecast_templates`, `*_tags`, `*_bdr_goals`, `*_management_notes`, `*_profiles_read_policy` (e as 001-009).
- [ ] `npm run build` passa localmente (ja validado).

---

## 1. Deploy na Vercel (recomendado)

1. Acesse https://vercel.com, faca login com o GitHub.
2. **Add New > Project** > importe o repositorio `GABGCX/CRM`.
3. A Vercel detecta **Nuxt** automaticamente:
   - Framework Preset: **Nuxt**
   - Build Command: `npm run build` (padrao)
   - Output: `.output` (padrao do Nitro/Vercel - nao precisa mexer)
   - Install: `npm install`
4. **Environment Variables** (proxima secao) - adicione antes do primeiro deploy.
5. **Deploy**. A cada push/merge na `main`, a Vercel redeploya sozinha.

---

## 2. Variaveis de ambiente (Vercel > Settings > Environment Variables)

Defina para **Production** (e Preview, se quiser testar branches):

| Variavel | Valor | Observacao |
|---|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` | Settings > API |
| `SUPABASE_KEY` | anon public key | Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **secreta** - so server |
| `NUXT_PUBLIC_APP_DOMAIN` | `seudominio.com.br` | dominio base (sem https) |
| `NUXT_PUBLIC_APP_URL` | `https://seudominio.com.br` | URL publica completa |

Importante:
- **Nunca** exponha a `SERVICE_ROLE_KEY` no client. Ela so e usada nos endpoints server (`server/`).
- Apos alterar env var, **Redeploy** (a Vercel nao aplica em deploy antigo).

---

## 3. Configuracao do Supabase (CRITICO - senao login/email quebram)

No painel Supabase > **Authentication > URL Configuration**:
- **Site URL**: `https://seudominio.com.br`
- **Redirect URLs** (adicione todas que usar):
  - `https://seudominio.com.br/confirm`
  - `https://seudominio.com.br/reset-password`
  - `https://*.seudominio.com.br/confirm` (se usar subdominios por tenant)

Sem isso, os links de confirmacao de email e recuperacao de senha apontam pro localhost ou falham.

---

## 4. Dominio customizado e multi-tenant (subdominios)

O app resolve a organizacao pelo **host** (`slug.seudominio.com.br` ou dominio proprio do cliente). Para producao multi-tenant:

1. Na Vercel > Project > **Settings > Domains**: adicione `seudominio.com.br` **e** o wildcard `*.seudominio.com.br`.
2. No seu provedor de DNS:
   - `seudominio.com.br` > registro conforme a Vercel indicar (A/ALIAS).
   - `*.seudominio.com.br` > **CNAME** para `cname.vercel-dns.com`.
3. `NUXT_PUBLIC_APP_DOMAIN` deve ser exatamente `seudominio.com.br`.
4. Dominio proprio de cliente (white-label): o cliente aponta um CNAME para `cname.vercel-dns.com` e voce salva o dominio em Configuracoes > Dominio (a tela ja orienta isso).

Se nao for usar multi-tenant por subdominio agora, basta o dominio raiz + `localhost`/dev funciona pelo fallback `__dev__`.

---

## 5. Pos-deploy (smoke test em producao)

- [ ] Abrir `https://seudominio.com.br` carrega a landing/login.
- [ ] Registrar uma org nova funciona e entra logado (nome no rodape, nao "Usuario").
- [ ] Criar e salvar um lead.
- [ ] Login/logout e recuperacao de senha (chega email com link correto).
- [ ] Sem erro de CSP no console (fontes Geist/Tabler carregam).
- [ ] Owner ve o menu Gestao; rodar 1 fluxo de cada area (use o `QA.md`).

---

## 6. Alternativas de hospedagem

**Netlify**: importe o repo, preset Nuxt, mesmas env vars. O Nitro tem preset Netlify automatico.

**Node server / VPS** (self-host):
```bash
npm install
npm run build          # gera .output
node .output/server/index.mjs   # sobe na porta 3000 (PORT configuravel)
```
Use um process manager (pm2/systemd) + proxy reverso (nginx) com HTTPS. Defina as mesmas env vars no ambiente do processo.

**Docker** (opcional): empacote o `.output` numa imagem Node 20+ e rode `node .output/server/index.mjs`. (O `docker-compose.evolution.yml` no repo e so pra Evolution API de WhatsApp em dev, nao pro app.)

---

## 7. Troubleshooting comum

- **App mostra "Usuario"/"BDR" e esconde Gestao**: faltou a policy de leitura de `profiles` (migration `*_profiles_read_policy`). Rode no SQL Editor.
- **Login redireciona errado / email aponta pro localhost**: Site URL / Redirect URLs no Supabase (secao 3).
- **Etiquetas/metas/coaching dao erro ao salvar**: migration correspondente nao aplicada no banco de prod.
- **Mudou env var e nao surtiu efeito**: Redeploy na Vercel.
- **Tipos do banco desatualizados**: `npm run db:types` com `SUPABASE_DB_URL` apontando pro banco.
