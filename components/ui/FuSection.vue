<template>
  <div class="fu-list">
    <div class="fu-list-header">
      <span class="fu-list-header-title" :style="{ color: titleColor || 'var(--text-2)' }">{{ title }}</span>
      <span class="fu-list-header-count">{{ leads.length }}</span>
    </div>

    <div v-for="lead in leads" :key="lead.id">
      <div class="fu-row" @click="expanded[lead.id] = !expanded[lead.id]">
        <div class="fu-urgency" :style="{ background: urgencyColor(lead) }" />

        <div class="fu-initial" :style="initialStyle(lead)">
          {{ (lead.decisor || lead.negocio || '?')[0].toUpperCase() }}
        </div>

        <div class="fu-main">
          <div class="fu-name">{{ lead.decisor }}</div>
          <div class="fu-company">{{ lead.negocio }}</div>
        </div>

        <div class="fu-dots">
          <div v-for="fu in sortedFU(lead.followups)" :key="fu.attempt_index"
            class="fu-dot-sm"
            :style="{ background: fu.completed_at ? '#16a34a' : 'var(--border)' }" />
        </div>

        <span v-if="lead.data_retorno"
          style="font-size:11px;font-weight:500;flex-shrink:0;padding:2px 7px;border-radius:4px;white-space:nowrap"
          :style="retStyle(lead.data_retorno)">
          {{ retLabel(lead.data_retorno) }}
        </span>

        <span style="font-size:11px;background:var(--border-soft);color:var(--text-2);padding:2px 7px;border-radius:4px;white-space:nowrap;flex-shrink:0">
          {{ lead.resultado }}
        </span>

        <div class="fu-actions" @click.stop>
          <a v-if="lead.telefone" :href="`tel:${lead.telefone}`"
            class="fu-action-btn fu-action-btn--phone">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z"/>
            </svg>
            Ligar
          </a>
          <button v-if="fuDone(lead) < 10" class="fu-action-btn" @click.stop="$emit('toggle', lead, fuDone(lead))">
            FU feito
          </button>
        </div>

        <svg :style="{ transform: expanded[lead.id] ? 'rotate(180deg)' : '', transition:'transform .15s', flexShrink:0 }"
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      <div v-if="expanded[lead.id] || showAll" class="fu-expanded">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:10px">
          <button v-for="fu in sortedFU(lead.followups)" :key="fu.attempt_index"
            @click.stop="$emit('toggle', lead, fu.attempt_index)"
            style="padding:7px 4px;border-radius:6px;border:1px solid;cursor:pointer;text-align:center;font-family:inherit;transition:all .12s"
            :style="fu.completed_at
              ? 'background:var(--ok-bg);border-color:var(--ok-bd)'
              : 'background:var(--bg-subtle);border-color:var(--border)'">
            <div style="font-size:12px;font-weight:500"
              :style="{ color: fu.completed_at ? '#16a34a' : 'var(--text-2)' }">{{ fu.attempt_index+1 }}º</div>
            <div style="font-size:10px;color:var(--text-3)">{{ FU_DAYS[fu.attempt_index] }}d</div>
          </button>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <a v-if="lead.telefone && nextCadenceStep(lead)?.channel === 'WhatsApp'"
            :href="`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`"
            target="_blank" rel="noopener" @click.stop
            style="display:flex;align-items:center;gap:4px;font-size:12px;color:#16a34a;text-decoration:none;font-weight:500;background:var(--ok-bg);border:1px solid var(--ok-bd);border-radius:4px;padding:3px 8px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
            </svg>
            WhatsApp
          </a>
          <select :value="lead.resultado" @click.stop
            @change.stop="$emit('status', lead, ($event.target as HTMLSelectElement).value as LeadStatus)"
            style="font-size:12px;padding:5px 8px;height:auto;width:auto;border-radius:6px">
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
          <span style="font-size:11px;color:var(--text-3);margin-left:auto">{{ daysIn(lead.created_at) }}d no funil</span>
        </div>

        <div v-if="nextCadenceStep(lead)"
          style="font-size:12px;background:var(--accent-soft);border:1px solid var(--accent-bd);border-radius:6px;padding:8px 12px;display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0f2480" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" v-html="channelIconHtml(nextCadenceStep(lead)!.channel)" />
          <div>
            <span style="font-weight:600;color:#0f2480">Dia {{ nextCadenceStep(lead)!.day_offset }} via {{ nextCadenceStep(lead)!.channel }}</span>
            <template v-if="nextCadenceStep(lead)!.instruction">
              <span style="color:var(--text-2);margin-left:5px">· {{ nextCadenceStep(lead)!.instruction }}</span>
            </template>
          </div>
        </div>

        <div v-if="lead.info"
          style="font-size:12px;color:var(--text-2);background:var(--bg-subtle);border-radius:6px;padding:8px 12px;font-style:italic">
          "{{ lead.info }}"
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus, Cadence } from '~/types'

type LeadWithFU = Lead & { followups: Followup[] }

