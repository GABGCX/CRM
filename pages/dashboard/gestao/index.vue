<template>
  <div>
    <div style="margin-bottom:18px">
      <div class="eyebrow" style="margin-bottom:6px">Performance do time</div>
      <div class="page-title">Gestão da equipe</div>
      <div class="page-sub">{{ MONTH_NAMES[(data?.month || 1) - 1] }} {{ data?.year }} · desempenho por BDR</div>
    </div>

    <div v-if="pending" class="gm-skel">
      <div v-for="i in 4" :key="i" class="gm-skel-row" />
    </div>

    <template v-else-if="data">
      <!-- Resumo da equipe -->
      <div class="gm-summary">
        <div class="gm-sum-item">
          <span class="gm-sum-label">Equipe</span>
          <span class="gm-sum-value">{{ bdrs.length }}</span>
          <span class="gm-sum-hint">BDRs ativos</span>
        </div>
        <div class="gm-sum-div" />
        <div class="gm-sum-item">
          <span class="gm-sum-label">CE no mês</span>
          <span class="gm-sum-value">{{ team.ce }}</span>
          <span class="gm-sum-hint">contatos efetivos</span>
        </div>
        <div class="gm-sum-div" />
        <div class="gm-sum-item">
          <span class="gm-sum-label">Fechados</span>
          <span class="gm-sum-value" style="color:#16a34a">{{ team.fr }}</span>
          <span class="gm-sum-hint">CE&rarr;RM {{ teamCeRm }}%</span>
        </div>
        <div class="gm-sum-div" />
        <div class="gm-sum-item">
          <span class="gm-sum-label">Previsão ponderada</span>
          <span class="gm-sum-value" style="color:#16a34a">R$ {{ team.forecast.toLocaleString('pt-BR') }}</span>
          <span class="gm-sum-hint">pipeline R$ {{ fmtK(team.pipeline) }} · {{ team.activeLeads }} ativos</span>
        </div>
      </div>

      <!-- Alertas de gestao -->
      <div v-if="alerts.length" class="gm-alerts">
        <div v-for="(a, i) in alerts" :key="i" class="gm-alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>{{ a.text }}</span>
        </div>
      </div>

      <!-- Tabela da equipe -->
      <div class="card" style="padding:0;overflow:hidden">
        <div class="gm-table-wrap">
          <table class="gm-table">
            <thead>
              <tr>
                <th class="gm-th-left">BDR</th>
                <th v-for="c in ['CE','RM','RR','FR']" :key="c">{{ c }}</th>
                <th>CE&rarr;RM</th>
                <th>RM&rarr;RR</th>
                <th>RR&rarr;FR</th>
                <th>Ritmo</th>
                <th>Pipeline</th>
                <th>Dias</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in rankedBdrs" :key="b.id" class="gm-row" @click="goBdr(b.id)">
                <td class="gm-td-left">
                  <div class="gm-bdr">
                    <span class="gm-avatar">{{ (b.name || 'B')[0].toUpperCase() }}</span>
                    <div style="min-width:0">
                      <div class="gm-name">{{ b.name }}</div>
                      <div class="gm-role">{{ ROLE_LABEL[b.role] || b.role }}</div>
                    </div>
                  </div>
                </td>
                <td class="tabular">{{ b.ce }}</td>
                <td class="tabular">{{ b.rm }}</td>
                <td class="tabular">{{ b.rr }}</td>
                <td class="tabular" :style="{ color: b.fr > 0 ? '#16a34a' : 'var(--text-3)', fontWeight: b.fr > 0 ? 600 : 400 }">{{ b.fr }}</td>
                <td><span class="gm-rate" :style="{ color: rate(b.ce, b.rm, B.TX_CE_RM).color }">{{ rate(b.ce, b.rm, B.TX_CE_RM).label }}</span></td>
                <td><span class="gm-rate" :style="{ color: rate(b.rm, b.rr, B.TX_RM_RR).color }">{{ rate(b.rm, b.rr, B.TX_RM_RR).label }}</span></td>
                <td><span class="gm-rate" :style="{ color: rate(b.rr, b.fr, B.TX_RR_FR).color }">{{ rate(b.rr, b.fr, B.TX_RR_FR).label }}</span></td>
                <td><span class="gm-pace" :style="{ color: pace(b).color }">{{ pace(b).label }}</span><span v-if="!b.hasGoal" class="gm-nogoal" title="Usando meta da organizacao">·</span></td>
                <td class="tabular gm-pipe">{{ b.pipelineValue > 0 ? 'R$ ' + fmtK(b.pipelineValue) : '--' }}</td>
                <td>
                  <span class="gm-days" :style="{ color: b.daysLogged === 0 ? '#dc2626' : 'var(--text-3)' }">{{ b.daysLogged }}</span>
                </td>
              </tr>
              <tr v-if="!bdrs.length">
                <td colspan="10" style="text-align:center;padding:32px;color:var(--text-3);font-size:13px">Nenhum BDR na equipe ainda.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="gm-legend">
        Taxas comparadas aos benchmarks: CE&rarr;RM {{ (B.TX_CE_RM*100).toFixed(1) }}% · RM&rarr;RR {{ (B.TX_RM_RR*100).toFixed(0) }}% · RR&rarr;FR {{ (B.TX_RR_FR*100).toFixed(0) }}%. Clique num BDR para o detalhe.
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { OUTBOUND_BENCHMARKS } from '~/composables/useOutboundMath'
import { fmtK } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const ROLE_LABEL: Record<string, string> = { owner: 'Proprietário', admin: 'Admin', bdr: 'BDR' }
const B = OUTBOUND_BENCHMARKS

