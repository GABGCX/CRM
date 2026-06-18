# Bateria de QA - Prospecta CRM (pre-deploy)

> ## Rodada automatizada (verificada por codigo)
> Data: 2026-06-11. Itens abaixo foram **executados/auditados** automaticamente:
> - **Build de producao** (`npm run build`): PASSOU (client + server, `.output` gerado, sem erros; so warnings de auto-import duplicado de leadScore - inofensivos).
> - **Typecheck** (`nuxt typecheck`): PASSOU (0 erros).
> - **Testes unitarios** (`vitest`): PASSOU (20/20). Corrigi nesta rodada: `vitest.config.ts` (URL invalida que impedia rodar) + `tests/setup.ts` (globais do Vue pros composables).
> - **Migrations**: 14 presentes, incluindo tags, bdr_goals, management_notes, profiles_read_policy.
> - **Env vars**: as 5 chaves presentes no `.env`.
> - **Endpoints**: management (team, bdr/[id], goals get/post, assign, notes) e tags (CRUD) existem.
> - **Permissoes/Multi-tenancy (servidor)**: todos os 7 endpoints de management exigem `owner/admin` e filtram por `orgId` do chamador; tags via `requireOrg`; leads escopados por org. Sem vazamento entre orgs no servidor.
> - **Fixes !! confirmados no codigo**: tag_ids fora do saveLead, sanitize do novo lead, webfont Tabler, policy de profiles, gate do sidebar/middleware, reload de profile no auth.
>
> **NAO executado aqui (exige navegador logado na sua org / nao tenho automacao de browser nem acesso ao banco de prod):** tudo que e interativo/visual - drag-drop, render do dark mode, responsivo, cross-browser, e os round-trips reais de dados (criar/salvar/etiquetar de ponta a ponta). Faca esses manualmente; o checklist abaixo guia.


Marque cada item. Foque primeiro no **Smoke test** e em **Permissoes/Multi-tenancy** (sao os que mais doem em producao). Itens marcados com `!!` sao pontos que ja quebraram ou sao frageis.

---

## 0. Pre-requisitos de ambiente

- [x] `npm run build` conclui sem erro  _(rodada automatizada 2026-06-11)_
- [x] `npx nuxt typecheck` sem erros  _(0 erros)_
- [x] Testes unitarios (`vitest`) passam  _(20/20; corrigido vitest.config + tests/setup)_
- [x] Variaveis presentes  _(5/5 no `.env` local; **confirmar no host de deploy**)_
- [x] `!!` Migrations aplicadas  _(voce confirmou aplicar todas; 14 arquivos presentes)_
- [x] `!!` Politica de leitura de `profiles` ativa  _(confirmado funcionando)_
- [ ] Fontes (Geist, Tabler icons) carregam **em producao** (CSP `font-src 'self'`) _(bundladas no build; validar no host)_
- [ ] Sem erros vermelhos no console do navegador nas paginas principais _(manual)_

---

## 1. Smoke test (caminho feliz, ~5 min)

- [ ] Cadastrar nova org em `/register` cria org + owner e entra logado
- [ ] Rodape do menu mostra o **nome** (nao "Usuario") e a saudacao mostra o nome (nao "BDR")
- [ ] Criar um lead no Pipeline (com Cadencia = "Nenhuma") salva sem erro `!!`
- [ ] Mover um card no Kanban muda o status (sem erro no console)
- [ ] Abrir o lead no drawer, editar um campo e Salvar persiste
- [ ] Registrar um dia em Inicio (CE/RM/RR/FR) salva
- [ ] Logout volta pro login; acessar `/dashboard` deslogado redireciona pro login

---

## 2. Permissoes e Multi-tenancy (CRITICO)

> _Logica auditada no codigo na rodada automatizada: os 7 endpoints de management exigem `owner/admin` e filtram por `orgId`; tags/leads escopados por org; middleware protege `/gestao` e `/configuracoes`; sidebar gateia por papel. Os itens abaixo confirmam o **comportamento logado** - ainda manuais._

- [ ] `!!` Logado como **BDR**: nao aparece "Gestao" nem "Configuracoes" no menu
- [ ] `!!` BDR acessando `/dashboard/gestao` direto na URL e redirecionado pro dashboard
- [ ] `!!` BDR acessando `/dashboard/configuracoes` direto e redirecionado
- [ ] Owner e Admin veem "Gestao" e "Configuracoes"
- [ ] `!!` Isolamento entre orgs: criar 2 orgs distintas, confirmar que leads/diario/etiquetas/equipe de uma **nao** aparecem na outra
- [ ] Convidar membro (Config > Equipe) e o convidado entra na **mesma** org
- [ ] Mudar papel de um membro (bdr <-> admin) reflete nas permissoes apos novo login

