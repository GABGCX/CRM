# Relatorios: analise de BI e plano de evolucao

Analise da pagina de Relatorios sob a otica de Business Intelligence, aplicada ao
contexto deste CRM: prospeccao outbound B2B com funil LD -> CE -> RM -> RR -> FR e
benchmarks ja definidos em `useOutboundMath`. O objetivo e sair de uma pagina que
"mostra numeros" para uma que "responde perguntas de negocio e indica acao".

---

## 1. Resumo executivo

A pagina hoje entrega o basico (4 KPIs, funil por mes, status, motivos de perda,
CE por mes, volume por agendamento). E um bom ponto de partida, mas tem tres
limitacoes estruturais de BI:

1. **Falta contexto comparativo.** Os numeros aparecem sozinhos. Em BI, todo numero
   precisa de uma referencia: vs meta, vs periodo anterior, vs benchmark. Sem isso o
   usuario nao sabe se "37 CE" e bom ou ruim.
2. **Mistura snapshot com fluxo.** O funil e por periodo (fluxo de eventos diarios),
   mas o donut de status e os motivos de perda sao snapshot do estado atual e ignoram
   o filtro de periodo. Isso confunde a leitura.
3. **So indicadores de resultado (lagging), pouco de esforco (leading).** O outbound
   se gerencia pelos indicadores de entrada (ligacoes, contatos, follow-ups) porque
   eles antecipam o resultado. Hoje o LD nem aparece no funil.

O plano abaixo corrige isso e adiciona analises comparativas, de ritmo, de coorte,
de segmentacao e de produtividade.

---

## 2. Estado atual (o que existe)

| Bloco | O que mostra | Fonte | Observacao critica |
|---|---|---|---|
| Filtro de periodo | 3/6/12 meses + intervalo livre por dia | `daily_diary` | OK (recem-implementado) |
| 4 KPIs | CE, RM, RR, FR do periodo + taxas CE->RM e RR->FR | `daily_diary` | Sem comparacao com periodo anterior nem meta |
| Volume por agendamento | Ligacoes/CE por RM (meta vs real) | benchmarks + funil | So CE real; falta LD real e follow-ups |
| Funil por mes | Barras CE > RM > RR > FR por mes | `daily_diary` | **Comeca no CE: falta LD (topo do funil)** |
| Leads por status | Donut do status atual | `leads` (snapshot) | **Ignora o periodo; e estado atual, nao fluxo** |
| Motivos de perda | Barras de motivo | `leads` (snapshot) | **Ignora o periodo; sem tendencia** |
| CE por mes | Linha de evolucao do CE | `daily_diary` | So CE; poderia ser multi-serie |

---

## 3. Principios de BI aplicados

- **Leading vs lagging.** LD, CE e atividades sao indicadores de esforco (controlaveis
  hoje); RR e FR e receita sao resultado (consequencia). Um bom painel de outbound
  destaca os leading porque sao acionaveis no presente.
- **Todo numero com contexto.** Tres referencias: vs **meta** (do org settings), vs
  **periodo anterior** (delta %), vs **benchmark** (taxas de mercado).
- **Tres lentes diferentes, nao misturar:**
  - *Fluxo* (eventos no periodo: quantos CE/RM aconteceram) -> `daily_diary` e `lead_events`.
  - *Snapshot* (estado atual: quantos leads em cada coluna agora) -> `leads`.
  - *Coorte* (leads que ENTRARAM no periodo X e o que aconteceu com eles) -> `leads.created_at` + eventos.
- **Drill-down.** Clicar num segmento do grafico deve abrir a lista de leads daquele
  recorte. Relatorio que nao deixa investigar vira enfeite.
- **Higiene de dado e pre-requisito.** Varias analises de segmentacao dependem de
  campos preenchidos (fonte, segmento, porte). Vale medir o % de preenchimento.

---

## 4. Inventario de dados disponiveis

O que ja temos pronto pra explorar (sem capturar nada novo):

- **`daily_diary`** (por usuario, por dia): `ld, ce, rm, rr, fr`. Base de todo indicador
  de atividade e do funil temporal.
