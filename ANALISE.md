# Análise do Projeto: OutboundCRM

> Documento gerado em 2026-06-09. Baseado em análise estática completa do código-fonte.

---

## 1. Proposta de Negócio

O OutboundCRM é um SaaS multi-tenant voltado para **equipes de vendas outbound** (BDRs e closers). A proposta central é oferecer uma ferramenta enxuta e orientada a métricas que substitui planilhas e CRMs genéricos para times que operam com alto volume de ligações, follow-ups cadenciados e metas numéricas claras.

**Público-alvo:** Pequenas e médias empresas com time comercial ativo (1–30 vendedores), especialmente em modelos de venda consultiva B2B.

**Diferencial declarado:**
- Protocolo de follow-up de 10 tentativas com cadência automática (dias 2, 4, 6, 8, 10... 20)
- "Matemática de vendas" reversa: a partir da meta de faturamento, calcula quantas ligações por dia o time precisa fazer
- Diário de métricas diário (CE → RM → RR → FR) para rastrear produtividade real
- White-label com domínio customizado para revenda/agências

---

## 2. Funcionalidades Implementadas

| Módulo | Status | O que faz |
|---|---|---|
| Autenticação (login/register) | Completo | Email/senha, sessão em cookie 7 dias, rate-limit de registro |
| Multi-tenancy | Completo | Subdomínio, domínio customizado, RLS por org_id no JWT |
| Pipeline / Kanban | Completo | 10 status, drag-and-drop, lista + kanban, filtros, export CSV |
| Follow-up Protocol | Completo | 10 slots por lead, toggle de conclusão, previsão 7 dias, urgência |
| Diário de Métricas | Completo | Entrada diária CE/RM/RR/FR, Ctrl+S, totais mensais, taxas de conversão |
| Cockpit / Dashboard | Completo | KPIs do dia, sparkline de CE vs meta, banner de ritmo (pace) |
| Matemática de Vendas | Completo | Cálculo reverso meta→ligações, detecção de gargalo, ajuste em tempo real |
| Configurações (White-label) | Completo | Nome, cor, logo, favicon, domínio customizado, guia de DNS |
| Convite de Membros | Parcial | Envia email de convite (Supabase), sem onboarding após aceite |
| Integração WhatsApp (Evolution API) | Incompleto | Docker configurado, webhook não implementado |
| Papéis (owner / admin / bdr) | Completo | RLS + middleware client-side + proteção de rotas |

---

## 3. Análise de Gaps e Lacunas

### 3.1 Gaps Críticos (impactam uso em produção)

---

#### GAP-01 — Sem onboarding após convite

**Problema:** O fluxo de convite de membros (`POST /api/settings/invite`) chama `supabase.auth.admin.inviteUserByEmail()`, mas não existe nenhuma página `/invite` ou `/accept` no frontend. O usuário convidado recebe um email do Supabase, clica no link e... cai no Supabase Auth genérico sem qualquer contexto. O `profile` na tabela `profiles` nunca é criado para esse usuário convidado, pois o trigger de criação de perfil (`handle_new_user`) só é chamado no register normal — e o `org_id` associado ao convite se perde.

**Impacto:** Convites não funcionam. Membros não conseguem entrar na organização.

**Solução:**
1. Criar página `/accept.vue` que lê o token do Supabase Auth (`onAuthStateChange` com `SIGNED_IN` pós-invite)
2. Chamar um endpoint `POST /api/auth/accept-invite` que lê o `org_id` e `role` do metadata do convite e cria o `profile`
3. Armazenar `org_id` e `role` no `user_metadata` ao enviar o convite (já há `{ org_id, role }` passado como metadata no invite — falta apenas consumi-lo)

---

#### GAP-02 — Rate limiting em memória (não funciona em produção escalada)

**Problema:** `server/utils/rateLimit.ts` usa um `Map` em memória. Em qualquer deploy com múltiplas instâncias (Vercel serverless, containers horizontais), cada instância tem seu próprio mapa — o rate limit é contornado trivialmente chamando instâncias diferentes.

**Impacto:** Registro e envio de convites podem ser abusados para spam/DDoS de email ou para criar organizações falsas em volume.

