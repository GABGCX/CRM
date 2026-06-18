# Plano do Dark Mode (fazer certo, uma vez so)

## Diagnostico - por que sempre "refez"
- **609 cores fixas (hex)** em 23 arquivos `.vue` (+ ~39 `rgba()`). As correcoes anteriores foram caca a caca - apagar incendio nas que apareciam. Com 609 espalhadas, isso **nunca fecha**.
- **Paleta escura mal calibrada**: `--text-3` (#45403a) sobre `--bg` (#131210) tem contraste baixissimo - texto some. Parece "feio/quebrado" mesmo nas partes tokenizadas.
- **Cores semanticas hardcoded**: verdes/ambar/vermelho (#16a34a, #f0fdf4, #bbf7d0, #dc2626...) ficam bons no claro e **agressivos/errados no escuro** - nao tem variante dark.
- **Override local de token**: `configuracoes.vue` redefine `--bg/--surface/...` com valores claros (some no dark a menos que com override - fragil).
- **Sem trava**: nada impede codigo novo de reintroduzir cor fixa.

## Estrategia (5 pilares)

### 1. Sistema de tokens COMPLETO e semantico
Hoje so temos surface/text/border + sidebar. Faltam os que mais quebram. Adicionar:
- **Superficies:** `--bg`, `--bg-card`, `--bg-subtle`, `--bg-input`, **`--bg-elevated`** (modais/drawer/popover - hoje viram #fff fixo).
- **Acento:** `--accent` (fundo de botao), **`--accent-text`** (links/icones; no dark precisa ser indigo mais claro pra ler), `--accent-soft` (fundo tintado).
- **Semanticos (a peca-chave) - cada um com trio cor/fundo/borda:**
  - `--ok` / `--ok-bg` / `--ok-bd` (verde)
  - `--warn` / `--warn-bg` / `--warn-bd` (ambar)
  - `--bad` / `--bad-bg` / `--bad-bd` (vermelho)
  - `--info` / `--info-bg` / `--info-bd` (azul)
  No dark, os `-bg` viram **rgba translucido** sobre o fundo escuro e a cor vira um tom mais claro. Isso e o que faz o dark parar de ser agressivo.

### 2. Recalibrar a paleta escura (qualidade/contraste)
Proposta (warm-neutral, casa com ink/paper/cobalt da marca):

| Token | Claro | Escuro (novo) |
|---|---|---|
| --bg | #f9f6ef | #14110d |
| --bg-card | #ffffff | #1e1a15 |
| --bg-subtle | #f0ebe0 | #221c16 |
| --bg-input | #ffffff | #1a1611 |
| --bg-elevated | #ffffff | #2a241c |
| --text-1 | #282828 | #ece7dd |
| --text-2 | #6a6258 | #a89e8e |
| --text-3 | #9a9183 | #6f675b  (legivel, nao #45403a) |
| --border | #e2ddd5 | #322c24 |
| --border-soft | #ede8de | #262019 |
| --accent | #193497 | #193497 (botao + texto branco) |
| --accent-text | #193497 | #7e9bff (links/icones no dark) |
| --ok / bg / bd | #16a34a / #f0fdf4 / #bbf7d0 | #4ade80 / rgba(22,163,74,.16) / rgba(22,163,74,.35) |
| --warn / bg / bd | #d97706 / #fffbeb / #fde68a | #fbbf24 / rgba(217,119,6,.16) / rgba(217,119,6,.35) |
| --bad / bg / bd | #dc2626 / #fef2f2 / #fecaca | #f87171 / rgba(220,38,38,.16) / rgba(220,38,38,.35) |
| --info / bg / bd | #2563eb / #eff6ff / #bfdbfe | #93b4ff / rgba(37,99,235,.18) / rgba(37,99,235,.4) |

### 3. Migracao sistematica (dirigida pelo inventario, nao por adivinhacao)
Ordem por trafego: `pipeline` (64) -> `index` (43) -> `followup` (35) + `FuSection` (55) -> `configuracoes` (83, e remover o override local) -> `diario` (29) -> `matematica` (19) -> `relatorios` (46) -> `gestao` (36) -> `GlobalSearch/ImportLeadsModal/LeadRow/CadenceManager/Onboarding` -> `login/register`.

**Cheatsheet hex -> token** (o que torna mecanico):
- `#fff` (superficie) -> `var(--bg-card)`  |  `#fff` (texto sobre botao accent) -> **manter**
- `#f9f6ef` -> `var(--bg-subtle)`
- `#f1f5f9` -> `var(--border-soft)` (borda) ou `var(--bg-subtle)` (fundo)
- `#e2e8f0` -> `var(--border)`
- `#282828`/`#0f172a` -> `var(--text-1)`
- `#475569`/`#64748b` -> `var(--text-2)`
- `#94a3b8`/`#cbd5e1` -> `var(--text-3)`
- `#16a34a`+`#f0fdf4`+`#bbf7d0` -> `var(--ok)`/`--ok-bg`/`--ok-bd`
- `#dc2626`+`#fef2f2`+`#fecaca` -> `var(--bad)`/`--bad-bg`/`--bad-bd`
- `#d97706`/`#f59e0b`+`#fffbeb`+`#fde68a` -> `var(--warn)`/...
- `#193497` (texto/link) -> `var(--accent-text)`  |  (fundo de botao) -> `var(--accent)`

**Como nao levar 3 dias:** codemod guiado - um script aplica as substituicoes recorrentes seguras (superficies/bordas/textos) em massa; depois passada manual so nas semanticas e nos casos especiais (branco-sobre-accent, sombras `rgba(0,0,0,...)`, gradientes). Os ~70% mecanicos saem no script; os ~30% de julgamento na mao.

### 4. Casos especiais (tratar explicito, nao no automatico)
- **Graficos/SVG** (relatorios: sparkline, donut, funil; gestao): cores fixas no markup. Definir tokens de chart (`--chart-1..n`) com variante dark, ou usar `currentColor`/var nos SVGs.
- **Tags** (`TagChip`): cor vem do `tag.color` (hex do usuario) com bg em opacidade - **ja adapta**; so validar legibilidade no dark.
- **Classes `.tag-*`** em `main.css`: conferir/completar as variantes dark de cada cor.
- **Sombras** `rgba(0,0,0,...)`: no dark ficam invisiveis; trocar por borda ou sombra mais forte/clara onde precisar de elevacao.
- **Sidebar** (`--sb-*`): ja tem variante dark, ok.
- **`configuracoes.vue`**: remover o bloco que redefine tokens localmente; usar os globais.

### 5. Trava anti-regressao (pra nao apodrecer de novo)
- Script `scripts/check-hardcoded-colors.cjs`: varre `components/` e `pages/`, falha se achar hex fora de uma allowlist (ex: definicao de token em main.css, cores de marca). Rodar no `npm run lint`/precommit/CI.
- Assim, codigo novo que meta `#fff` quebra o check - o dark nunca mais "desfaz sozinho".

## Criterio de "certo" (testavel - se bater, esta pronto; se nao, ai sim removemos)
1. Toda pagina **legivel** no escuro (texto, bordas, contraste >= AA nos textos principais).
2. **Nenhuma** superficie clara vazando (sem caixa branca no escuro).
3. Cores de status/feedback **suaves** no dark (tintado translucido, nao bloco saturado).
4. `check-hardcoded-colors` retorna **0** ocorrencias fora da allowlist.
5. Toggle alterna sem flash e persiste.

## Execucao amanha (ordem)
1. Escrever a paleta completa (tokens semanticos + recalibrados) em `main.css` - light e `[data-theme=dark]`.
2. Rodar o codemod das substituicoes seguras + revisar.
3. Passada manual: semanticas, SVGs/charts, sombras, `configuracoes` (tirar override), modais (`--bg-elevated`).
4. Criar a trava `check-hardcoded-colors`.
5. Validar pagina a pagina no dark (checklist) + `npm run build`/typecheck.
6. Branch -> Preview na Vercel -> revisar no escuro -> merge.

## Se nao for pra dar certo
A saida de remover e barata e fica documentada: forcar `data-theme=light` sempre + esconder o toggle (1 linha no `useDarkMode` + `v-if` no layout). Mas com tokens semanticos + recalibragem + trava, a aposta e que **da certo e fica**.