- **`leads`**: `resultado` (estagio atual), `valor_estimado`, `created_at`,
  `data_retorno`, `fonte`, `segmento`, `cidade`, `estado`, `porte`, `tag_ids`,
  `custom_fields`, `num_vendedores`, `cadence_id`, `motivo_perda`, `reuniao_agendada`.
- **`followups`**: `attempt_index` (0..9), `completed_at`. Protocolo de 10 tentativas.
- **`lead_events`**: `type` (`created`, `status_change`, `field_update`, `followup`,
  `note`, `activity`), `payload` (ex: status_change tem `{from, to}`), `created_at`.
  Permite **tempo em estagio**, **velocidade do funil** e **timing de atividade**.
- **`monthly_summary`** (view): agregados mensais (inclui `total_ld`).
- **`OUTBOUND_BENCHMARKS`**: TX_LD_CE 45%, TX_CE_RM 2.7%, TX_RM_RR 40%, TX_RR_FR 40%.
- **Org settings**: `meta_mensal`, `ticket_medio` (geram as metas calculadas).
- **`cadences` / `cadence_steps`**: sequencia por lead.

Lacunas conhecidas (precisariam de captura ou backfill):
- Timing por hora do dia de ligacao depende de eventos com timestamp confiavel
  (temos `lead_events.created_at` para `activity`, mas o `daily_diary` e so contagem
  diaria, sem hora).
- Custo por lead / canal nao existe (nao ha campo de custo).

---

## 5. Catalogo de melhorias (por categoria)

Cada item: **o que**, **por que (BI)**, **dado**, **grafico**, **esforco**.

### 5.1 Funil e conversao

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Incluir LD no funil** (LD -> CE -> RM -> RR -> FR) | O topo do funil e onde se age; sem LD nao da pra ver eficiencia de discagem | `daily_diary.ld` | Funil/barras com 5 etapas | Baixo |
| **Taxas de conversao por etapa com semaforo** | Comparar cada taxa ao benchmark e cor (verde/ambar/vermelho) aponta o gargalo | funil + benchmarks | Rotulos % entre etapas | Baixo |
| **Funil visual de verdade** (largura por volume) | Funil afunilado comunica perda entre etapas melhor que barras | mesmo | Funnel chart (trapezios SVG) | Medio |
| **Velocidade do funil / ciclo de venda** | Quanto tempo um lead leva de criado ate fechado e entre estagios; revela travas | `lead_events.status_change` (timestamps) | Barras de dias medios por transicao | Alto |
| **Funil por coorte** | "Dos leads criados em maio, quantos viraram RM/FR" e mais honesto que somar fluxo de periodos | `leads.created_at` + eventos | Tabela de coorte (mes x etapa %) | Alto |

### 5.2 Tendencia e tempo

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Comparacao com periodo anterior** (delta % nos KPIs) | Saber se melhorou ou piorou e a pergunta numero 1 | `daily_diary` (2 ranges) | Setas/deltas + sparkline no card | Medio |
| **Granularidade dia/semana/mes** automatica | Periodo curto pede barras diarias; longo pede mensais | `daily_diary.date` | Toggle de bucket | Medio |
| **Tendencia multi-serie de atividade** | Ver LD, CE, RM juntos ao longo do tempo expoe correlacao esforco->resultado | `daily_diary` | Linhas multiplas ou area empilhada | Medio |
| **Media movel 7 dias** | Suaviza o ruido diario e mostra a real direcao | `daily_diary` | Linha sobreposta | Baixo |
| **Ritmo de meta (pacing)** | Acumulado real vs acumulado da meta no mes responde "vou bater a meta?" | diary + settings | Linha real vs linha alvo | Medio |

### 5.3 Comparacoes e segmentacao

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Comparativo por BDR** (no relatorio, nao so na gestao) | Identificar quem puxa e quem precisa de apoio; benchmark interno | `daily_diary.user_id` | Barras agrupadas / small multiples | Medio |
| **Conversao por fonte** (cold call vs linkedin vs indicacao) | Decide onde investir esforco: qual canal gera mais RM/FR | `leads.fonte` + status | Barras de taxa por fonte | Medio |
| **Performance por segmento/porte/UF** | Onde o ICP converte melhor; foca prospeccao | `leads.segmento/porte/estado` | Barras/heatmap | Medio |
| **Performance por etiqueta e por cadencia** | Qual cadencia/etiqueta rende melhor RM | `leads.tag_ids/cadence_id` | Barras comparativas | Medio |
| **Comparacao real vs benchmark de mercado** | Saber se a operacao esta dentro do padrao outbound | benchmarks | Barras lado a lado | Baixo |