**Solução:**
- Substituir pelo rate limiting nativo do Vercel (edge config + KV) ou adicionar Redis (Upstash é gratuito até certo tier e tem SDK para edge)
- Alternativa de baixo custo: usar a tabela do Supabase como contador com `INSERT ... ON CONFLICT DO UPDATE` + `created_at >= NOW() - INTERVAL '1 hour'`

---

#### GAP-03 — Webhook do WhatsApp não implementado

**Problema:** O `docker-compose.evolution.yml` aponta `WEBHOOK_URL` para `/api/whatsapp/webhook`, mas esse endpoint não existe no codebase. A integração WhatsApp é mencionada no setup como funcionalidade, mas está 0% funcional.

**Impacto:** Nenhuma funcionalidade de WhatsApp opera. Qualquer usuário que configurar a Evolution API verá erros silenciosos.

**Solução:**
- Criar `server/api/whatsapp/webhook.post.ts` com handler básico (receber mensagem, associar ao lead pelo telefone, salvar em nova tabela `messages`)
- Criar tabela `messages` com `lead_id`, `channel` (whatsapp), `direction` (in/out), `content`, `timestamp`
- Adicionar UI no card do lead para ver histórico de conversas

---

#### GAP-04 — Sem validação de telefone duplicado / lead duplicado

**Problema:** `POST /api/leads/index.post.ts` não verifica se já existe um lead com o mesmo `telefone` na org. É fácil criar duplicatas.

**Impacto:** Dados sujos, follow-ups duplicados, vendedores ligando para a mesma pessoa duas vezes.

**Solução:**
- Adicionar constraint `UNIQUE(org_id, telefone)` na migration (ou uma verificação via `SELECT` antes do insert com retorno 409)
- No frontend, tratar 409 com mensagem "Lead com este telefone já existe — deseja visualizá-lo?"

---

#### GAP-05 — Sem paginação na listagem de leads

**Problema:** `GET /api/leads/index.get.ts` retorna todos os leads da org com um único `.select()`. Com 500+ leads, isso se torna lento e pode ultrapassar limites de payload.

**Impacto:** Performance degradada. O composable `useLeads.ts` carrega tudo em memória no cliente.

**Solução:**
- Adicionar `.range(offset, offset + limit - 1)` no query do Supabase
- Implementar scroll infinito ou paginação por página no frontend
- Alternativamente, cursor-based pagination via `created_at` para kanban (carrega apenas leads "ativos")

---

### 3.2 Gaps Funcionais (funcionalidades ausentes esperadas em um CRM)

---

#### GAP-06 — Sem histórico de atividades / log de eventos por lead

**Problema:** Não existe registro do que aconteceu com cada lead ao longo do tempo. Quando o status muda de "Follow-up" para "Reunião agendada", essa transição desaparece.

**Impacto:** Sem contexto de histórico, o vendedor não sabe o que foi feito anteriormente, e o gestor não consegue auditar.

**Solução:**
- Criar tabela `lead_events` (`id`, `lead_id`, `org_id`, `user_id`, `type`, `payload jsonb`, `created_at`)
- Disparar insert em `lead_events` nos endpoints `PATCH /api/leads/[id]` (status change, field update) e `PATCH /api/leads/[id]/followup`
- Adicionar aba "Histórico" no card do lead no pipeline

---

#### GAP-07 — Sem gestão de usuários / membros da equipe

**Problema:** A página de configurações tem o formulário de convite, mas não existe listagem de membros existentes, edição de papel (role), nem desativação de conta.

**Impacto:** Owner não consegue remover um vendedor que saiu da empresa ou promover um BDR a admin.

**Solução:**
- Criar endpoint `GET /api/settings/members` que retorna `profiles` da org com nome, email, role
- Criar endpoint `PATCH /api/settings/members/[id]` para alterar role
- Criar endpoint `DELETE /api/settings/members/[id]` que remove o `profile` (e revoga sessão via service role)
- Renderizar lista de membros na página de configurações com ações inline

---

#### GAP-08 — Sem notificações de follow-up vencidos

**Problema:** A aba "vencidos" no follow-up mostra leads com retorno atrasado, mas não há nenhum mecanismo de alerta proativo — email, push ou badge no app.

**Impacto:** Vendedores precisam entrar no app para saber se têm follow-ups atrasados. Leads esfriam sem aviso.