const props = defineProps<{
  title: string
  titleColor?: string
  leads: LeadWithFU[]
  today: string
  showAll?: boolean
  cadences?: Cadence[]
}>()

defineEmits<{
  toggle: [lead: LeadWithFU, idx: number]
  status: [lead: LeadWithFU, s: LeadStatus]
}>()

const FU_DAYS = [2,4,6,8,10,12,14,16,18,20]

const CHANNEL_ICON: Record<string, string> = {
  'Ligacao':   '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z"/>',
  'Email':     '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  'LinkedIn':  '<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>',
  'WhatsApp':  '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
  'Outro':     '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
}
function channelIconHtml(ch: string): string { return CHANNEL_ICON[ch] || '' }

const STATUSES: LeadStatus[] = [
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado','Sem interesse','Não atende',
]

const expanded = reactive<Record<string,boolean>>({})

function nextCadenceStep(lead: LeadWithFU) {
  if (!lead.cadence_id || !props.cadences) return null
  const cad = props.cadences.find(c => c.id === lead.cadence_id)
  if (!cad) return null
  const done = (lead.followups || []).filter(f => f.completed_at).length
  return cad.cadence_steps[done] ?? null
}

const fuDone   = (l: LeadWithFU) => (l.followups||[]).filter(f=>f.completed_at).length
const sortedFU = (fus: Followup[]) => [...(fus||[])].sort((a,b)=>a.attempt_index-b.attempt_index)
const daysIn   = (dt: string) => Math.floor((Date.now()-new Date(dt).getTime())/86400000)

function daysUntil(d: string) {
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.floor((new Date(d).getTime()-t.getTime())/86400000)
}

function urgencyColor(lead: LeadWithFU): string {
  if (!lead.data_retorno) return '#e2e8f0'
  const diff = daysUntil(lead.data_retorno)
  if (diff < 0) return '#ef4444'
  if (diff === 0) return '#f59e0b'
  if (diff <= 3) return '#193497'
  return '#e2e8f0'
}

function initialStyle(lead: LeadWithFU): Record<string, string> {
  if (!lead.data_retorno) return { background: '#f1f5f9', color: '#475569' }
  const diff = daysUntil(lead.data_retorno)
  if (diff < 0)  return { background: '#fef2f2', color: '#dc2626' }
  if (diff === 0) return { background: '#fffbeb', color: '#d97706' }
  if (diff <= 3) return { background: '#eaefff', color: '#193497' }
  return { background: '#f1f5f9', color: '#475569' }
}

function retStyle(d: string): Record<string, string> {
  const diff = daysUntil(d)
  if (diff < 0)  return { background: '#fef2f2', color: '#dc2626' }
  if (diff === 0) return { background: '#fffbeb', color: '#d97706' }
  return { background: '#f1f5f9', color: '#475569' }
}

function retLabel(d: string): string {
  const diff = daysUntil(d)
  if (diff < 0)  return `${Math.abs(diff)}d atraso`
  if (diff === 0) return 'hoje'
  return `+${diff}d`
}
</script>

<style scoped>
.fu-list { border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden; margin-bottom: 16px; }

.fu-list-header { display:flex; align-items:center; justify-content:space-between; padding: 8px 14px; background: var(--bg-subtle); border-bottom: 1px solid var(--border-soft); }
.fu-list-header-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
.fu-list-header-count { font-size: 11px; font-weight: 600; color: var(--text-3); background: var(--border-soft); border-radius: 4px; padding: 1px 7px; }

.fu-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--border-soft); cursor: pointer; transition: background .08s; position: relative; }
.fu-row:last-child { border-bottom: none; }
.fu-row:hover { background: rgba(0,0,0,.018); }

.fu-urgency { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.fu-initial { width: 26px; height: 26px; border-radius: 6px; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; flex-shrink:0; }
.fu-main { flex:1; min-width:0; }
.fu-name { font-size: 13px; font-weight: 500; color: var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.fu-company { font-size: 12px; color: var(--text-2); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.fu-dots { display: flex; gap: 2px; flex-shrink: 0; }
.fu-dot-sm { width: 6px; height: 6px; border-radius: 2px; }

.fu-actions { display: flex; gap: 4px; opacity: 0; transition: opacity .1s; flex-shrink: 0; }
.fu-row:hover .fu-actions { opacity: 1; }
.fu-action-btn { display:flex; align-items:center; gap:3px; padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-card); font-size: 11px; font-weight: 500; color: var(--text-2); cursor: pointer; font-family: inherit; white-space: nowrap; text-decoration: none; }
.fu-action-btn:hover { background: var(--bg-subtle); border-color: var(--border); }
.fu-action-btn--phone { color: #16a34a; border-color: var(--ok-bd); background: var(--ok-bg); }

.fu-expanded { padding: 10px 14px 12px; border-bottom: 1px solid var(--border-soft); background: var(--bg-subtle); padding-left: 27px; }
</style>