### 5.4 Receita e pipeline

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Atingimento de meta de receita** | A pergunta do dono: quanto do alvo ja foi/sera feito | `leads.valor_estimado` (fechados) + meta | Gauge/bullet de progresso | Baixo |
| **Previsao ponderada vs meta** | Forecast realista combinando valor x probabilidade do estagio | valor + `STAGE_PROBABILITY` | Barra/linha forecast vs meta | Baixo |
| **Pipeline ao longo do tempo** | Pipeline esta crescendo ou secando? | snapshot historico (precisa capturar) | Area/linha | Alto |
| **Ticket medio real vs configurado** | Valida se a premissa de ticket esta certa | valor dos fechados | Numero + comparacao | Baixo |
| **Movimentacao do pipeline (waterfall)** | Quanto entrou, avancou, ganhou e perdeu no periodo | `lead_events.status_change` | Grafico de cascata | Alto |

### 5.5 Produtividade e atividade (leading)

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Ligacoes/dia vs meta** | Indicador leading mais acionavel; se cai, o resultado cai depois | `daily_diary.ld` + `ldPerDay` | Barras com linha de meta | Baixo |
| **Taxa de contato efetivo (CE/LD) ao longo do tempo** | Mede qualidade da discagem e da lista | diary | Linha de % | Baixo |
| **Curva de drop-off dos follow-ups** | "44% desistem na 1a tentativa": mostrar onde a equipe para revela disciplina | `followups.attempt_index/completed_at` | Barras decrescentes por tentativa | Medio |
| **Heatmap de atividade (dia da semana x volume)** | Quando a equipe mais produz; ajusta rotina | `daily_diary.date` (dia da semana) | Heatmap | Medio |
| **Dias trabalhados vs dias uteis** | Consistencia de execucao no mes | diary | Calendario/strip | Baixo |

### 5.6 Qualidade de lead e perdas

| Melhoria | Por que | Dado | Grafico | Esforco |
|---|---|---|---|---|
| **Motivos de perda com periodo e tendencia** | Hoje e all-time; ver a evolucao revela problema novo surgindo | `leads` + `lead_events` | Barras + linha de tendencia | Medio |
| **Taxa de perda e onde se perde** | Em que estagio os leads morrem mais | `lead_events.status_change` para status de perda | Barras por estagio de saida | Medio |
| **Envelhecimento de leads (aging)** | Leads parados ha X dias sao receita travada | `data_retorno`/`updated_at` | Histograma de idade por estagio | Medio |
| **Distribuicao de score** | Qualidade da carteira; foco nos quentes | `leadScore` | Histograma | Baixo |
| **% de preenchimento de campos (higiene)** | Sem dado preenchido, a segmentacao mente | `leads` | Barras de completude | Baixo |

---

## 6. Recomendacoes de tipos de grafico

- **Funnel chart (trapezios):** o funil LD->FR. Comunica perda entre etapas melhor
  que barras horizontais.
- **Combo (barras + linha):** volume (barras) + taxa de conversao (linha) no mesmo eixo
  temporal. Liga esforco a eficiencia.
- **Sparklines nos KPI cards:** mini tendencia + delta vs periodo anterior, sem ocupar espaco.
- **Bullet chart / gauge:** atingimento de meta (real vs alvo vs etapas).
- **Heatmap:** atividade por dia da semana (e por hora, se capturarmos).
- **Waterfall:** movimentacao do pipeline (entrou, avancou, ganhou, perdeu).
- **Tabela de coorte:** conversao por mes de entrada (linhas = mes, colunas = etapa).
- **Small multiples:** o mesmo grafico repetido por BDR para comparacao rapida.
- **Barras agrupadas/empilhadas:** comparacao por fonte/segmento/cadencia.

Evitar: pizza com muitas fatias (o donut atual ja sofre com isso quando ha muitos
status), graficos 3D, e eixos que nao comecam no zero.

---