**Solução:**
- Criar cron job (Vercel Cron ou Supabase pg_cron) que roda diariamente às 8h
- Query: leads com `data_retorno < TODAY` e status não-final
- Enviar email de resumo via Resend/SendGrid com lista de leads a contatar
- Alternativa rápida: badge no título da aba do browser (`document.title = "(3) Follow-ups vencidos"`)

---

#### GAP-09 — Sem relatórios / exportação além de CSV básico

**Problema:** A exportação CSV (`exportCSV()` no `useLeads.ts`) exporta os dados brutos dos leads. Não existe nenhum relatório de desempenho por período, por vendedor, ou funil de conversão histórico.

**Impacto:** Gestores não conseguem apresentar resultados sem processar os dados em planilha externamente.

**Solução:**
- Adicionar página `/dashboard/relatorios` com gráficos de:
  - Funil de conversão por mês (CE→RM→RR→FR)
  - Leads por status (donut chart)
  - Produtividade por vendedor (barras)
- Usar a view `monthly_summary` já existente no banco como fonte
- Biblioteca: `chart.js` ou `echarts` (ambas leves, sem deps pesadas)

---

#### GAP-10 — Sem campo de empresa/CNPJ estruturado

**Problema:** O lead tem `negocio` (texto livre) e `num_vendedores` (int), mas não há: CNPJ, segmento/setor, tamanho da empresa (faixa), cidade/estado, fonte do lead (indicação, LinkedIn, cold call).

**Impacto:** Não é possível segmentar a base, calcular ICP (Ideal Customer Profile) ou rastrear a origem dos leads para medir ROI de canais.

**Solução:**
- Adicionar campos opcionais: `fonte` (enum: cold_call, linkedin, indicacao, evento, outro), `segmento` (text), `cidade` (text), `estado` (text), `porte` (enum: micro, pequena, media, grande)
- Migration não-destrutiva (todos nullable com default null)
- Formulário de criação expandível ("Dados adicionais" colapsável)

---

#### GAP-11 — Sem attach de proposta / documentos ao lead

**Problema:** O status "Proposta enviada" existe no pipeline, mas não há como anexar a proposta em si. O link ou documento fica em email ou WhatsApp, fora do CRM.

**Impacto:** Desconexão entre o CRM e o processo comercial real.

**Solução:**
- Adicionar campo `proposta_url` (text nullable) no lead
- Alternativa mais completa: tabela `attachments` (`lead_id`, `name`, `url`, `type`) com upload para Supabase Storage
- UI: botão "Anexar proposta" no card do lead

---

#### GAP-12 — Sem integração de email (enviar/receber)

**Problema:** O fluxo outbound é baseado em ligações e WhatsApp, mas muitas vendas B2B envolvem email. Não há rastreamento de emails enviados por lead.

**Solução:**
- Integração com Gmail/Outlook via OAuth (complexo) **ou**
- Campo simples `ultimo_email_enviado` (date) + nota de email no histórico de atividades (GAP-06)
- Para rastreamento real: usar Nylas ou Postmark Inbound como intermediário

---

### 3.3 Gaps de Qualidade / Técnicos

---

#### GAP-13 — Sem testes automatizados

**Problema:** Zero arquivos de teste encontrados no projeto. Nenhum `*.spec.ts`, `*.test.ts`, `vitest.config`, `cypress` ou similar.

**Impacto:** Qualquer mudança pode quebrar funcionalidades existentes sem detecção. Impossível fazer CI/CD confiável.

**Solução prioritária:**
1. Testes unitários dos composables (`useOutboundMath.ts` é puro e trivial de testar): Vitest
2. Testes de integração dos endpoints de API com Supabase local (`supabase start`)
3. Testes E2E do fluxo crítico (login → criar lead → mover status → marcar follow-up): Playwright

---

#### GAP-14 — Sem tratamento de erro padronizado nas API routes

**Problema:** Cada endpoint trata erros de forma diferente. Alguns retornam `{ error: string }`, outros lançam `createError()`, outros retornam objetos diferentes. Não há código HTTP consistente.

**Impacto:** O frontend precisa checar `error`, `message`, e status code de formas diferentes dependendo do endpoint. Difícil de manter.

**Solução:**
- Criar `server/utils/apiError.ts` com função `throwApiError(status, code, message)` que usa `createError()` do H3
- Aplicar em todos os endpoints
- Definir enum de códigos de erro: `LEAD_NOT_FOUND`, `FORBIDDEN`, `VALIDATION_ERROR`, etc.

