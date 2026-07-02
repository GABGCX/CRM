<template>
  <div>
    <div style="margin-bottom:20px">
      <div class="eyebrow" style="margin-bottom:6px">Planejamento reverso</div>
      <div class="page-title">Metas e Ritmo</div>
      <div class="page-sub">Matemática reversa · da meta ao contato diário</div>
    </div>

    <!-- Barra de meta (inputs que dirigem tudo) -->
    <div class="mr-meta">
      <div class="mr-meta-field">
        <label class="input-label">Meta de faturamento mensal</label>
        <div class="mr-meta-input"><span>R$</span><input type="number" v-model.number="localMeta" min="0" step="500" @input="debounceSave" /></div>
      </div>
      <div class="mr-meta-field">
        <label class="input-label">Ticket médio</label>
        <div class="mr-meta-input"><span>R$</span><input type="number" v-model.number="localTicket" min="0" step="100" @input="debounceSave" /></div>
      </div>
      <div class="mr-meta-note">Estes dois valores recalculam todos os numeros de ouro em tempo real.</div>
    </div>

    <!-- Números de ouro: funil horizontal -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-label">Números de ouro · da meta ao contato diário</div>
      <div class="mr-chain">
        <template v-for="(row, i) in mathChain" :key="row.label">
          <div class="mr-chain-step">
            <div class="mr-chain-label">{{ row.label }}</div>
            <div class="mr-chain-value tabular">{{ row.value }}</div>
            <div v-if="row.perDay" class="mr-chain-perday tabular">{{ row.perDay }}/dia útil</div>
            <div v-else-if="row.note" class="mr-chain-note">{{ row.note }}</div>
          </div>
          <div v-if="i < mathChain.length-1" class="mr-chain-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span v-if="row.rate" class="mr-chain-rate">{{ row.rate }}</span>
          </div>
        </template>
      </div>
    </div>

    <!-- Taxas reais + gargalo -->
    <div class="mr-grid">
      <div class="card">
        <div class="card-label">Taxas reais · {{ MONTH_NAMES[currentMonth-1] }}</div>
        <div v-if="diaryPending" style="display:flex;flex-direction:column;gap:10px">
          <div v-for="i in 4" :key="i" style="height:44px;background:var(--bg-subtle);border-radius:8px;animation:pulse 1.5s infinite" />
        </div>
        <div v-else v-for="r in convRates" :key="r.label"
          style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border-soft)">
          <div>
            <div style="font-size:13px;color:var(--text-1);font-weight:500">{{ r.label }}</div>
            <div style="font-size:11px;color:var(--text-3)">benchmark: {{ r.benchmark }}</div>
          </div>
          <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:5px">
            <span style="font-size:20px;font-weight:600" class="tabular"
              :style="{ color: r.status === 'ok' ? 'var(--ok)' : r.status === 'warn' ? 'var(--warn)' : 'var(--bad)' }">
              {{ r.value }}%
            </span>
            <div style="width:120px;height:6px;background:var(--border-soft);border-radius:3px;overflow:hidden">
              <div style="height:100%;border-radius:3px;transition:width .4s"
                :style="{ width: Math.min(100, r.raw / r.benchmarkRaw * 100) + '%',
                  background: r.status === 'ok' ? 'var(--ok)' : r.status === 'warn' ? 'var(--warn)' : 'var(--bad)' }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gargalo -->
      <div v-if="bottleneck" :style="bottleneck.style" style="border-radius:12px;padding:18px;border:1px solid;align-self:start">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:.8" v-html="bottleneck.icon" />
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;opacity:.7">{{ bottleneck.iconLabel }}</span>
        </div>
        <div style="font-size:14px;font-weight:600;margin-bottom:5px">{{ bottleneck.title }}</div>
        <div style="font-size:13px;opacity:.85;line-height:1.6">{{ bottleneck.body }}</div>
        <div style="margin-top:12px;font-size:12px;font-weight:600;opacity:.85">{{ bottleneck.action }}</div>
      </div>
    </div>

    <!-- Forecasting -->
    <div class="card" style="margin-top:12px">
      <div class="card-label">Previsão de receita</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--border);border-radius:8px;overflow:hidden">
        <div style="padding:16px;border-right:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text-2);margin-bottom:6px">Pipeline total</div>
          <div class="metric-value" style="font-size:22px">
            {{ pipelineTotal > 0 ? 'R$ ' + pipelineTotal.toLocaleString('pt-BR') : '--' }}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">{{ leadsComValor }} leads com valor</div>
        </div>
        <div style="padding:16px;border-right:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text-2);margin-bottom:6px">Pipeline quente</div>
          <div class="metric-value" style="font-size:22px"
            :style="{ color: hotPipeline > 0 ? 'var(--ok)' : 'var(--text-1)' }">
            {{ hotPipeline > 0 ? 'R$ ' + hotPipeline.toLocaleString('pt-BR') : '--' }}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">Reunião + Proposta enviada</div>
        </div>
        <div style="padding:16px">
          <div style="font-size:11px;color:var(--text-2);margin-bottom:6px">vs. Meta mensal</div>
          <div class="metric-value" style="font-size:22px"
            :style="{ color: forecastVsMeta >= 100 ? 'var(--ok)' : forecastVsMeta >= 60 ? 'var(--warn)' : 'var(--bad)' }">
            {{ hotPipeline > 0 ? forecastVsMeta.toFixed(0) + '%' : '--' }}
          </div>
          <div style="font-size:11px;color:var(--text-3);margin-top:4px">Meta: R$ {{ localMeta.toLocaleString('pt-BR') }}</div>
        </div>
      </div>
      <div v-if="leadsComValor === 0" style="margin-top:12px;font-size:12px;color:var(--text-2);text-align:center;padding:8px;background:var(--bg-subtle);border-radius:6px">
        Adicione um valor estimado nos leads do pipeline para ver a previsão de receita.
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { isHot, isActive, localDateISO } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { org, fetchProfile } = useProfile()

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now          = new Date()
const currentMonth = now.getMonth() + 1
const currentYear  = now.getFullYear()
const toast        = ref<string|null>(null)
const showToast    = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }

