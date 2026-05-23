<template>
  <div>
    <div style="margin-bottom:16px">
      <div class="page-title">Números de ouro</div>
      <div class="page-sub">Matemática reversa · da meta ao contato diário</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <!-- Reverse math chain -->
      <div class="card">
        <div class="card-label">Meta → contatos necessários</div>
        <div v-for="(row, i) in mathChain" :key="row.label">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0"
            :style="{ borderBottom: i < mathChain.length-1 ? '1px solid #f5f5f5' : 'none' }">
            <div>
              <div style="font-size:13px;color:#0a0a0a;font-weight:500">{{ row.label }}</div>
              <div v-if="row.note" style="font-size:11px;color:#a3a3a3;margin-top:1px">{{ row.note }}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:22px;font-weight:500;color:#0a0a0a" class="tabular">{{ row.value }}</div>
              <div v-if="row.perDay" style="font-size:11px;color:#737373" class="tabular">{{ row.perDay }}/dia útil</div>
            </div>
          </div>
          <!-- Arrow between rows -->
          <div v-if="i < mathChain.length-1 && row.rate" style="display:flex;align-items:center;gap:6px;padding:2px 0 2px 12px">
            <div style="width:1px;height:14px;background:#e5e5e5;margin-left:4px"></div>
            <span style="font-size:10px;color:#a3a3a3">tx: {{ row.rate }}</span>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        <!-- Real conversion rates -->
        <div class="card">
          <div class="card-label">Taxas reais · {{ MONTH_NAMES[currentMonth-1] }}</div>
          <div v-for="r in convRates" :key="r.label"
            style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f5f5f5">
            <div>
              <div style="font-size:12px;color:#0a0a0a;font-weight:500">{{ r.label }}</div>
              <div style="font-size:11px;color:#a3a3a3">benchmark: {{ r.benchmark }}</div>
            </div>
            <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px">
              <span style="font-size:18px;font-weight:500" class="tabular"
                :style="{ color: r.status === 'ok' ? '#16a34a' : r.status === 'warn' ? '#d97706' : '#dc2626' }">
                {{ r.value }}%
              </span>
              <div style="width:80px;height:3px;background:#f0f0f0;border-radius:2px;overflow:hidden">
                <div style="height:100%;border-radius:2px;transition:width .4s"
                  :style="{ width: Math.min(100, r.raw / r.benchmarkRaw * 100) + '%', background: r.status === 'ok' ? '#16a34a' : r.status === 'warn' ? '#d97706' : '#dc2626' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottleneck -->
        <div v-if="bottleneck" :style="bottleneck.style" style="border-radius:8px;padding:14px;border:1px solid">
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;opacity:.7">
            Gargalo identificado
          </div>
          <div style="font-size:13px;font-weight:500;margin-bottom:4px">{{ bottleneck.title }}</div>
          <div style="font-size:12px;opacity:.8;line-height:1.6">{{ bottleneck.body }}</div>
          <div style="margin-top:10px;font-size:11px;font-weight:600;opacity:.8">💡 {{ bottleneck.action }}</div>
        </div>

        <!-- Settings -->
        <div class="card">
          <div class="card-label">Ajustar metas</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Meta de faturamento (R$)</div>
              <input type="number" v-model.number="localMeta" min="0" step="500" @input="debounceSave" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Ticket médio (R$)</div>
              <input type="number" v-model.number="localTicket" min="0" step="100" @input="debounceSave" />
            </div>
            <div style="font-size:11px;color:#a3a3a3;padding:8px;background:#f9f9f9;border-radius:6px">
              Alterar aqui recalcula todos os números de ouro em tempo real.
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">✓ {{ toast }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const supabase = useSupabaseClient()
const { org, fetchProfile } = useProfile()

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const now = new Date()
const currentMonth = now.getMonth() + 1
const currentYear  = now.getFullYear()
const toast = ref<string|null>(null)
const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }

const localMeta   = ref((org.value?.settings?.meta_mensal  || 10000) as number)
const localTicket = ref((org.value?.settings?.ticket_medio || 2000)  as number)

watch(org, o => {
  if (!o) return
  localMeta.value   = o.settings?.meta_mensal  || 10000
  localTicket.value = o.settings?.ticket_medio || 2000
}, { immediate: true })

// Constants (taxas do mercado outbound B2B)
const TX_CE_RM = 0.027  // 2.7% benchmark
const TX_RM_RR = 0.40   // 40%
const TX_RR_FR = 0.40   // 40%
const TX_LD_CE = 0.45   // 45% ligações → contatos efetivos
const WORKDAYS  = 22

// Derived math
const fechNec  = computed(() => Math.ceil(localMeta.value / (localTicket.value || 1)))
const rrNec    = computed(() => Math.ceil(fechNec.value  / TX_RR_FR))
const rmNec    = computed(() => Math.ceil(rrNec.value   / TX_RM_RR))
const ceNec    = computed(() => Math.ceil(rmNec.value   / TX_CE_RM))
const ldNec    = computed(() => Math.ceil(ceNec.value   / TX_LD_CE))