interface TeamMember {
  id: string; name: string; role: string
  ce: number; rm: number; rr: number; fr: number
  daysLogged: number; activeLeads: number; pipelineValue: number; weightedForecast: number; closedThisMonth: number
  metaMensal: number; ticketMedio: number; hasGoal: boolean
}
interface TeamData { members: TeamMember[]; meta_mensal: number; ticket_medio: number; month: number; year: number }

const { data, pending } = await useAsyncData('mgmt-team', () => $fetch<TeamData>('/api/management/team'))

const bdrs = computed(() => data.value?.members ?? [])
const team = computed(() => {
  const m = bdrs.value
  return {
    ce: m.reduce((s, b) => s + b.ce, 0),
    rm: m.reduce((s, b) => s + b.rm, 0),
    rr: m.reduce((s, b) => s + b.rr, 0),
    fr: m.reduce((s, b) => s + b.fr, 0),
    pipeline: m.reduce((s, b) => s + b.pipelineValue, 0),
    forecast: m.reduce((s, b) => s + b.weightedForecast, 0),
    activeLeads: m.reduce((s, b) => s + b.activeLeads, 0),
  }
})
const teamCeRm = computed(() => team.value.ce > 0 ? ((team.value.rm / team.value.ce) * 100).toFixed(1) : '0.0')

// Ranking: melhores fechadores primeiro (leaderboard)
const rankedBdrs = computed(() => [...bdrs.value].sort((a, b) => b.fr - a.fr || b.ce - a.ce))

// ── Ritmo por BDR (usa a meta individual; fallback meta da org) ──────────
const WORKDAYS = 22
function workdaysElapsed() {
  const now = new Date(); const y = now.getFullYear(), mo = now.getMonth()
  let n = 0
  for (let day = 1; day <= now.getDate(); day++) {
    const wd = new Date(y, mo, day).getDay()
    if (wd > 0 && wd < 6) n++
  }
  return n
}
const elapsed = workdaysElapsed()
function ceNeeded(meta: number, ticket: number) {
  const fech = Math.ceil(meta / (ticket || 1))
  return Math.ceil(Math.ceil(Math.ceil(fech / 0.40) / 0.40) / 0.027)
}
function pace(b: TeamMember) {
  const expected = Math.round(ceNeeded(b.metaMensal, b.ticketMedio) * (elapsed / WORKDAYS))
  if (expected <= 0) return { label: '--', color: 'var(--text-3)' }
  const ratio = b.ce / expected
  if (ratio >= 1)   return { label: 'a frente', color: '#16a34a' }
  if (ratio >= 0.8) return { label: 'no ritmo', color: '#d97706' }
  return { label: 'atrasado', color: '#dc2626' }
}

