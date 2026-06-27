<template>
  <div>
    <div style="margin-bottom:16px">
      <div class="page-title">Relatórios</div>
      <div class="page-sub">Análise de desempenho do funil comercial · {{ periodLabel }}</div>
    </div>

    <!-- Filtros -->
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <div class="seg">
        <button v-for="opt in PRESETS" :key="opt.value" type="button"
          class="seg-btn" :class="{ active: mode === 'preset' && months === opt.value }"
          @click="setPreset(opt.value)">{{ opt.label }}</button>
        <button type="button" class="seg-btn" :class="{ active: mode === 'custom' }"
          @click="mode = 'custom'">Personalizado</button>
      </div>
      <div v-if="mode === 'custom'" style="display:flex;align-items:center;gap:6px">
        <input type="date" v-model="customFrom" :max="customTo || todayStr" style="width:auto" />
        <span style="font-size:12px;color:var(--text-3)">ate</span>
        <input type="date" v-model="customTo" :min="customFrom" :max="todayStr" style="width:auto" />
      </div>
      <select v-if="profile?.role !== 'bdr'" v-model="selectedUser" style="width:auto">
        <option value="">Toda a equipe</option>
        <option v-for="m in membersList" :key="m.id" :value="m.id">{{ m.name || m.email }}</option>
      </select>
      <span v-if="loading" style="font-size:12px;color:var(--text-3)">atualizando...</span>
      <button class="btn" style="margin-left:auto" :disabled="!activityData.length" @click="exportCSV">
        <i class="ti ti-download" aria-hidden="true"></i> Exportar CSV
      </button>
    </div>

    <!-- KPIs com delta vs periodo anterior -->
    <div class="kpi-grid">
      <div v-for="k in kpiCards" :key="k.key" class="kpi-card">
        <div class="kpi-label">
          <UiMetricTooltip v-if="k.metric" :metric="k.metric" />
          <span v-else>{{ k.label }}</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value">{{ k.value.toLocaleString('pt-BR') }}</span>
          <span v-if="k.delta !== null" class="kpi-delta"
            :style="{ color: k.delta > 0 ? 'var(--ok)' : k.delta < 0 ? 'var(--bad)' : 'var(--text-3)' }">
            {{ k.delta > 0 ? '▲' : k.delta < 0 ? '▼' : '' }} {{ Math.abs(k.delta) }}%
          </span>
        </div>
        <div class="kpi-sub">{{ k.sub }}</div>
      </div>
    </div>

    <!-- Funil agregado + Receita -->
    <div class="r-grid-2">
      <div class="card">
        <div class="card-label">Funil do periodo (LD &rarr; FR)</div>
        <div v-if="!periodTotals.ld && !periodTotals.ce" class="r-empty">Sem atividade registrada no periodo.</div>
        <div v-else style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
          <div v-for="st in funnelStages" :key="st.key">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
              <span style="width:26px;font-size:11px;font-weight:600;color:var(--text-2)">{{ st.key }}</span>
              <div class="funbar-track">
                <div class="funbar-fill" :style="{ width: st.width + '%', background: st.color }" />
              </div>
              <span style="width:52px;text-align:right;font-size:13px;font-weight:600;color:var(--text-1);font-variant-numeric:tabular-nums">{{ st.value.toLocaleString('pt-BR') }}</span>
            </div>
            <div v-if="st.rate" style="display:flex;align-items:center;gap:6px;padding-left:34px;margin-bottom:2px">
              <span style="font-size:10px;color:var(--text-3)">{{ st.rate.label }}</span>
              <span style="font-size:10px;font-weight:600" :style="{ color: st.rate.color }">{{ st.rate.actual }}</span>
              <span style="font-size:10px;color:var(--text-3)">meta {{ st.rate.target }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Receita</div>
        <div v-if="!metaMensal" class="r-empty">Defina a meta mensal em Configuracoes.</div>
        <template v-else>
          <div class="rev-row">
            <span class="rev-k">Fechado no periodo</span>
            <span class="rev-v" style="color:var(--ok)">R$ {{ fmtMoney(revenue.closedValue) }}</span>
          </div>
          <div class="gauge-track">
            <div class="gauge-fill" :style="{ width: pctClamp(revenue.closedValue / metaMensal) + '%', background: 'var(--ok)' }" />
          </div>
          <div class="rev-hint">{{ (revenue.closedValue / metaMensal * 100).toFixed(0) }}% da meta (R$ {{ fmtMoney(metaMensal) }}) · {{ revenue.closedCount }} fechados</div>

          <div class="rev-row" style="margin-top:14px">
            <span class="rev-k">Previsao ponderada (pipeline)</span>
            <span class="rev-v">R$ {{ fmtMoney(Math.round(revenue.weightedForecast)) }}</span>
          </div>
          <div class="gauge-track">
            <div class="gauge-fill" :style="{ width: pctClamp((revenue.closedValue + revenue.weightedForecast) / metaMensal) + '%', background: 'var(--accent)' }" />
          </div>
          <div class="rev-hint">fechado + previsao = {{ ((revenue.closedValue + revenue.weightedForecast) / metaMensal * 100).toFixed(0) }}% da meta · pipeline R$ {{ fmtMoney(revenue.pipelineValue) }}</div>
        </template>
      </div>
    </div>

    <!-- Atividade: ligacoes/dia + CE/LD -->
    <div class="card" style="margin-top:12px">
      <div class="card-label">Atividade diaria (ligacoes e contato efetivo)</div>
      <div class="r-grid-3" style="margin-bottom:14px">
        <div class="vol-item">
          <div class="vol-label">Ligacoes / dia (media)</div>
          <div class="vol-value" :style="{ color: ldPerDayActual >= ldPerDay ? 'var(--ok)' : 'var(--text-1)' }">{{ ldPerDayActual }}</div>
          <div class="vol-hint">meta {{ ldPerDay }}/dia util · {{ activeDays }} dias com registro</div>
        </div>
        <div class="vol-item">
          <div class="vol-label">Taxa de contato (CE/LD)</div>
          <div class="vol-value" :style="{ color: ceLdRate >= OUTBOUND_BENCHMARKS.TX_LD_CE * 100 ? 'var(--ok)' : 'var(--text-1)' }">{{ ceLdRate.toFixed(0) }}%</div>
          <div class="vol-hint">meta {{ (OUTBOUND_BENCHMARKS.TX_LD_CE * 100).toFixed(0) }}% · {{ periodTotals.ce }} CE de {{ periodTotals.ld }} LD</div>
        </div>
        <div class="vol-item">
          <div class="vol-label">CE / agendamento</div>
          <div class="vol-value" :style="{ color: actualCePerRM !== '--' && Number(actualCePerRM) <= cePerRM ? 'var(--ok)' : 'var(--text-1)' }">{{ actualCePerRM }}</div>
          <div class="vol-hint">meta ~{{ cePerRM }} · ligacoes/RM meta ~{{ ldPerRM }}</div>
        </div>
      </div>
      <!-- Barras de ligacoes por bucket com linha de meta -->
      <div v-if="trendBuckets.length" style="overflow-x:auto">
        <div class="bars-row" :style="{ minWidth: trendBuckets.length * 34 + 'px' }">
          <div v-for="b in trendBuckets" :key="b.key" class="bar-col" :title="`${bucketLabel(b.key)}: ${b.ld} ligacoes`">
            <div class="bar-wrap">
              <div class="bar" :style="{ height: pctClamp(b.ld / trendLdMax) + '%', background: C.ld }" />
            </div>
            <div class="bar-x">{{ bucketLabel(b.key) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tendencia multi-serie do funil -->
    <div class="card" style="margin-top:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div class="card-label" style="margin-bottom:0">Tendencia do funil ({{ granLabel }})</div>
        <div class="seg seg-sm">
          <button v-for="g in (['auto','day','week','month'] as const)" :key="g"
            class="seg-btn" :class="{ active: granularity === g }" @click="granularity = g">{{ GRAN_LABEL[g] }}</button>
        </div>
      </div>
      <div v-if="!trendBuckets.length" class="r-empty">Sem dados.</div>
      <div v-else style="overflow-x:auto;margin-top:8px">
        <svg :width="trendW" height="120" style="display:block">
          <polyline v-for="s in TREND_SERIES" :key="s.key"
            :points="trendPoints(s.key)" fill="none" :stroke="s.color" stroke-width="2" stroke-linejoin="round" />
          <text v-for="(b,i) in trendBuckets" :key="'x'+i"
            :x="trendX(i)" y="114" font-size="9" text-anchor="middle" :fill="C.axis">{{ bucketLabel(b.key) }}</text>
        </svg>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:6px">
          <span v-for="s in TREND_SERIES" :key="s.key" style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-2)">
            <span :style="{ width:'10px', height:'3px', borderRadius:'2px', background: s.color, display:'inline-block' }" />{{ s.label }}
          </span>
        </div>
      </div>
    </div>

    <!-- Comparativo por BDR + Conversao por fonte -->
    <div class="r-grid-2" style="margin-top:12px">
      <div v-if="profile?.role !== 'bdr'" class="card">
        <div class="card-label">Comparativo por BDR (CE no periodo)</div>
        <div v-if="!bdrRows.length" class="r-empty">Sem registros de equipe no periodo.</div>
        <div v-else style="display:flex;flex-direction:column;gap:8px">
          <div v-for="b in bdrRows" :key="b.user_id">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="color:var(--text-1);font-weight:500">{{ b.name }}</span>
              <span style="color:var(--text-3)">{{ b.ce }} CE · {{ b.rm }} RM · {{ b.fr }} FR</span>
            </div>
            <div class="funbar-track">
              <div class="funbar-fill" :style="{ width: pctClamp(b.ce / bdrMaxCe) + '%', background: C.ce }" />
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Conversao por fonte (avanco para reuniao+)</div>
        <div class="r-sublabel">Leads criados no periodo, por canal (snapshot do estagio atual).</div>
        <div v-if="!sourceRows.length" class="r-empty">Sem leads com fonte no periodo.</div>
        <div v-else style="display:flex;flex-direction:column;gap:8px">
          <div v-for="s in sourceRows" :key="s.fonte">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="color:var(--text-1);font-weight:500">{{ s.fonte }}</span>
              <span style="color:var(--text-3)">{{ s.advRate }}% avancaram · {{ s.total }} leads</span>
            </div>
            <div class="funbar-track">
              <div class="funbar-fill" :style="{ width: s.advRate + '%', background: C.rm }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drop-off de follow-up + Heatmap -->
    <div class="r-grid-2" style="margin-top:12px">
      <div class="card">
        <div class="card-label">Disciplina de follow-up (carteira atual)</div>
        <div class="r-sublabel">% dos leads que chegaram em cada tentativa do protocolo de 10.</div>
        <div v-if="!fuDrop.totalLeads" class="r-empty">Sem leads na carteira.</div>
        <div v-else style="overflow-x:auto">
          <div class="bars-row" style="min-width:300px">
            <div v-for="(c,i) in fuDrop.completedByAttempt" :key="i" class="bar-col" :title="`${i+1}a tentativa: ${c} (${fuPct(c)}%)`">
              <div class="bar-wrap">
                <div class="bar" :style="{ height: fuPct(c) + '%', background: C.ce }" />
              </div>
              <div class="bar-x">{{ i + 1 }}</div>
            </div>
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:6px">{{ fuDrop.totalLeads }} leads · referencia: 80% das vendas fecham com 8+ contatos.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Atividade por dia da semana (CE)</div>
        <div class="r-sublabel">Onde a equipe mais produz contato efetivo.</div>
        <div v-if="!periodTotals.ce" class="r-empty">Sem dados.</div>
        <div v-else style="display:flex;gap:6px;margin-top:6px">
          <div v-for="d in dowData" :key="d.dow" style="flex:1;text-align:center">
            <div class="heat-cell" :style="{ background: heatColor(d.ce) }" :title="`${DOW[d.dow]}: ${d.ce} CE`">{{ d.ce }}</div>
            <div style="font-size:10px;color:var(--text-3);margin-top:4px">{{ DOW_SHORT[d.dow] }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Status + Motivos de perda -->
    <div class="r-grid-2" style="margin-top:12px">
      <div class="card">
        <div class="card-label">Leads por status (criados no periodo)</div>
        <div v-if="!statusData.length" class="r-empty">Sem leads criados no periodo.</div>
        <div v-else style="display:flex;gap:12px;align-items:flex-start">
          <svg width="100" height="100" viewBox="0 0 100 100" style="flex-shrink:0">
            <circle cx="50" cy="50" r="38" fill="none" :stroke="C.donutBg" stroke-width="16"/>
            <circle v-for="(seg, i) in donutSegments" :key="i" cx="50" cy="50" r="38" fill="none"
              :stroke="seg.color" stroke-width="16"
              :stroke-dasharray="`${seg.dash} ${239 - seg.dash}`" :stroke-dashoffset="seg.offset"
              transform="rotate(-90 50 50)" />
          </svg>
          <div style="flex:1;display:flex;flex-direction:column;gap:3px;overflow:hidden">
            <button v-for="s in statusData.slice(0,7)" :key="s.status" class="legend-row"
              :title="`Ver leads em ${s.status}`" @click="goToStatus(s.status)">
              <div :style="{ width:'8px', height:'8px', borderRadius:'50%', background: statusColor(s.status), flexShrink:0 }"/>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-2)">{{ s.status }}</span>
              <span style="margin-left:auto;font-weight:600;color:var(--text-1)">{{ s.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Motivos de perda (criados no periodo)</div>
        <div v-if="!lossData.length" class="r-empty">Nenhum lead perdido com motivo no periodo.</div>
        <div v-else>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:10px">Total: {{ lossTotal }} leads perdidos com motivo</div>
          <div style="display:flex;flex-direction:column;gap:7px">
            <div v-for="row in lossData" :key="row.reason">
              <div style="display:flex;justify-content:space-between;margin-bottom:3px">
                <span style="font-size:12px;font-weight:500;color:var(--text-1)">{{ row.reason }}</span>
                <span style="font-size:12px;color:var(--text-2)">{{ row.count }} · {{ lossTotal > 0 ? ((row.count / lossTotal) * 100).toFixed(0) : 0 }}%</span>
              </div>
              <div class="funbar-track">
                <div class="funbar-fill" :style="{ width: lossTotal > 0 ? (row.count / lossData[0].count * 100) + '%' : '0%', background: C.bad }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Aging -->
    <div class="card" style="margin-top:12px">
      <div class="card-label">Envelhecimento dos leads ativos</div>
      <div class="r-sublabel">Dias desde a ultima atualizacao. Leads parados ha muito tempo sao receita travada.</div>
      <div v-if="!agingTotal" class="r-empty">Sem leads ativos.</div>
      <div v-else class="r-grid-4">
        <div v-for="a in agingData" :key="a.label" class="vol-item">
          <div class="vol-label">{{ a.label }}</div>
          <div class="vol-value" :style="{ color: a.label.startsWith('31') && a.count > 0 ? 'var(--bad)' : 'var(--text-1)' }">{{ a.count }}</div>
          <div class="vol-hint">{{ agingTotal > 0 ? (a.count / agingTotal * 100).toFixed(0) : 0 }}% dos ativos</div>
        </div>
      </div>
    </div>

    <!-- ════ Analise estrutural ════ -->
    <div style="margin:20px 0 10px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3)">
      Analise estrutural
    </div>

    <!-- Waterfall + Velocidade -->
    <div class="r-grid-2">
      <div class="card">
        <div class="card-label">Movimentacao do pipeline no periodo</div>
        <div class="r-sublabel">A partir do historico de transicoes (lead_events).</div>
        <div v-if="!waterfall.created && !waterfall.advanced && !waterfall.won && !waterfall.lost" class="r-empty">
          Sem movimentacoes registradas no periodo.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:9px">
          <div v-for="b in waterfallBars" :key="b.label">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span style="color:var(--text-1);font-weight:500">{{ b.label }}</span>
              <span style="color:var(--text-2);font-variant-numeric:tabular-nums">{{ b.value }}</span>
            </div>
            <div class="funbar-track"><div class="funbar-fill" :style="{ width: b.pct + '%', background: b.color }" /></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Velocidade do funil</div>
        <div class="r-sublabel">Tempo medio em cada etapa e ciclo ate o fechamento.</div>
        <div class="rev-row" style="margin-bottom:10px">
          <span class="rev-k">Ciclo medio (criacao &rarr; fechamento)</span>
          <span class="rev-v">{{ velocity.cycleDays }}d</span>
        </div>
        <div style="font-size:11px;color:var(--text-3);margin-bottom:12px">{{ velocity.cycleCount }} fechamentos no periodo</div>
        <div v-if="!velocity.stages.length" style="font-size:12px;color:var(--text-3)">
          Sem transicoes suficientes no periodo para medir tempo por etapa.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:7px">
          <div v-for="st in velocity.stages.slice(0,6)" :key="st.stage" style="display:flex;align-items:center;gap:8px">
            <span style="width:120px;font-size:12px;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ st.stage }}</span>
            <div class="funbar-track"><div class="funbar-fill" :style="{ width: velStagePct(st.avgDays) + '%', background: C.rr }" /></div>
            <span style="width:42px;text-align:right;font-size:12px;font-weight:600;color:var(--text-1)">{{ st.avgDays }}d</span>
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:2px">baseado em {{ velocity.transitions }} transicoes</div>
        </div>
      </div>
    </div>

    <!-- Coorte -->
    <div class="card" style="margin-top:12px">
      <div class="card-label">Coorte por mes de criacao (posicao atual no funil)</div>
      <div class="r-sublabel">Dos leads criados em cada mes, quantos % chegaram a cada etapa.</div>
      <div v-if="!cohortRows.length" class="r-empty">Sem leads criados no periodo.</div>
      <div v-else style="overflow-x:auto">
        <table class="cohort-table">
          <thead>
            <tr>
              <th style="text-align:left">Coorte</th>
              <th>Leads</th>
              <th>Reuniao+</th>
              <th>Proposta+</th>
              <th>Fechou</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in cohortRows" :key="c.month">
              <td style="text-align:left;font-weight:500;color:var(--text-1)">{{ c.label }}</td>
              <td>{{ c.total }}</td>
              <td><span class="coh-cell" :style="{ background: cohBg(c.reuniaoPct) }">{{ c.reuniaoPct }}%</span></td>
              <td><span class="coh-cell" :style="{ background: cohBg(c.propostaPct) }">{{ c.propostaPct }}%</span></td>
              <td><span class="coh-cell" :style="{ background: cohBg(c.wonPct) }">{{ c.wonPct }}%</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pipeline ao longo do tempo -->
    <div class="card" style="margin-top:12px">
      <div class="card-label">Pipeline ao longo do tempo (valor ativo)</div>
      <div v-if="!pipeHistory.length" class="r-empty">
        Sem historico ainda. Aplique a migracao de snapshots; o grafico passa a acumular a partir dai.
      </div>
      <div v-else style="overflow-x:auto">
        <svg :width="pipeW" height="100" style="display:block">
          <polyline :points="pipePoints" fill="none" :stroke="C.ce" stroke-width="2" stroke-linejoin="round" />
        </svg>
        <div style="font-size:11px;color:var(--text-3);margin-top:4px">
          {{ pipeHistory.length }} dias · pico R$ {{ fmtMoney(Math.round(pipeMax)) }}
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Profile } from '~/types'
import { OUTBOUND_BENCHMARKS, useOutboundMath } from '~/composables/useOutboundMath'
import { fmtMoney } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const { profile, org } = useProfile()

// Cores de serie/grafico (consts, nao literais em style="" para a trava de cores)
const C = {
  ld: '#64748b', ce: '#193497', rm: '#7c3aed', rr: '#d97706', fr: '#16a34a',
  bad: '#dc2626', axis: '#94a3b8', donutBg: '#f1f5f9',
}
const TREND_SERIES = [
  { key: 'ce' as const, label: 'CE', color: C.ce },
  { key: 'rm' as const, label: 'RM', color: C.rm },
  { key: 'rr' as const, label: 'RR', color: C.rr },
  { key: 'fr' as const, label: 'FR', color: C.fr },
]
const PRESETS = [{ value: 3, label: '3 meses' }, { value: 6, label: '6 meses' }, { value: 12, label: '1 ano' }]
const GRAN_LABEL = { auto: 'Auto', day: 'Dia', week: 'Semana', month: 'Mes' }
const DOW = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
const DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const cePerRM = Math.round(1 / OUTBOUND_BENCHMARKS.TX_CE_RM)
const ldPerRM = Math.round(1 / OUTBOUND_BENCHMARKS.TX_CE_RM / OUTBOUND_BENCHMARKS.TX_LD_CE)

// Metas via outbound math (a partir das settings da org)
const metaMensal  = computed(() => Number(org.value?.settings?.meta_mensal) || 0)
const ticketMedio = computed(() => Number(org.value?.settings?.ticket_medio) || 2000)
const { ldPerDay, cePerDay } = useOutboundMath(
  computed(() => metaMensal.value || 10000), ticketMedio,
)

// ── Periodo ─────────────────────────────────────────────────────────────
const months       = ref(6)
const mode         = ref<'preset' | 'custom'>('preset')
const _now         = new Date()
const todayStr     = _now.toISOString().slice(0, 10)
const monthStartStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-01`
const customFrom   = ref(monthStartStr)
const customTo     = ref(todayStr)
const selectedUser = ref('')
const granularity  = ref<'auto' | 'day' | 'week' | 'month'>('auto')

function setPreset(v: number) { months.value = v; mode.value = 'preset' }

const fmtDay = (s: string) => s
  ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  : ''
const periodLabel = computed(() =>
  mode.value === 'custom' && customFrom.value && customTo.value
    ? `${fmtDay(customFrom.value)} a ${fmtDay(customTo.value)}`
    : months.value === 12 ? '1 ano' : `${months.value} meses`
)

function resolveRange(): { from: string; to: string } {
  if (mode.value === 'custom' && customFrom.value && customTo.value) {
    return { from: customFrom.value, to: customTo.value }
  }
  const c = new Date(); c.setMonth(c.getMonth() - months.value + 1); c.setDate(1)
  return { from: c.toISOString().slice(0, 10), to: todayStr }
}
function prevRange(r: { from: string; to: string }) {
  const fromD = new Date(r.from + 'T00:00:00'); const toD = new Date(r.to + 'T00:00:00')
  const lenDays = Math.round((toD.getTime() - fromD.getTime()) / 86_400_000) + 1
  const prevTo = new Date(fromD); prevTo.setDate(prevTo.getDate() - 1)
  const prevFrom = new Date(prevTo); prevFrom.setDate(prevFrom.getDate() - (lenDays - 1))
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) }
}
function paramsFor(r: { from: string; to: string }) {
  const p = new URLSearchParams({ from: r.from, to: r.to })
  if (selectedUser.value) p.set('user_id', selectedUser.value)
  return p
}

// ── Dados ───────────────────────────────────────────────────────────────
interface FunnelRow { month: string; ld: number; ce: number; rm: number; rr: number; fr: number }
interface DayRow { date: string; ld: number; ce: number; rm: number; rr: number; fr: number }
const funnelData = ref<FunnelRow[]>([])
const funnelPrev = ref<FunnelRow[]>([])
const activityData = ref<DayRow[]>([])
const statusData = ref<{ status: string; count: number }[]>([])
const lossData = ref<{ reason: string; count: number }[]>([])
const sourceData = ref<{ fonte: string; total: number; advanced: number; won: number }[]>([])
const bdrData = ref<{ user_id: string; ld: number; ce: number; rm: number; rr: number; fr: number }[]>([])
const revenue = ref({ closedValue: 0, closedCount: 0, pipelineValue: 0, weightedForecast: 0, activeWithValue: 0 })
const fuDrop = ref<{ totalLeads: number; completedByAttempt: number[] }>({ totalLeads: 0, completedByAttempt: [] })
const agingData = ref<{ label: string; count: number }[]>([])
const velocity = ref<{ cycleDays: number; cycleCount: number; transitions: number; stages: { stage: string; avgDays: number; count: number }[] }>({ cycleDays: 0, cycleCount: 0, transitions: 0, stages: [] })
const cohortData = ref<{ month: string; total: number; reuniao: number; proposta: number; won: number }[]>([])
const waterfall = ref({ created: 0, advanced: 0, won: 0, lost: 0 })
const pipeHistory = ref<{ date: string; count: number; value: number }[]>([])
const loading = ref(false)

const membersList = ref<(Profile & { email: string })[]>([])

async function loadAll() {
  loading.value = true
  const r = resolveRange()
  const p = paramsFor(r); const pp = paramsFor(prevRange(r))
  try {
    const tasks: Promise<any>[] = [
      $fetch<FunnelRow[]>(`/api/reports/funnel?${p}`).then(d => funnelData.value = d),
      $fetch<FunnelRow[]>(`/api/reports/funnel?${pp}`).then(d => funnelPrev.value = d),
      $fetch<DayRow[]>(`/api/reports/activity?${p}`).then(d => activityData.value = d),
      $fetch<any[]>(`/api/reports/leads-by-status?${p}`).then(d => statusData.value = d.sort((a, b) => b.count - a.count)),
      $fetch<any[]>(`/api/reports/loss-reasons?${p}`).then(d => lossData.value = d),
      $fetch<any[]>(`/api/reports/by-source?${p}`).then(d => sourceData.value = d),
      $fetch<any>(`/api/reports/revenue?${p}`).then(d => revenue.value = d),
      $fetch<any>(`/api/reports/velocity?${p}`).then(d => velocity.value = d),
      $fetch<any[]>(`/api/reports/cohort?${p}`).then(d => cohortData.value = d),
      $fetch<any>(`/api/reports/waterfall?${p}`).then(d => waterfall.value = d),
      $fetch<any[]>(`/api/reports/pipeline-history?${p}`).then(d => pipeHistory.value = d),
    ]
    if (profile.value?.role !== 'bdr' && !selectedUser.value) {
      tasks.push($fetch<any[]>(`/api/reports/by-bdr?${p}`).then(d => bdrData.value = d))
    } else { bdrData.value = [] }
    await Promise.all(tasks)
  } catch { /* silencioso */ }
  finally { loading.value = false }
}

onMounted(async () => {
  if (profile.value?.role !== 'bdr') {
    try { membersList.value = await $fetch<(Profile & { email: string })[]>('/api/settings/members') } catch {}
  }
  const url = (s: string) => s // evita a inferencia de rota tipada (excessive stack depth)
  try { fuDrop.value = await $fetch<{ totalLeads: number; completedByAttempt: number[] }>(url('/api/reports/followups')) } catch {}
  try { agingData.value = await $fetch<{ label: string; count: number }[]>(url('/api/reports/aging')) } catch {}
})

watch([months, selectedUser, mode, customFrom, customTo], () => loadAll(), { immediate: true })

// ── Totais e deltas ─────────────────────────────────────────────────────
const sumRows = (rows: FunnelRow[]) => rows.reduce((a, r) => ({
  ld: a.ld + r.ld, ce: a.ce + r.ce, rm: a.rm + r.rm, rr: a.rr + r.rr, fr: a.fr + r.fr,
}), { ld: 0, ce: 0, rm: 0, rr: 0, fr: 0 })
const periodTotals = computed(() => sumRows(funnelData.value))
const prevTotals   = computed(() => sumRows(funnelPrev.value))

function delta(cur: number, prev: number): number | null {
  if (prev === 0) return cur > 0 ? 100 : null
  return Math.round((cur - prev) / prev * 100)
}

const actualCePerRM = computed(() =>
  periodTotals.value.rm > 0 ? (periodTotals.value.ce / periodTotals.value.rm).toFixed(0) : '--'
)

const kpiCards = computed(() => {
  const t = periodTotals.value, p = prevTotals.value
  const txCeRm = t.ce ? ((t.rm / t.ce) * 100).toFixed(1) : '0'
  const txRrFr = t.rr ? ((t.fr / t.rr) * 100).toFixed(0) : '0'
  return [
    { key: 'LD', label: 'Ligacoes', metric: 'LD' as const, value: t.ld, delta: delta(t.ld, p.ld), sub: 'vs periodo anterior' },
    { key: 'CE', label: 'Contatos efetivos', metric: 'CE' as const, value: t.ce, delta: delta(t.ce, p.ce), sub: `LD->CE ${t.ld ? (t.ce / t.ld * 100).toFixed(0) : 0}%` },
    { key: 'RM', label: 'Reunioes marcadas', metric: 'RM' as const, value: t.rm, delta: delta(t.rm, p.rm), sub: `CE->RM ${txCeRm}%` },
    { key: 'RR', label: 'Reunioes realizadas', metric: 'RR' as const, value: t.rr, delta: delta(t.rr, p.rr), sub: 'vs periodo anterior' },
    { key: 'FR', label: 'Fechamentos', metric: 'FR' as const, value: t.fr, delta: delta(t.fr, p.fr), sub: `RR->FR ${txRrFr}%` },
  ]
})

// ── Funil agregado com semaforo de benchmark ────────────────────────────
function rateInfo(actual: number, target: number, label: string) {
  if (!isFinite(actual)) return null
  const ratio = target > 0 ? actual / target : 0
  const color = ratio >= 1 ? 'var(--ok)' : ratio >= 0.7 ? 'var(--warn)' : 'var(--bad)'
  const fmt = (x: number) => x < 0.1 ? (x * 100).toFixed(1) + '%' : (x * 100).toFixed(0) + '%'
  return { label, actual: fmt(actual), target: fmt(target), color }
}
const funnelStages = computed(() => {
  const t = periodTotals.value
  const base = t.ld || t.ce || 1
  const B = OUTBOUND_BENCHMARKS
  return [
    { key: 'LD', value: t.ld, color: C.ld, width: 100, rate: null as any },
    { key: 'CE', value: t.ce, color: C.ce, width: t.ld ? t.ce / base * 100 : 100, rate: t.ld ? rateInfo(t.ce / t.ld, B.TX_LD_CE, 'LD->CE') : null },
    { key: 'RM', value: t.rm, color: C.rm, width: t.ce / base * 100, rate: t.ce ? rateInfo(t.rm / t.ce, B.TX_CE_RM, 'CE->RM') : null },
    { key: 'RR', value: t.rr, color: C.rr, width: t.rm / base * 100, rate: t.rm ? rateInfo(t.rr / t.rm, B.TX_RM_RR, 'RM->RR') : null },
    { key: 'FR', value: t.fr, color: C.fr, width: t.rr / base * 100, rate: t.rr ? rateInfo(t.fr / t.rr, B.TX_RR_FR, 'RR->FR') : null },
  ]
})

// ── Receita ─────────────────────────────────────────────────────────────
const pctClamp = (x: number) => Math.max(0, Math.min(100, x * 100))

// ── Atividade diaria ────────────────────────────────────────────────────
const activeDays = computed(() => activityData.value.filter(d => d.ld > 0 || d.ce > 0).length)
const ldPerDayActual = computed(() => activeDays.value > 0 ? Math.round(periodTotals.value.ld / activeDays.value) : 0)
const ceLdRate = computed(() => periodTotals.value.ld > 0 ? periodTotals.value.ce / periodTotals.value.ld * 100 : 0)

// ── Tendencia (bucketizacao) ────────────────────────────────────────────
const rangeDays = computed(() => {
  const r = resolveRange()
  return Math.round((new Date(r.to).getTime() - new Date(r.from).getTime()) / 86_400_000) + 1
})
const effGran = computed<'day' | 'week' | 'month'>(() =>
  granularity.value !== 'auto' ? granularity.value
    : rangeDays.value <= 45 ? 'day' : rangeDays.value <= 180 ? 'week' : 'month'
)
const granLabel = computed(() => ({ day: 'diario', week: 'semanal', month: 'mensal' }[effGran.value]))

function mondayOf(ds: string) {
  const d = new Date(ds + 'T00:00:00'); const off = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - off); return d.toISOString().slice(0, 10)
}
const trendBuckets = computed(() => {
  const map = new Map<string, DayRow>()
  for (const row of activityData.value) {
    const key = effGran.value === 'day' ? row.date
      : effGran.value === 'week' ? mondayOf(row.date)
      : row.date.slice(0, 7) + '-01'
    const b = map.get(key) || { date: key, ld: 0, ce: 0, rm: 0, rr: 0, fr: 0 }
    b.ld += row.ld; b.ce += row.ce; b.rm += row.rm; b.rr += row.rr; b.fr += row.fr
    map.set(key, b)
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date)).map(b => ({ ...b, key: b.date }))
})
function bucketLabel(key: string) {
  const d = new Date(key + 'T12:00:00')
  return effGran.value === 'month'
    ? d.toLocaleDateString('pt-BR', { month: 'short' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
const trendW = computed(() => Math.max(360, trendBuckets.value.length * 56))
const trendMax = computed(() => Math.max(1, ...trendBuckets.value.flatMap(b => [b.ce, b.rm, b.rr, b.fr])))
const trendLdMax = computed(() => Math.max(1, ...trendBuckets.value.map(b => b.ld)))
function trendX(i: number) {
  const n = trendBuckets.value.length
  const step = n > 1 ? (trendW.value - 40) / (n - 1) : 0
  return 20 + step * i
}
function trendPoints(key: 'ce' | 'rm' | 'rr' | 'fr') {
  return trendBuckets.value.map((b, i) => `${trendX(i)},${90 - (b[key] / trendMax.value) * 76}`).join(' ')
}

// ── BDR ─────────────────────────────────────────────────────────────────
const bdrRows = computed(() => {
  const nameOf = (id: string) => {
    const m = membersList.value.find(x => x.id === id)
    return m?.name || m?.email || 'BDR'
  }
  return bdrData.value.map(b => ({ ...b, name: nameOf(b.user_id) }))
})
const bdrMaxCe = computed(() => Math.max(1, ...bdrData.value.map(b => b.ce)))

// ── Fonte ───────────────────────────────────────────────────────────────
const sourceRows = computed(() =>
  sourceData.value.map(s => ({ ...s, advRate: s.total > 0 ? Math.round(s.advanced / s.total * 100) : 0 }))
)

// ── Follow-up drop-off ──────────────────────────────────────────────────
const fuPct = (c: number) => fuDrop.value.totalLeads > 0 ? Math.round(c / fuDrop.value.totalLeads * 100) : 0

// ── Heatmap dia da semana ───────────────────────────────────────────────
const dowData = computed(() => {
  const arr = Array.from({ length: 7 }, (_, i) => ({ dow: i, ce: 0 }))
  for (const r of activityData.value) arr[new Date(r.date + 'T00:00:00').getDay()].ce += r.ce
  return arr
})
const dowMax = computed(() => Math.max(1, ...dowData.value.map(d => d.ce)))
function heatColor(ce: number) {
  if (ce <= 0) return 'var(--bg-subtle)'
  const a = 0.12 + (ce / dowMax.value) * 0.5
  return `rgba(25,52,151,${a.toFixed(2)})`
}

// ── Aging ───────────────────────────────────────────────────────────────
const agingTotal = computed(() => agingData.value.reduce((s, a) => s + a.count, 0))

// ── Donut status ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'Novo': '#64748b', 'Prospecção': '#6366f1', 'Qualificação': '#0ea5e9',
  'Aguardando retorno': '#f59e0b', 'Follow-up': '#3b82f6', 'De molho': '#8b5cf6',
  'Reunião agendada': '#14b8a6', 'Enviar proposta': '#f97316', 'Proposta enviada': '#6366f1',
  'Fechado': '#22c55e', 'Recusado': '#ef4444', 'Sem interesse': '#94a3b8', 'Não atende': '#cbd5e1',
}
function statusColor(s: string) { return STATUS_COLORS[s] || '#e2e8f0' }
const CIRCUM = 2 * Math.PI * 38
const donutSegments = computed(() => {
  const total = statusData.value.reduce((s, r) => s + r.count, 0) || 1
  let offset = 0
  return statusData.value.map(r => {
    const dash = r.count / total * CIRCUM
    const seg = { dash, offset: -offset, color: statusColor(r.status) }
    offset += dash
    return seg
  })
})
const lossTotal = computed(() => lossData.value.reduce((s, r) => s + r.count, 0))

// ── Coorte ──────────────────────────────────────────────────────────────
function cohortLabel(m: string) {
  return new Date(m + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}
const cohortRows = computed(() => cohortData.value.map(c => ({
  ...c,
  label: cohortLabel(c.month),
  reuniaoPct: c.total ? Math.round(c.reuniao / c.total * 100) : 0,
  propostaPct: c.total ? Math.round(c.proposta / c.total * 100) : 0,
  wonPct: c.total ? Math.round(c.won / c.total * 100) : 0,
})))

// ── Waterfall ───────────────────────────────────────────────────────────
const waterfallBars = computed(() => {
  const w = waterfall.value
  const max = Math.max(1, w.created, w.advanced, w.won, w.lost)
  return [
    { label: 'Entraram', value: w.created, color: C.ce, pct: w.created / max * 100 },
    { label: 'Avancaram', value: w.advanced, color: C.rm, pct: w.advanced / max * 100 },
    { label: 'Ganharam', value: w.won, color: C.fr, pct: w.won / max * 100 },
    { label: 'Perderam', value: w.lost, color: C.bad, pct: w.lost / max * 100 },
  ]
})

// ── Pipeline historico ──────────────────────────────────────────────────
const pipeW = computed(() => Math.max(360, pipeHistory.value.length * 22))
const pipeMax = computed(() => Math.max(1, ...pipeHistory.value.map(p => p.value)))
const pipePoints = computed(() => {
  const arr = pipeHistory.value
  if (!arr.length) return ''
  const step = arr.length > 1 ? (pipeW.value - 20) / (arr.length - 1) : 0
  return arr.map((p, i) => `${10 + step * i},${88 - (p.value / pipeMax.value) * 74}`).join(' ')
})

// ── Velocidade / coorte helpers ─────────────────────────────────────────
const velMax = computed(() => Math.max(1, ...velocity.value.stages.map(s => s.avgDays)))
function velStagePct(d: number) { return Math.max(3, d / velMax.value * 100) }
function cohBg(pct: number) {
  if (pct <= 0) return 'var(--bg-subtle)'
  return `rgba(22,163,74,${(0.1 + pct / 100 * 0.55).toFixed(2)})`
}

// ── Export CSV ──────────────────────────────────────────────────────────
function exportCSV() {
  const rows = [['data', 'LD', 'CE', 'RM', 'RR', 'FR'],
    ...activityData.value.map(d => [d.date, d.ld, d.ce, d.rm, d.rr, d.fr])]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href; a.download = `relatorio-atividade-${todayStr}.csv`; a.click()
  URL.revokeObjectURL(href)
}

// ── Drill-down ──────────────────────────────────────────────────────────
function goToStatus(status: string) {
  navigateTo({ path: '/dashboard/pipeline', query: { status, view: 'list' } })
}
</script>

<style scoped>
.seg { display:flex; gap:2px; background:var(--border-soft); border-radius:10px; padding:3px; }
.seg-sm .seg-btn { padding:4px 10px; font-size:11px; }
.seg-btn { padding:5px 14px; border-radius:8px; border:none; font-size:12px; font-weight:500; cursor:pointer; font-family:inherit; background:transparent; color:var(--text-2); transition:all .12s; }
.seg-btn.active { background:var(--bg-card); color:var(--text-1); box-shadow:0 1px 3px rgba(0,0,0,.08); }

.kpi-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:14px; }
@media (max-width:900px){ .kpi-grid{ grid-template-columns:repeat(2,1fr); } }
.kpi-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:14px; }
.kpi-label { font-size:12px; color:var(--text-2); margin-bottom:6px; }
.kpi-value-row { display:flex; align-items:baseline; gap:8px; }
.kpi-value { font-size:26px; font-weight:700; color:var(--text-1); font-variant-numeric:tabular-nums; line-height:1; letter-spacing:-.02em; }
.kpi-delta { font-size:12px; font-weight:600; }
.kpi-sub { font-size:11px; color:var(--text-3); margin-top:6px; }

.r-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.r-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
.r-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
@media (max-width:820px){ .r-grid-2,.r-grid-3,.r-grid-4{ grid-template-columns:1fr; } }
.r-empty { height:100px; display:flex; align-items:center; justify-content:center; color:var(--text-3); font-size:13px; text-align:center; }
.r-sublabel { font-size:11px; color:var(--text-3); margin:-6px 0 10px; }

.funbar-track { flex:1; height:9px; background:var(--border-soft); border-radius:99px; overflow:hidden; }
.funbar-fill { height:100%; border-radius:99px; transition:width .35s; }

.gauge-track { height:10px; background:var(--bg-subtle); border-radius:99px; overflow:hidden; margin:6px 0 3px; }
.gauge-fill { height:100%; border-radius:99px; transition:width .35s; }
.rev-row { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
.rev-k { font-size:12px; color:var(--text-2); }
.rev-v { font-size:17px; font-weight:700; color:var(--text-1); font-variant-numeric:tabular-nums; }
.rev-hint { font-size:11px; color:var(--text-3); }

.vol-item  { background:var(--bg-subtle); border:1px solid var(--border-soft); border-radius:10px; padding:12px 14px; }
.vol-label { font-size:11px; color:var(--text-3); text-transform:uppercase; letter-spacing:.05em; font-weight:600; margin-bottom:6px; }
.vol-value { font-size:24px; font-weight:700; color:var(--text-1); font-variant-numeric:tabular-nums; line-height:1; }
.vol-hint  { font-size:11px; color:var(--text-3); margin-top:5px; }

.bars-row { display:flex; align-items:flex-end; gap:3px; height:90px; }
.bar-col { flex:1; min-width:8px; display:flex; flex-direction:column; align-items:center; height:100%; }
.bar-wrap { flex:1; width:100%; display:flex; align-items:flex-end; }
.bar { width:100%; min-height:2px; border-radius:3px 3px 0 0; transition:height .3s; }
.bar-x { font-size:9px; color:var(--text-3); margin-top:4px; white-space:nowrap; }

.heat-cell { height:46px; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:13px; font-weight:600; color:var(--text-1); border:1px solid var(--border-soft); }

.legend-row { display:flex; align-items:center; gap:6px; font-size:12px; background:none; border:none; padding:3px 4px; border-radius:6px; cursor:pointer; font-family:inherit; text-align:left; width:100%; transition:background .1s; }
.legend-row:hover { background:var(--bg-subtle); }

.cohort-table { width:100%; border-collapse:collapse; font-size:12px; min-width:380px; }
.cohort-table th { font-size:10px; font-weight:600; color:var(--text-3); text-transform:uppercase; letter-spacing:.05em; text-align:center; padding:0 8px 8px; }
.cohort-table td { text-align:center; padding:6px 8px; border-top:1px solid var(--border-soft); color:var(--text-2); font-variant-numeric:tabular-nums; }
.coh-cell { display:inline-block; min-width:42px; padding:2px 6px; border-radius:5px; font-weight:600; color:var(--text-1); }
</style>