---

## 3. Autenticacao

- [ ] Login com credenciais validas
- [ ] Login com senha errada mostra erro
- [ ] "Esqueci a senha" envia email de recuperacao
- [ ] Sessao persiste ao recarregar (nao desloga sozinho)
- [ ] Onboarding / completar perfil (se aplicavel ao seu fluxo de convite)

---

## 4. Inicio (cockpit)

- [ ] "Foco agora" muda conforme o estado (vencidos > hoje > ritmo > lead quente > tudo em dia)
- [ ] Card "Lead mais quente" leva ao lead no pipeline
- [ ] Secao "Hoje": quick entry salva (botao e Ctrl+S), mostra "Salvo"
- [ ] Secao "Este mes": KPIs, barras de ritmo e sparkline batem com o diario
- [ ] Follow-ups hoje lista os retornos urgentes; "Ver todos" leva ao Follow-up
- [ ] Filtro por usuario (owner/admin) muda os numeros

---

## 5. Pipeline

### Visualizacao e filtros
- [ ] `!!` Kanban e a view padrao e renderiza as colunas com os cards nas colunas certas
- [ ] Alternar Kanban <-> Lista funciona
- [ ] Busca filtra (nome/empresa/telefone)
- [ ] Lista: filtro de status e ordenacao (recentes, retorno, FU, score)
- [ ] `!!` Filtro por etiqueta funciona em Kanban e Lista
- [ ] Drag-and-drop de card muda status sem erro no console
- [ ] Resumo de valor aparece quando ha leads com valor estimado

### Drawer de detalhe
- [ ] Clicar em card/linha abre o drawer deslizante
- [ ] Fecha no X, no Esc e no clique fora
- [ ] Editar campos + "Salvar alteracoes" persiste `!!` (incluindo apos a feature de tags)
- [ ] Funil de estagio reflete o status
- [ ] Abas FU / Notas / Historico carregam e funcionam (marcar FU, criar/excluir nota, ver eventos)
- [ ] Templates: selecionar preenche o preview e "Copiar" copia
- [ ] Mover status para Recusado/Sem interesse abre o modal de motivo de perda
- [ ] Excluir lead remove e fecha o drawer

### Novo lead
- [ ] `!!` Criar com so o Decisor (minimo) salva
- [ ] `!!` Criar com Cadencia "Nenhuma" / Fonte/Porte vazios salva (sem "Invalid uuid")
- [ ] Criar com todos os campos + dados adicionais (ICP) salva
- [ ] Telefone duplicado mostra erro com link "Ver lead existente"
- [ ] Sugerir data de retorno (+2d) preenche

### Import/Export
- [ ] Exportar CSV baixa o arquivo com os leads
- [ ] Importar CSV cria os leads e atualiza a lista

### Customizar card
- [ ] `!!` Botao "Card" liga/desliga campos (empresa, valor, retorno, score, FU, etiquetas)
- [ ] A escolha reflete no Kanban **e** na Lista
- [ ] A preferencia persiste ao recarregar (localStorage)

---

## 6. Etiquetas

- [ ] `!!` No drawer do lead: criar etiqueta nova (nome + cor) e aplicar
- [ ] Aplicar/remover etiqueta salva **na hora** (sem clicar em Salvar) e reflete no card
- [ ] Chips coloridos aparecem no Kanban e na Lista
- [ ] Config > Prospeccao > Etiquetas: renomear, trocar cor, excluir
- [ ] Excluir etiqueta nao quebra leads que a usavam (some dos cards)

---

## 7. Follow-up

- [ ] Fila agrupa Vencidos / Hoje / Proximos 3 dias
- [ ] Auto-seleciona o primeiro da fila; clicar troca o painel
- [ ] Painel: Ligar / WhatsApp, proximo passo da cadencia, tracker de FU
- [ ] Marcar tentativa de FU atualiza os pontos
- [ ] Reagendar retorno (+2/+4/+7 ou data) salva
- [ ] Mudar status salva
- [ ] Adicionar nota aparece na lista
- [ ] "Proximo na fila" avanca
- [ ] `!!` Barra "Registrar dia" (CE/RM/RR/FR +/-) salva e sincroniza com Inicio/Meu Dia
- [ ] Aba "Todos" lista leads ativos; aba "Previsao" mostra a carga 7 dias
- [ ] Estado vazio "Tudo em dia" quando nao ha pendencia