---

#### GAP-15 — Rate limit em memória não persiste entre deploys (duplicado com GAP-02 mas em escopo diferente)

**Problema adicional:** O `tenantCache.ts` usa Map em memória com TTL de 60s. Em serverless (Vercel), cada função invocation é potencialmente uma instância nova — o cache nunca aquece.

**Solução:** Usar Vercel KV (Redis) ou Supabase como cache de tenant. Custo marginal zero para o volume esperado.

---

#### GAP-16 — Sem CSP (Content Security Policy) e headers de segurança

**Problema:** O `nuxt.config.ts` não define `security` headers. A aplicação não tem CSP, HSTS, X-Frame-Options, ou Referrer-Policy configurados.

**Impacto:** Vulnerabilidades de XSS, clickjacking, e data leakage não são mitigadas em nível de servidor.

**Solução:**
- Adicionar módulo `nuxt-security` (ou configurar headers manualmente via `routeRules` no `nuxt.config.ts`)
- CSP mínimo: `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' *.supabase.co`

---

#### GAP-17 — Sem logs de auditoria para ações sensíveis

**Problema:** Ações como deletar lead, alterar configurações da org, convidar/remover membros não são registradas em lugar algum.

**Impacto:** Impossível investigar incidentes ("quem deletou aquele lead?", "quando mudou o plano?").

**Solução:**
- Criar tabela `audit_log` (`id`, `org_id`, `user_id`, `action`, `resource_type`, `resource_id`, `payload jsonb`, `ip`, `created_at`)
- Inserir via service role nos endpoints que modificam dados sensíveis
- Expor na página de configurações (apenas owner)

---

#### GAP-18 — Sem mecanismo de backup / restore de dados

**Problema:** Não há instrução de backup. O Supabase free tier tem backups diários, mas sem processo documentado para restore ou exportação da base completa por org.

**Solução:**
- Documentar processo de pg_dump via Supabase CLI
- Adicionar endpoint `GET /api/export/full` (owner only) que exporta todos os dados da org em JSON para download

---

### 3.4 Gaps de Produto / UX

---

#### GAP-19 — Sem mobile responsiveness verificada

**Problema:** A maioria das páginas usa grids e layouts que parecem desktop-first. Vendedores frequentemente precisam registrar atividades no celular durante ou após ligações.

**Solução:**
- Auditar e adaptar `pipeline.vue` e `followup.vue` para mobile (breakpoints `sm:`)
- O cockpit (`dashboard/index.vue`) é o mais crítico para mobile (quick entry após ligação)
- Considerar PWA (`@vite-pwa/nuxt`) para instalação na tela inicial

---

#### GAP-20 — Sem busca global

**Problema:** A busca de leads existe apenas na página de pipeline. Não há busca cross-module (buscar um lead pelo nome e ver seus follow-ups e histórico).

**Solução:**
- Adicionar barra de busca global no layout do dashboard
- Endpoint `GET /api/search?q=` com full-text search do Supabase (`to_tsvector`)
- Retornar resultados agrupados por tipo (leads, diary entries)

---

#### GAP-21 — Sem feedback visual em operações assíncronas no kanban

**Problema:** No `KanbanBoard.vue`, ao mover um card (drag-and-drop), a atualização do status dispara um PATCH. Se falhar, o card volta à posição original (rollback implementado no composable), mas o usuário não vê nenhuma mensagem de erro.

**Solução:**
- Adicionar toast de erro explícito nos callbacks de falha do `patchStatus()`
- O sistema de toast já existe no CSS (`main.css`), mas precisa ser wired ao composable

---

#### GAP-22 — Diário não diferencia entradas por vendedor no cockpit

**Problema:** A visão do cockpit agrega todos os registros do diário da org. Um gestor não consegue ver o breakdown por vendedor no dashboard principal.

**Solução:**
- Adicionar seletor de vendedor no cockpit (dropdown, visível apenas para owner/admin)
- Passar `user_id` como filtro opcional na query do diário

---

## 4. Mapa de Prioridades

