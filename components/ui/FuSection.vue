<template>
  <div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:500;margin-bottom:8px" :style="{ color: titleColor || '#737373' }">
      {{ title }}
    </div>
    <div style="display:flex;flex-direction:column;gap:4px">
      <div v-for="lead in leads" :key="lead.id"
        class="card" style="padding:10px 12px;cursor:pointer"
        @click="expanded[lead.id] = !expanded[lead.id]">
        <!-- Row header -->
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:500;color:#0a0a0a">{{ lead.decisor }}</div>
            <div style="font-size:11px;color:#737373;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ lead.negocio }}</div>
          </div>
          <!-- FU dots -->
          <div style="display:flex;gap:2px;flex-shrink:0">
            <div v-for="fu in sortedFU(lead.followups)" :key="fu.attempt_index"
              class="fu-dot" :class="fu.completed_at ? 'fu-dot-done' : 'fu-dot-todo'"></div>
          </div>
          <span style="font-size:10px;color:#a3a3a3">{{ fuDone(lead) }}/10</span>
          <!-- Return badge -->
          <span v-if="lead.data_retorno" class="tag" :class="retTagClass(lead.data_retorno)">{{ retLabel(lead.data_retorno) }}</span>
          <!-- Status badge -->
          <span class="tag tag-gray" style="font-size:10px">{{ lead.resultado }}</span>
          <svg :style="{ transform: expanded[lead.id] ? 'rotate(180deg)' : '', transition:'transform .15s', flexShrink:0 }"
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" stroke-width="2.5" stroke-linecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        <!-- Expanded -->
        <div v-if="expanded[lead.id] || showAll" style="margin-top:10px;padding-top:10px;border-top:1px solid #f5f5f5">
          <!-- FU buttons -->
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
            <button v-for="fu in sortedFU(lead.followups)" :key="fu.attempt_index"
              @click.stop="$emit('toggle', lead, fu.attempt_index)"
              style="min-width:44px;padding:6px 4px;border-radius:6px;border:1px solid;cursor:pointer;text-align:center;font-family:inherit;transition:all .1s"
              :style="fu.completed_at ? 'background:#f0fdf4;border-color:#bbf7d0' : 'background:#f9f9f9;border-color:#f0f0f0'">
              <div style="font-size:11px;font-weight:500" :style="{ color: fu.completed_at ? '#16a34a' : '#525252' }">{{ fu.attempt_index+1 }}º</div>
              <div style="font-size:9px;color:#a3a3a3">{{ FU_DAYS[fu.attempt_index] }}d</div>
            </button>
          </div>
          <!-- Quick controls -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <a v-if="lead.telefone" :href="`tel:${lead.telefone}`" @click.stop
              style="display:flex;align-items:center;gap:4px;font-size:12px;color:#16a34a;text-decoration:none">
              <i class="ti ti-phone" style="font-size:13px" aria-hidden="true"></i>
              {{ lead.telefone }}
            </a>
            <select :value="lead.resultado" @click.stop
              @change.stop="$emit('status', lead, ($event.target as HTMLSelectElement).value)"
              style="font-size:11px;padding:4px 8px;height:auto;width:auto;border-radius:6px">
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
            <span style="font-size:11px;color:#a3a3a3;margin-left:auto">{{ daysIn(lead.created_at) }}d no funil</span>
          </div>
          <div v-if="lead.info"
            style="margin-top:8px;font-size:11px;color:#737373;background:#f9f9f9;border-radius:6px;padding:8px 10px;font-style:italic">
            "{{ lead.info }}"
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'

type LeadWithFU = Lead & { followups: Followup[] }

defineProps<{
  title: string
  titleColor?: string
  leads: LeadWithFU[]
  today: string
  showAll?: boolean
}>()

defineEmits<{
  toggle: [lead: LeadWithFU, idx: number]
  status: [lead: LeadWithFU, s: LeadStatus]
}>()

const FU_DAYS = [2,4,6,8,10,12,14,16,18,20]
const STATUSES: LeadStatus[] = [
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado','Sem interesse','Não atende',
]

const expanded = reactive<Record<string,boolean>>({})

const fuDone   = (l: LeadWithFU) => (l.followups||[]).filter(f=>f.completed_at).length
const sortedFU = (fus: Followup[]) => [...(fus||[])].sort((a,b)=>a.attempt_index-b.attempt_index)
const daysIn   = (dt: string) => Math.floor((Date.now()-new Date(dt).getTime())/86400000)

function daysUntil(d: string) {
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.floor((new Date(d).getTime()-t.getTime())/86400000)
}

function retTagClass(d: string) {
  const diff = daysUntil(d)
  return diff < 0 ? 'tag-red' : diff === 0 ? 'tag-amber' : 'tag-blue'
}

function retLabel(d: string) {
  const diff = daysUntil(d)
  if (diff < 0)  return `${Math.abs(diff)}d atraso`
  if (diff === 0) return 'hoje'
  return `+${diff}d`
}
</script>
