<template>
  <div class="card border border-surface-3 overflow-hidden mb-2">
    <!-- Header row -->
    <div class="flex items-center gap-3 cursor-pointer" @click="open = !open">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-sm text-ink">{{ lead.decisor || 'Sem nome' }}</span>
          <span class="text-xs text-ink-subtle truncate">{{ lead.negocio }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <!-- FU dots -->
        <div class="flex gap-0.5">
          <div v-for="fu in sortedFU" :key="fu.attempt_index"
            class="w-2 h-2 rounded-sm"
            :style="{ background: fu.completed_at ? '#3b82f6' : '#1e293b', border: '1px solid #334155' }"
          />
        </div>
        <span class="text-[10px] text-ink-subtle">{{ fuDone }}/10</span>
        <!-- Return badge -->
        <span v-if="lead.data_retorno" class="badge text-[10px] font-bold"
          :style="{ background: retBadgeColor+'22', color: retBadgeColor, border: `1px solid ${retBadgeColor}44` }"
        >{{ retLabel }}</span>
        <!-- Status badge -->
        <span class="badge text-[10px]"
          :style="{ background: statusColor+'22', color: statusColor, border: `1px solid ${statusColor}44` }"
        >{{ lead.resultado }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
          class="text-ink-ghost transition-transform" :class="open ? 'rotate-180' : ''">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>

    <!-- Expanded -->
    <Transition name="expand">
      <div v-if="open || expanded" class="mt-4 pt-4 border-t border-surface-3">
        <!-- FU buttons -->
        <div class="flex gap-2 mb-4 flex-wrap">
          <button
            v-for="fu in sortedFU" :key="fu.attempt_index"
            @click="$emit('toggleFu', lead, fu.attempt_index)"
            class="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all text-center"
            style="min-width:48px"
            :style="{
              background: fu.completed_at ? '#1d4ed822' : '#1e293b',
              borderColor: fu.completed_at ? '#3b82f6' : '#334155',
            }"
          >
            <span class="text-xs font-bold" :class="fu.completed_at ? 'text-blue-400' : 'text-ink-ghost'">{{ fu.attempt_index+1 }}º</span>
            <span class="text-[9px] text-ink-ghost">{{ FU_DAYS[fu.attempt_index] }}d</span>
            <svg v-if="fu.completed_at" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <div v-else class="w-2.5 h-2.5" />
          </button>
        </div>

        <!-- Quick status + phone -->
        <div class="flex gap-3 items-center flex-wrap">
          <div class="flex items-center gap-2">
            <label class="text-xs text-ink-subtle">Status:</label>
            <select class="text-xs py-1 px-2 h-auto w-auto"
              :value="lead.resultado"
              @change="$emit('status', lead, ($event.target as HTMLSelectElement).value as LeadStatus)"
            >
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <a v-if="lead.telefone" :href="`tel:${lead.telefone}`"
            class="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {{ lead.telefone }}
          </a>
          <span class="text-xs text-ink-ghost ml-auto">{{ daysInFunnel }}d no funil</span>
        </div>

        <p v-if="lead.info" class="mt-3 text-xs text-ink-muted bg-surface-3 rounded-lg px-3 py-2 italic">"{{ lead.info }}"</p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'

type LeadWithFU = Lead & { followups: Followup[] }

const props = defineProps<{ lead: LeadWithFU; expanded?: boolean }>()
defineEmits<{
  toggleFu: [lead: LeadWithFU, idx: number]
  status:   [lead: LeadWithFU, s: LeadStatus]
}>()

const open = ref(false)

const FU_DAYS = [2,4,6,8,10,12,14,16,18,20]
const STATUS_COLORS: Record<string,string> = {
  'Aguardando retorno':'#F59E0B','Follow-up':'#3B82F6','De molho':'#8B5CF6',
  'Reunião agendada':'#10B981','Enviar proposta':'#F97316','Proposta enviada':'#06B6D4',
  'Fechado':'#22C55E','Recusado':'#EF4444','Sem interesse':'#6B7280','Não atende':'#9CA3AF',
}
const STATUSES: LeadStatus[] = [
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado','Sem interesse','Não atende',
]

const sortedFU = computed(() => [...(props.lead.followups||[])].sort((a,b) => a.attempt_index - b.attempt_index))
const fuDone   = computed(() => sortedFU.value.filter(f => f.completed_at).length)
const statusColor = computed(() => STATUS_COLORS[props.lead.resultado] || '#64748b')
const daysInFunnel = computed(() => Math.floor((Date.now() - new Date(props.lead.created_at).getTime()) / 86400000))

const diff = computed(() => {
  if (!props.lead.data_retorno) return null
  const t = new Date(); t.setHours(0,0,0,0)
  return Math.floor((new Date(props.lead.data_retorno).getTime() - t.getTime()) / 86400000)
})

const retBadgeColor = computed(() =>
  diff.value === null ? '#475569' :
  diff.value < 0 ? '#ef4444' :
  diff.value === 0 ? '#f97316' :
  diff.value <= 3 ? '#fbbf24' : '#22c55e'
)
const retLabel = computed(() =>
  diff.value === null ? 'Sem data' :
  diff.value < 0  ? `${Math.abs(diff.value)}d atraso` :
  diff.value === 0 ? 'Hoje' :
  `+${diff.value}d`
)
</script>