---

## 8. Meu Dia (diario)

- [ ] Steppers +/- editam CE/RM/RR/FR; barra de progresso vs meta diaria
- [ ] Salvar dia persiste; editar um dia passado (date picker) funciona
- [ ] Navegar entre meses (anterior/proximo/mes atual)
- [ ] Tabela historico lista os dias com tag de desempenho e total no rodape

---

## 9. Metas e Ritmo

- [ ] Editar meta de faturamento e ticket recalcula os numeros de ouro em tempo real
- [ ] Funil horizontal (Meta > Fechamentos > RR > RM > CE > Ligacoes) com /dia
- [ ] Taxas reais coloridas vs benchmark
- [ ] Gargalo identificado muda conforme os dados
- [ ] Previsao de receita (pipeline total / quente / vs meta)

---

## 10. Relatorios

- [ ] Filtro de periodo (3/6/12 meses) e por usuario (owner/admin)
- [ ] Funil por mes, donut de status, evolucao de CE
- [ ] Motivos de perda aparecem quando ha leads recusados com motivo
- [ ] Estado "Sem dados" quando vazio

---

## 11. Configuracoes

- [ ] Abas (Conta & Marca / Prospeccao / Equipe) trocam o conteudo
- [ ] Metas e nome da org salvam
- [ ] Tema/marca: cor, logo, favicon, nome do produto aplicam (preview + apos salvar)
- [ ] Dominio customizado salva
- [ ] Cadencias: criar/editar/excluir (e os passos)
- [ ] Templates de mensagem: criar/editar/excluir, tag de canal
- [ ] Etiquetas: CRUD (ver secao 6)
- [ ] Equipe: convidar, mudar papel, remover membro
- [ ] Exportar dados (owner) baixa o JSON
- [ ] Log de auditoria (owner) lista acoes

---

## 12. Gestao (owner/admin)

- [ ] Painel da equipe: numeros por BDR batem com o diario/leads reais
- [ ] Taxas coloridas, coluna de ritmo, previsao ponderada, alertas
- [ ] Ordenacao por desempenho (ranking)
- [ ] Clicar num BDR abre o drilldown
- [ ] Drilldown: totais, gargalo, leads do BDR
- [ ] `!!` Salvar meta individual do BDR persiste (precisa da migration bdr_goals)
- [ ] `!!` Reatribuir lead ("Mover...") muda o dono e tira da lista
- [ ] `!!` Adicionar nota de coaching salva (precisa da migration management_notes)

---

## 13. Dark mode

- [ ] Toggle no menu alterna e persiste ao recarregar
- [ ] Telas principais (Inicio, Pipeline, Kanban, Follow-up, Meu Dia, Metas, Config, Gestao) ficam legiveis no escuro
- [ ] Anotar telas com cores claras residuais (Relatorios/graficos e alguns modais podem ter pontos a ajustar)

---

## 14. Sidebar / navegacao

- [ ] Recolher/expandir o menu persiste
- [ ] `!!` Icones aparecem tanto expandido quanto recolhido (Tabler font)
- [ ] Badge de vencidos aparece em Pipeline/Follow-up; ponto pulsante quando recolhido
- [ ] Busca global (Ctrl+K) abre e leva ao lead

---

## 15. Responsivo e cross-browser

- [ ] Layout em mobile/tablet (sidebar, grids, tabelas com scroll)
- [ ] Chrome, Firefox e Safari
- [ ] Drawer e modais nao estouram a tela em telas pequenas

---

## 16. Edge cases / robustez

- [ ] Org nova sem nenhum dado: cada pagina mostra estado vazio (nao quebra)
- [ ] Textos longos (nomes/empresas) truncam sem quebrar layout
- [ ] Numeros grandes em valor/forecast formatam certo
- [ ] Caracteres especiais e acentos em nomes/notas
- [ ] Recarregar (F5) em qualquer rota interna nao perde a sessao nem quebra

---

## Observacoes conhecidas (nao bloqueantes)
- Dark mode: superficies das paginas principais convertidas; restam cores fixas em telas secundarias (relatorios/charts, alguns modais internos).
- Tipos do banco (`types/database.ts`): apos rodar as migrations, opcional `npm run db:types` pra regenerar 100% fiel.