// ── Alertas de gestao ────────────────────────────────────────────────────
const alerts = computed(() => {
  const out: { kind: string; text: string }[] = []
  const noLog = bdrs.value.filter(b => b.daysLogged === 0)
  if (noLog.length) out.push({ kind: 'log', text: `${noLog.length} BDR(s) sem nenhum registro no diário este mês: ${noLog.map(b => b.name).join(', ')}` })
  const gargalo = bdrs.value.filter(b => b.ce > 20 && (b.rm / b.ce) < 0.015)
  if (gargalo.length) out.push({ kind: 'gargalo', text: `${gargalo.length} BDR(s) com CE→RM abaixo de 1.5%: ${gargalo.map(b => b.name).join(', ')}` })
  const atrasados = bdrs.value.filter(b => pace(b).label === 'atrasado')
  if (atrasados.length) out.push({ kind: 'pace', text: `${atrasados.length} BDR(s) atrasados no ritmo de contatos: ${atrasados.map(b => b.name).join(', ')}` })
  return out
})

// Taxa de conversão colorida vs benchmark
function rate(from: number, to: number, benchmark: number) {
  if (from === 0) return { label: '--', color: 'var(--text-3)' }
  const v = to / from
  const pct = (v * 100).toFixed(v < 0.1 ? 1 : 0) + '%'
  const color = v >= benchmark ? '#16a34a' : v >= benchmark * 0.6 ? '#d97706' : '#dc2626'
  return { label: pct, color }
}

function goBdr(id: string) { navigateTo(`/dashboard/gestao/${id}`) }
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.gm-skel { display:flex;flex-direction:column;gap:8px }
.gm-skel-row { height:54px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite }

.gm-summary { display:flex;align-items:stretch;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 4px;margin-bottom:14px;flex-wrap:wrap }
.gm-sum-item { display:flex;flex-direction:column;gap:2px;padding:0 18px;flex:1;min-width:120px }
.gm-sum-label { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3) }
.gm-sum-value { font-size:var(--num-lg);font-weight:600;color:var(--text-1);letter-spacing:-.01em;line-height:1.1;font-family:var(--font-mono);font-variant-numeric:tabular-nums }
.gm-sum-hint { font-size:11px;color:var(--text-3) }
.gm-sum-div { width:1px;background:var(--border-soft) }

.gm-table-wrap { overflow-x:auto }
.gm-table { width:100%;border-collapse:collapse;font-size:13px }
.gm-table th { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);padding:11px 10px;text-align:right;white-space:nowrap;border-bottom:1px solid var(--border-soft);background:var(--bg-subtle) }
.gm-th-left { text-align:left !important }
.gm-table td { padding:10px;text-align:right;border-bottom:1px solid var(--border-soft);color:var(--text-1);white-space:nowrap }
.gm-td-left { text-align:left !important }
.gm-row { cursor:pointer;transition:background .1s }
.gm-row:hover td { background:var(--bg-subtle) }
.gm-row:last-child td { border-bottom:none }
.gm-bdr { display:flex;align-items:center;gap:9px }
.gm-avatar { width:28px;height:28px;border-radius:50%;background:#EDA398;color:var(--text-1);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0 }
.gm-name { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.gm-role { font-size:11px;color:var(--text-3) }
.gm-rate { font-size:13px;font-weight:600;font-variant-numeric:tabular-nums }
.gm-pace { font-size:12px;font-weight:600 }
.gm-nogoal { color:var(--text-3);margin-left:3px }
.gm-pipe { color:var(--text-2) }

.gm-alerts { display:flex;flex-direction:column;gap:6px;margin-bottom:14px }
.gm-alert { display:flex;align-items:flex-start;gap:8px;background:var(--warn-bg);border:1px solid var(--warn-bd);color:var(--warn);border-radius:10px;padding:10px 14px;font-size:12px;line-height:1.5 }
.gm-days { font-weight:600;font-variant-numeric:tabular-nums }
.gm-legend { font-size:11px;color:var(--text-3);margin-top:10px;line-height:1.5 }
</style>