## 7. Estrutura de pagina proposta

Reorganizar em secoes com proposito claro, de cima (resumo) para baixo (detalhe):

1. **Cabecalho de controle:** periodo (com comparar-com-anterior), granularidade,
   filtro por BDR, filtro por fonte/segmento, botao exportar.
2. **Linha de KPIs com contexto:** CE, RM, RR, FR, receita. Cada um com valor, delta
   vs periodo anterior, vs meta, e sparkline.
3. **Funil completo (LD->FR)** com taxas e semaforo de benchmark, lado a lado com
   **ritmo de meta** (pacing do mes).
4. **Tendencias:** atividade multi-serie + media movel; toggle dia/semana/mes.
5. **Conversao e segmentacao:** por fonte, por cadencia, por segmento (abas ou cards).
6. **Produtividade:** ligacoes/dia vs meta, curva de follow-up, heatmap.
7. **Qualidade e perdas:** motivos de perda (com periodo), aging, score.
8. **Drill-down:** qualquer clique abre a lista de leads filtrada.

---

## 8. Roadmap sugerido (faseado)

**Fase 1 (rapida, alto valor, dados ja existem):**
- LD no funil + taxas com semaforo de benchmark.
- Comparacao com periodo anterior (deltas) nos KPIs.
- Atingimento de meta de receita (gauge) + previsao ponderada vs meta.
- Ligacoes/dia vs meta e taxa CE/LD.
- Corrigir donut e motivos de perda para respeitar o periodo.

**Fase 2 (media):**
- Tendencia multi-serie + media movel + granularidade dia/semana/mes.
- Comparativo por BDR no relatorio.
- Conversao por fonte e por cadencia.
- Curva de drop-off de follow-ups.
- Drill-down (clique -> lista de leads).

**Fase 3 (estrutural):**
- Velocidade do funil e ciclo de venda (a partir de `lead_events`).
- Funil por coorte (tabela mes x etapa).
- Waterfall de pipeline e pipeline historico (exige capturar snapshot diario).
- Heatmap de atividade; aging de leads.
- Exportacao (CSV/PDF) e, se fizer sentido, agendamento de relatorio por email.

---

## 9. Glossario e definicoes (para alinhar o calculo)

- **LD (Ligacoes Discadas):** total de tentativas de ligacao no periodo (`daily_diary.ld`).
- **CE (Contato Efetivo):** decisor atendeu e conversou.
- **RM (Reuniao Marcada):** agendamento confirmado.
- **RR (Reuniao Realizada):** reuniao aconteceu.
- **FR (Fechamento):** contrato assinado.
- **Taxas alvo (benchmark):** LD->CE 45%, CE->RM 2.7%, RM->RR 40%, RR->FR 40%.
- **Volume alvo por agendamento (RM):** ~37 CE e ~82 ligacoes (derivado dos benchmarks).
- **Indicador leading:** LD, CE, atividades (esforco, controlavel agora).
- **Indicador lagging:** RR, FR, receita (resultado, consequencia).
- **Fluxo vs snapshot vs coorte:** ver secao 3. Cada grafico deve declarar qual lente usa.
- **Pacing:** acumulado real ate o dia X vs acumulado proporcional da meta (meta/dias uteis * dias decorridos).

---

## 10. Pre-requisitos e riscos

- **Higiene de dado:** segmentacoes por fonte/segmento/porte so valem se os campos
  estiverem preenchidos. Vale comecar medindo a completude (item 5.6) e, se baixa,
  incentivar o preenchimento (ex: tornar `fonte` sugerida no cadastro).
- **Eventos confiaveis:** velocidade/coorte/waterfall dependem de `lead_events` de
  `status_change` consistentes. Hoje sao gravados no patch; vale validar cobertura.
- **Pipeline historico** exige capturar um snapshot diario do estado (job/cron) porque
  `leads.resultado` so guarda o estado atual.
- **Performance:** novas analises devem usar agregacao no servidor (SQL/RPC) e nao
  baixar todos os leads para o cliente.

---

Quando voce escolher por onde comecar, eu implemento fase a fase. Minha recomendacao
e a Fase 1: e barata, usa dados que ja temos, e ja transforma a leitura da pagina
(contexto comparativo + leading indicators + meta).
