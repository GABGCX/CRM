<template>
  <div>
    <div style="margin-bottom:16px">
      <div class="page-title">Follow-up</div>
      <div class="page-sub">Protocolo 10 tentativas · intervalo 2 em 2 dias</div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div class="metric-card" v-for="s in statCards" :key="s.label">
        <div class="metric-label">{{ s.label }}</div>
        <div class="metric-value" :class="s.valueClass">{{ s.value }}</div>
        <div class="metric-sub">{{ s.sub }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:2px;background:#f5f5f5;border-radius:8px;padding:3px;width:fit-content;margin-bottom:14px">
      <button v-for="t in tabs" :key="t.id" @click="activeTab=t.id"
        style="padding:5px 14px;border-radius:6px;border:none;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .1s"
        :style="activeTab===t.id ? 'background:#fff;color:#0a0a0a;box-shadow:0 1px 2px rgba(0,0,0,.08)' : 'background:transparent;color:#737373'">
        {{ t.label }}
      </button>
    </div>

    <!-- URGENTE -->
    <div v-if="activeTab==='urgente'">
      <div v-if="!urgentLeads.length" style="text-align:center;padding:48px;color:#a3a3a3;font-size:13px">
        Todos os follow-ups estão em dia!
      </div>
      <template v-else>
        <FuSection v-if="overdue.length"   title="Vencidos" title-color="#dc2626" :leads="overdue"   :today="todayStr" @toggle="toggleFU" @status="patchStatus" />
        <FuSection v-if="dueToday.length"  title="Hoje"     title-color="#d97706" :leads="dueToday"  :today="todayStr" @toggle="toggleFU" @status="patchStatus" />
        <FuSection v-if="dueSoon.length"   title="Próximos 3 dias" title-color="#2563eb" :leads="dueSoon" :today="todayStr" @toggle="toggleFU" @status="patchStatus" />
      </template>
    </div>

    <!-- TODOS -->
    <div v-if="activeTab==='todos'">
      <div v-if="!activeLeads.length" style="text-align:center;padding:48px;color:#a3a3a3;font-size:13px">Nenhum lead ativo.</div>
      <FuSection v-else title="Todos os leads ativos" :leads="activeLeads" :today="todayStr" @toggle="toggleFU" @status="patchStatus" :show-all="true" />
    </div>

    <!-- PREVISÃO -->
    <div v-if="activeTab==='previsao'">
      <div class="card" style="margin-bottom:12px">
        <div class="card-label">Carga de follow-ups — próximos 7 dias</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
          <div v-for="d in weekForecast" :key="d.date"
            style="text-align:center;padding:10px 4px;border-radius:6px;border:1px solid"
            :style="d.isToday ? 'background:#eff6ff;border-color:#bfdbfe' : 'background:#f9f9f9;border-color:#f0f0f0'">
            <div style="font-size:10px;margin-bottom:4px" :style="{ color: d.isToday ? '#2563eb' : '#a3a3a3' }">
              {{ d.isToday ? 'Hoje' : d.label }}
            </div>
            <div style="font-size:20px;font-weight:500;color:#0a0a0a" class="tabular">{{ d.count }}</div>
            <div style="height:3px;border-radius:2px;margin-top:6px" :style="{ background: d.color }"></div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px">
        <div class="card-label">Protocolo de 10 tentativas</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px">
          <div v-for="(d,i) in FU_DAYS" :key="d"
            style="background:#f5f5f5;border-radius:6px;padding:10px;text-align:center">
            <div style="font-size:10px;color:#a3a3a3;margin-bottom:2px">{{ i+1 }}ª tent.</div>
            <div style="font-size:18px;font-weight:500;color:#0a0a0a">{{ d }}d</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px">
            <div style="font-size:22px;font-weight:500;color:#d97706" class="tabular">44%</div>
            <div style="font-size:12px;color:#92400e;margin-top:3px">dos vendedores desistem na <strong>1ª tentativa</strong></div>
          </div>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px">
            <div style="font-size:22px;font-weight:500;color:#16a34a" class="tabular">80%</div>
            <div style="font-size:12px;color:#14532d;margin-top:3px">das vendas fecham com <strong>8 ou mais contatos</strong></div>
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
import type { Lead, Followup, LeadStatus } from '~/types'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }
type TabId = 'urgente' | 'todos' | 'previsao'
type Tab = { id: TabId; label: string }