const mathChain = computed(() => [
  { label:'Meta de faturamento', value:`R$ ${localMeta.value.toLocaleString('pt-BR')}`,        note:'', rate: null, perDay:null },
  { label:'Ticket médio',        value:`R$ ${localTicket.value.toLocaleString('pt-BR')}`,      note:'', rate: null, perDay:null },
  { label:'Fechamentos',         value: fechNec.value,  note:'contratos assinados',            rate: `taxa RR→FR ${(TX_RR_FR*100).toFixed(0)}%`, perDay: null },
  { label:'Reuniões realizadas', value: rrNec.value,    note:'sessões estratégicas',           rate: `taxa RM→RR ${(TX_RM_RR*100).toFixed(0)}%`, perDay: `${Math.ceil(rrNec.value/WORKDAYS)}` },
  { label:'Reuniões marcadas',   value: rmNec.value,    note:'agendamentos confirmados',       rate: `taxa CE→RM ${(TX_CE_RM*100).toFixed(1)}%`, perDay: `${Math.ceil(rmNec.value/WORKDAYS)}` },
  { label:'Contatos efetivos',   value: ceNec.value,    note:'decisores que atenderam',        rate: `taxa LD→CE ${(TX_LD_CE*100).toFixed(0)}%`, perDay: `${Math.ceil(ceNec.value/WORKDAYS)}` },
  { label:'Ligações discadas',   value: ldNec.value,    note:'total de tentativas no mês',     rate: null, perDay: `${Math.ceil(ldNec.value/WORKDAYS)}` },
])

// Fetch month data for real rates
const { data: diaryRows } = await useAsyncData('math-diary', async () => {
  const ms = `${currentYear}-${String(currentMonth).padStart(2,'0')}-01`
  const me = new Date(currentYear, currentMonth, 0).toISOString().slice(0,10)
  const { data } = await supabase.from('daily_diary').select('ce,rm,rr,fr').gte('date',ms).lte('date',me)
  return data || []
})

const totals = computed(() => (diaryRows.value||[]).reduce(
  (a,e) => ({ ce:a.ce+e.ce, rm:a.rm+e.rm, rr:a.rr+e.rr, fr:a.fr+e.fr }),
  { ce:0, rm:0, rr:0, fr:0 }
))

const realCERM = computed(() => totals.value.ce > 0 ? (totals.value.rm/totals.value.ce)*100 : 0)
const realRMRR = computed(() => totals.value.rm > 0 ? (totals.value.rr/totals.value.rm)*100 : 0)
const realRRFR = computed(() => totals.value.rr > 0 ? (totals.value.fr/totals.value.rr)*100 : 0)

const convRates = computed(() => [
  { label:'LD → CE', value: '45.0', benchmark:'45%', benchmarkRaw:45, raw:45, status:'ok' as const },
  { label:'CE → RM', value: realCERM.value.toFixed(1), benchmark:'2.7%', benchmarkRaw:2.7, raw:realCERM.value, status: realCERM.value >= 2.5 ? 'ok' : realCERM.value >= 1.5 ? 'warn' : 'bad' as any },
  { label:'RM → RR', value: realRMRR.value.toFixed(0), benchmark:'40%', benchmarkRaw:40, raw:realRMRR.value, status: realRMRR.value >= 35 ? 'ok' : realRMRR.value >= 20 ? 'warn' : 'bad' as any },
  { label:'RR → FR', value: realRRFR.value.toFixed(0), benchmark:'40%', benchmarkRaw:40, raw:realRRFR.value, status: realRRFR.value >= 35 ? 'ok' : realRRFR.value >= 20 ? 'warn' : 'bad' as any },
])

const bottleneck = computed(() => {
  const t = totals.value
  if (t.ce === 0) return null
  if (realRRFR.value < 20 && t.rr > 0) return {
    title: 'Gargalo: conversão de reunião em fechamento (RR→FR)',
    body: `Você está marcando e fazendo reuniões, mas não está fechando. Taxa atual: ${realRRFR.value.toFixed(0)}% contra benchmark de 40%.`,
    action: 'Foco: técnica de negociação e fechamento, não em prospecção.',
    style: 'background:#fef2f2;border-color:#fecaca;color:#7f1d1d',
  }
  if (realCERM.value < 1.5 && t.ce > 20) return {
    title: 'Gargalo: conversão de contato em reunião (CE→RM)',
    body: `Taxa CE→RM atual: ${realCERM.value.toFixed(1)}% contra benchmark de 2.7%. O pitch de abertura precisa evoluir.`,
    action: 'Foco: script de abertura e geração de interesse.',
    style: 'background:#fffbeb;border-color:#fde68a;color:#78350f',
  }
  return {
    title: 'Taxas dentro do benchmark',
    body: `CE→RM: ${realCERM.value.toFixed(1)}% · RM→RR: ${realRMRR.value.toFixed(0)}%. Continue no ritmo.`,
    action: 'Mantenha o volume diário de contatos.',
    style: 'background:#f0fdf4;border-color:#bbf7d0;color:#14532d',
  }
})

// Debounced save to settings
let saveTimer: ReturnType<typeof setTimeout>
async function debounceSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    try {
      await $fetch('/api/settings', { method:'PATCH', body:{ meta_mensal:localMeta.value, ticket_medio:localTicket.value } })
      await fetchProfile()
      showToast('Metas atualizadas!')
    } catch {}
  }, 800)
}
</script>