| Prioridade | Gap | Esforço | Impacto |
|---|---|---|---|
| P0 — Bloqueante | GAP-01 (onboarding pós-convite) | Médio | Crítico — sem isso membros não entram |
| P0 — Bloqueante | GAP-03 (webhook WhatsApp) | Alto | Crítico — feature anunciada não funciona |
| P0 — Segurança | GAP-02 (rate limit em produção) | Baixo | Alto — risco de abuso |
| P1 — Core UX | GAP-06 (histórico de atividades) | Médio | Alto — CRM sem histórico é incompleto |
| P1 — Core UX | GAP-07 (gestão de membros) | Médio | Alto — admin não consegue gerenciar equipe |
| P1 — Core UX | GAP-05 (paginação) | Baixo | Alto — performance com dados reais |
| P2 — Produto | GAP-08 (notificações follow-up) | Médio | Alto — reduz churn de leads |
| P2 — Produto | GAP-09 (relatórios) | Alto | Alto — retenção de gestores |
| P2 — Produto | GAP-10 (campos de lead) | Baixo | Médio — qualificação de base |
| P2 — Produto | GAP-04 (deduplicação) | Baixo | Médio — qualidade de dados |
| P3 — Técnico | GAP-13 (testes) | Alto | Médio — CI/CD confiável |
| P3 — Técnico | GAP-16 (CSP/headers) | Baixo | Médio — hardening de segurança |
| P3 — Técnico | GAP-14 (erros padronizados) | Baixo | Médio — manutenibilidade |
| P3 — Técnico | GAP-17 (audit log) | Médio | Médio — compliance e debug |
| P4 — Futuro | GAP-11 (documentos) | Médio | Médio |
| P4 — Futuro | GAP-12 (integração email) | Alto | Médio |
| P4 — Futuro | GAP-19 (mobile) | Médio | Alto |
| P4 — Futuro | GAP-20 (busca global) | Médio | Médio |
| P4 — Futuro | GAP-21 (feedback kanban) | Baixo | Baixo |
| P4 — Futuro | GAP-22 (diário por vendedor) | Baixo | Médio |
| P4 — Futuro | GAP-18 (backup/export) | Baixo | Médio |
| P4 — Futuro | GAP-15 (cache tenant) | Baixo | Baixo |

---

## 5. Pontos Fortes do Projeto

- **Arquitetura multi-tenant bem implementada:** RLS com JWT customizado é a abordagem correta e escalável. Poucos projetos acertam isso na primeira iteração.
- **Matemática de vendas é o diferencial real:** `useOutboundMath.ts` com cálculo reverso (meta → ligações/dia) é genuinamente útil para BDRs. Isso não existe na maioria dos CRMs genéricos.
- **Protocolo de follow-up com 10 slots:** A cadência automática de follow-ups com previsão de carga de 7 dias é funcionalidade sólida e diferenciada.
- **Stack enxuta e moderna:** Nuxt 3 + Supabase + Tailwind é uma escolha excelente para um SaaS de pequeno porte — deploy simples, custo baixo, tipagem forte.
- **White-label bem estruturado:** CSS vars com HSL para tema dinâmico é elegante. A resolução de tenant por subdomínio/domínio customizado está correta.
- **Código limpo e consistente:** Composables bem separados, tipos definidos em `types/index.ts`, validação com Zod nos endpoints.

---

## 6. Recomendações Estratégicas

### Curto prazo (próximas 2 semanas)

1. Resolver GAP-01 (convite de membros) — é o que trava a adoção em equipe
2. Resolver GAP-02 (rate limit) antes de qualquer lançamento público
3. Adicionar testes nos composables de matemática e leads (baixo esforço, alto retorno)

### Médio prazo (próximo mês)

4. Implementar GAP-06 (histórico de atividades) — eleva o produto de "lista de leads" para CRM de verdade
5. Implementar GAP-07 (gestão de membros) — necessário para uso empresarial
6. Decidir sobre GAP-03 (WhatsApp): implementar ou remover da documentação para não gerar expectativa falsa

### Longo prazo

7. GAP-09 (relatórios) como diferencial de retenção para gestores
8. GAP-19 (mobile/PWA) para aumentar adoção de vendedores de campo
9. GAP-12 (email) apenas se o mercado-alvo exigir (B2B enterprise)

---

*Fim da análise. Total de 22 gaps identificados: 3 críticos/bloqueantes, 8 funcionais, 6 técnicos, 5 de UX/produto.*