const localMeta   = ref((org.value?.settings?.meta_mensal  || 10000) as number)
const localTicket = ref((org.value?.settings?.ticket_medio || 2000)  as number)

watch(org, o => {
  if (!o) return
  localMeta.value   = o.settings?.meta_mensal  || 10000
  localTicket.value = o.settings?.ticket_medio || 2000
}, { immediate: true })

// ── useOutboundMath substitui toda a lógica duplicada ──────────────────
const {
  mathChain,
  TX_CE_RM, TX_RM_RR, TX_RR_FR,
} = useOutboundMath(localMeta, localTicket)

// ── Fetch dados reais do mês ────────────────────────────────────────────
const { data: diaryRows, pending: diaryPending } = await useAsyncData(
  'math-diary',
  async () => {
    const ms = `${currentYear}-${String(currentMonth).padStart(2,'0')}-01`
    const me = localDateISO(new Date(currentYear, currentMonth, 0))
    const { data } = await supabase.from('daily_diary').select('ce,rm,rr,fr')
      .gte('date', ms).lte('date', me)
    return data || []
  }
)

const totals = computed(() => (diaryRows.value||[]).reduce(
  (a,e) => ({ ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ce:0, rm:0, rr:0, fr:0 }
))

const realCERM = computed(() => totals.value.ce > 0 ? (totals.value.rm/totals.value.ce)*100 : 0)
const realRMRR = computed(() => totals.value.rm > 0 ? (totals.value.rr/totals.value.rm)*100 : 0)
const realRRFR = computed(() => totals.value.rr > 0 ? (totals.value.fr/totals.value.rr)*100 : 0)

const convRates = computed(() => [
  { label:'LD → CE', value:'45.0', benchmark:'45%', benchmarkRaw:45, raw:45, status:'ok' as const },
  { label:'CE → RM', value:realCERM.value.toFixed(1), benchmark:'2.7%', benchmarkRaw:2.7, raw:realCERM.value,
    status: realCERM.value >= 2.5 ? 'ok' : realCERM.value >= 1.5 ? 'warn' : 'bad' },
  { label:'RM → RR', value:realRMRR.value.toFixed(0), benchmark:'40%', benchmarkRaw:40, raw:realRMRR.value,
    status: realRMRR.value >= 35 ? 'ok' : realRMRR.value >= 20 ? 'warn' : 'bad' },
  { label:'RR → FR', value:realRRFR.value.toFixed(0), benchmark:'40%', benchmarkRaw:40, raw:realRRFR.value,
    status: realRRFR.value >= 35 ? 'ok' : realRRFR.value >= 20 ? 'warn' : 'bad' },
])

const ICON_ALERT = '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
const ICON_CHECK = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'

const bottleneck = computed(() => {
  const t = totals.value
  if (t.ce === 0) return null
  if (realRRFR.value < 20 && t.rr > 0) return {
    title:     'Gargalo: conversão de reunião em fechamento (RR→FR)',
    body:      `Taxa atual: ${realRRFR.value.toFixed(0)}% contra benchmark de 40%.`,
    action:    'Foco: técnica de negociação e fechamento, não em prospecção.',
    style:     'background:var(--bad-bg);border-color:var(--bad-bd);color:var(--bad)',
    icon:      ICON_ALERT,
    iconLabel: 'Gargalo identificado',
  }
  if (realCERM.value < 1.5 && t.ce > 20) return {
    title:     'Gargalo: conversão de contato em reunião (CE→RM)',
    body:      `Taxa CE→RM atual: ${realCERM.value.toFixed(1)}% contra benchmark de 2.7%.`,
    action:    'Foco: script de abertura e geração de interesse.',
    style:     'background:var(--warn-bg);border-color:var(--warn-bd);color:var(--warn)',
    icon:      ICON_ALERT,
    iconLabel: 'Gargalo identificado',
  }
  return {
    title:     'Taxas dentro do benchmark',
    body:      `CE→RM: ${realCERM.value.toFixed(1)}% · RM→RR: ${realRMRR.value.toFixed(0)}%. Continue no ritmo.`,
    action:    'Mantenha o volume diário de contatos.',
    style:     'background:var(--ok-bg);border-color:var(--ok-bd);color:var(--ok)',
    icon:      ICON_CHECK,
    iconLabel: 'No ritmo certo',
  }
})

// ── Forecasting ────────────────────────────────────────────
const { leads: allLeads } = useLeads()

const leadsComValor = computed(() =>
  (allLeads.value ?? []).filter(l => l.valor_estimado && l.valor_estimado > 0 && isActive(l)).length
)

const pipelineTotal = computed(() =>
  (allLeads.value ?? [])
    .filter(l => l.valor_estimado && isActive(l))
    .reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
)

const hotPipeline = computed(() =>
  (allLeads.value ?? [])
    .filter(l => l.valor_estimado && isHot(l))
    .reduce((s, l) => s + (l.valor_estimado ?? 0), 0)
)

const forecastVsMeta = computed(() =>
  localMeta.value > 0 ? (hotPipeline.value / localMeta.value) * 100 : 0
)

let saveTimer: ReturnType<typeof setTimeout>
async function debounceSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await $fetch('/api/settings', {
        method: 'PATCH',
        body: { meta_mensal: localMeta.value, ticket_medio: localTicket.value },
      })
      await fetchProfile()
      showToast('Metas atualizadas!')
    } catch {}
  }, 800)
}
</script>