const FU_DAYS  = [2,4,6,8,10,12,14,16,18,20]
const activeTab = ref<TabId>('urgente')
const toast     = ref<string|null>(null)
const todayStr  = new Date().toISOString().slice(0,10)
const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }

const daysUntil = (d: string) => {
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.floor((new Date(d).getTime() - t.getTime()) / 86400000)
}

const { data: allLeads, refresh } = await useAsyncData<LeadWithFU[]>(
  'fu-all-leads', () => $fetch('/api/leads'), { default:()=>[] }
)

const activeLeads = computed(() => (allLeads.value||[]).filter(l =>
  !['Fechado','Recusado','Sem interesse'].includes(l.resultado)
))

const overdue  = computed(() => activeLeads.value.filter(l => l.data_retorno && daysUntil(l.data_retorno) < 0))
const dueToday = computed(() => activeLeads.value.filter(l => l.data_retorno && daysUntil(l.data_retorno) === 0))
const dueSoon  = computed(() => activeLeads.value.filter(l => l.data_retorno && daysUntil(l.data_retorno) > 0 && daysUntil(l.data_retorno) <= 3))
const urgentLeads = computed(() => [...overdue.value, ...dueToday.value, ...dueSoon.value])

const tabs = computed<Tab[]>(() => [
  { id:'urgente',  label: `Urgente${urgentLeads.value.length ? ` (${urgentLeads.value.length})` : ''}` },
  { id:'todos',    label: `Todos (${activeLeads.value.length})` },
  { id:'previsao', label: 'Previsão' },
])

const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
const statCards = computed(() => [
  { label:'Leads ativos',       value: activeLeads.value.length,                                                     sub:'sem fechamento/recusa',  valueClass:'' },
  { label:'Vencidos',           value: overdue.value.length,                                                         sub:'ligar agora',            valueClass: overdue.value.length > 0 ? 'metric-bad' : '' },
  { label:'Reuniões agendadas', value: (allLeads.value||[]).filter(l=>l.reuniao_agendada).length,                    sub:'aguardando realização',  valueClass:'' },
  { label:'Fechados no mês',    value: (allLeads.value||[]).filter(l=>l.resultado==='Fechado'&&l.updated_at>=monthStart).length, sub:'este mês', valueClass:'metric-ok' },
])

// Week forecast
const weekForecast = computed(() => {
  const days = Array.from({ length:7 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()+i)
    const date  = d.toISOString().slice(0,10)
    const label = d.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit' })
    const count = activeLeads.value.filter(l => l.data_retorno === date).length
    const color = count === 0 ? '#e5e5e5' : count <= 3 ? '#16a34a' : count <= 6 ? '#d97706' : '#dc2626'
    return { date, label, count, isToday: date === todayStr, color }
  })
  return days
})

async function toggleFU(lead: LeadWithFU, idx: number) {
  const fu = lead.followups.find(f => f.attempt_index === idx)
  const done = !fu?.completed_at
  const l = (allLeads.value||[]).find(l => l.id===lead.id)
  if (l) { const f = l.followups.find(f=>f.attempt_index===idx); if(f) f.completed_at = done ? new Date().toISOString() : null }
  await $fetch(`/api/leads/${lead.id}/followup`, { method:'PATCH', body:{ attempt_index:idx, completed:done } })
}

async function patchStatus(lead: LeadWithFU, resultado: LeadStatus) {
  const l = (allLeads.value||[]).find(l=>l.id===lead.id)
  if (l) l.resultado = resultado
  await $fetch(`/api/leads/${lead.id}`, { method:'PATCH', body:{ resultado } })
  showToast('Status atualizado!')
}
</script>