<style>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: .4; }
}
</style>

<style scoped>
/* ── Barra de meta ───────────────────────────────────────── */
.mr-meta { display:flex;align-items:flex-end;gap:16px;background:var(--bg-card);border:1px solid var(--border);border-radius:12px;padding:14px 16px;margin-bottom:12px;flex-wrap:wrap }
.mr-meta-field { display:flex;flex-direction:column;gap:4px }
.mr-meta-input { display:flex;align-items:center;gap:6px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;padding:0 10px }
.mr-meta-input span { font-size:13px;color:var(--text-3);font-weight:500 }
.mr-meta-input input { border:none;background:transparent;padding:8px 0;width:120px;font-size:15px;font-weight:600;color:var(--text-1) }
.mr-meta-input input:focus { outline:none;box-shadow:none }
.mr-meta-note { flex:1;min-width:180px;font-size:12px;color:var(--text-3);line-height:1.5 }

/* ── Funil horizontal de numeros de ouro ─────────────────── */
.mr-chain { display:flex;align-items:stretch;gap:0;overflow-x:auto;padding:4px 0 }
.mr-chain-step { flex:1;min-width:120px;text-align:center;padding:10px 8px;border:1px solid var(--border-soft);border-radius:10px;background:var(--bg-subtle);display:flex;flex-direction:column;gap:3px;justify-content:center }
.mr-chain-label { font-size:11px;font-weight:600;color:var(--text-2);white-space:nowrap }
.mr-chain-value { font-size:var(--num-lg);font-weight:600;color:var(--text-1);letter-spacing:-.01em;line-height:1.1;font-family:var(--font-mono);font-variant-numeric:tabular-nums;white-space:nowrap }
.mr-chain-perday { font-size:11px;color:var(--accent);font-weight:600 }
.mr-chain-note { font-size:10px;color:var(--text-3) }
.mr-chain-arrow { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--text-3);flex-shrink:0;padding:0 4px }
.mr-chain-rate { font-size:9px;font-weight:600;color:var(--text-3);white-space:nowrap }

/* ── Grid taxas + gargalo ────────────────────────────────── */
.mr-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px }
@media (max-width:820px){ .mr-grid{ grid-template-columns:1fr } }
</style>
