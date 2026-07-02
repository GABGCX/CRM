<template>
  <div class="kb-root">
    <div class="kb-scroll">
      <div class="kb-track">
        <div
          v-for="col in columns"
          :key="col.status"
          class="kb-col"
          :class="{ 'kb-col--over': dragOverCol === col.status }"
          @dragover.prevent="onDragOver(col.status)"
          @dragleave="onDragLeave(col.status)"
          @drop.prevent="onDrop(col.status)">

          <!-- Header -->
          <div class="kb-col-head">
            <span class="kb-col-dot" :style="{ background: col.color }" />
            <span class="kb-col-title">{{ col.label }}</span>
            <span class="kb-col-count">{{ col.leads.length }}</span>
          </div>
          <div class="kb-col-accent" :style="{ background: col.color }" />

          <!-- Cards -->
          <div v-auto-animate class="kb-cards">
            <div
              v-for="lead in col.leads"
              :key="lead.id"
              class="kb-card"
              :class="{ 'kb-card--dragging': draggingId === lead.id, 'kb-card--overdue': isOverdue(lead) }"
              draggable="true"
              @dragstart="onDragStart(lead)"
              @dragend="onDragEnd"
              @click="$emit('select', lead)">

              <div class="kb-card-top">
                <span class="kb-card-name">{{ lead.decisor || 'Sem nome' }}</span>
                <span v-if="p.score" class="kb-card-score" :style="{ color: leadScoreColor(calcLeadScore(lead)), background: leadScoreBg(calcLeadScore(lead)) }">
                  {{ calcLeadScore(lead) }}
                </span>
              </div>

              <div v-if="p.company && lead.negocio" class="kb-card-company">{{ lead.negocio }}</div>

              <div v-if="p.tags && leadTags(lead).length" class="kb-card-tags">
                <UiTagChip v-for="t in leadTags(lead)" :key="t.id" :tag="t" />
              </div>

              <div v-if="(p.value && lead.valor_estimado) || (p.returnDate && lead.data_retorno)" class="kb-card-meta">
                <span v-if="p.value && lead.valor_estimado && lead.valor_estimado > 0" class="kb-card-value">R$ {{ fmtK(lead.valor_estimado) }}</span>
                <span v-if="p.returnDate && lead.data_retorno" class="kb-card-date" :style="{ color: retColor(lead.data_retorno) }">
                  <span class="kb-card-date-dot" :style="{ background: retColor(lead.data_retorno) }" />
                  {{ fmtDate(lead.data_retorno) }}
                </span>
              </div>

              <div class="kb-card-foot">
                <div v-if="p.fu" class="kb-fu">
                  <span
                    v-for="fu in sortedFU(lead.followups)"
                    :key="fu.attempt_index"
                    class="kb-fu-dot"
                    :class="{ 'kb-fu-dot--done': fu.completed_at }" />
                </div>
                <span v-else></span>
                <span class="kb-card-days">{{ daysIn(lead.created_at) }}d</span>
              </div>
            </div>

            <div v-if="!col.leads.length" class="kb-empty">Sem leads</div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="kb-ghost">
      <div v-if="draggingName" class="kb-drag-ghost">Movendo {{ draggingName }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'
import type { CardPrefs } from '~/composables/useCardPrefs'
import {
  calcLeadScore, leadScoreColor, leadScoreBg,
  sortedFU, daysIn, isOverdue, fmtK, daysUntil,
} from '~/utils/leadDomain'

type LeadWithFU = Lead & { followups: Followup[] }

const props = defineProps<{ leads: LeadWithFU[]; pending: boolean; prefs?: CardPrefs }>()
const emit  = defineEmits<{ select: [lead: LeadWithFU]; statusChange: [leadId: string, status: LeadStatus] }>()

const ALL_ON: CardPrefs = { company: true, value: true, returnDate: true, score: true, fu: true, tags: true }
const p = computed<CardPrefs>(() => props.prefs ?? ALL_ON)

const { resolve, fetchTags } = useTags()
onMounted(() => fetchTags())
const leadTags = (lead: LeadWithFU) => resolve(lead.tag_ids)

// Ordem das colunas = fluxo do funil
// Paleta dessaturada (mono cobalt): tons harmonicos que distinguem sem competir.
const COLUMN_DEFS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'Novo',               label: 'Novo',             color: '#8a857d' },
  { status: 'Prospecção',         label: 'Prospecção',       color: '#5b6bb0' },
  { status: 'Qualificação',       label: 'Qualificação',     color: '#4f7fa8' },
  { status: 'Aguardando retorno', label: 'Aguardando',      color: '#a87b35' },
  { status: 'Follow-up',          label: 'Follow-up',        color: '#46599a' },
  { status: 'De molho',           label: 'De molho',         color: '#7a6f9c' },
  { status: 'Reunião agendada',   label: 'Reunião agendada', color: '#3f7a74' },
  { status: 'Enviar proposta',    label: 'Enviar proposta',  color: '#a8693f' },
  { status: 'Proposta enviada',   label: 'Proposta enviada', color: '#4f7d8a' },
  { status: 'Fechado',            label: 'Fechado',          color: '#4e8c6a' },
  { status: 'Recusado',           label: 'Recusado',         color: '#b14a44' },
  { status: 'Sem interesse',      label: 'Sem interesse',    color: '#8a857d' },
  { status: 'Não atende',         label: 'Não atende',       color: '#a8a39b' },
]

const draggingId       = ref<string | null>(null)
const draggingName     = ref<string | null>(null)
const dragSourceStatus = ref<LeadStatus | null>(null)
const dragOverCol      = ref<LeadStatus | null>(null)

function onDragStart(lead: LeadWithFU) {
  draggingId.value = lead.id
  draggingName.value = lead.decisor
  dragSourceStatus.value = lead.resultado
}
function onDragEnd() {
  draggingId.value = null; draggingName.value = null
  dragSourceStatus.value = null; dragOverCol.value = null
}
function onDragOver(status: LeadStatus) { dragOverCol.value = status }
function onDragLeave(status: LeadStatus) { if (dragOverCol.value === status) dragOverCol.value = null }
function onDrop(target: LeadStatus) {
  if (!draggingId.value || dragSourceStatus.value === target) { onDragEnd(); return }
  emit('statusChange', draggingId.value, target)
  onDragEnd()
}

const columns = computed(() =>
  COLUMN_DEFS.map(def => ({ ...def, leads: props.leads.filter(l => l.resultado === def.status) }))
)

function fmtDate(iso: string) {
  const diff = daysUntil(iso) ?? 0
  if (diff < 0)  return `${Math.abs(diff)}d atraso`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}
function retColor(iso: string) {
  const diff = daysUntil(iso) ?? 0
  if (diff < 0)  return 'var(--bad)'
  if (diff === 0) return 'var(--warn)'
  if (diff <= 3) return 'var(--warn)'
  return 'var(--text-3)'
}
</script>

<style scoped>
.kb-root { height: calc(100vh - 215px); min-height: 460px; }
.kb-scroll {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.kb-scroll::-webkit-scrollbar { height: 8px; }
.kb-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.kb-track { display: flex; gap: 12px; height: 100%; width: max-content; padding-bottom: 6px; }

/* ── Coluna ──────────────────────────────────────────────── */
.kb-col {
  display: flex;
  flex-direction: column;
  width: 264px;
  flex-shrink: 0;
  background: var(--bg-subtle);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color .15s, background .15s;
}
.kb-col--over { border-color: var(--accent); background: var(--bg-card); }

.kb-col-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 13px 10px;
  flex-shrink: 0;
}
.kb-col-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.kb-col-title {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
  letter-spacing: -.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kb-col-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.kb-col-accent { height: 2px; opacity: .55; flex-shrink: 0; }

.kb-cards {
  flex: 1;
  overflow-y: auto;
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.kb-cards::-webkit-scrollbar { width: 6px; }
.kb-cards::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

/* ── Card ────────────────────────────────────────────────── */
.kb-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: 12px;
  padding: 11px 12px;
  cursor: grab;
  user-select: none;
  box-shadow: var(--shadow-sm);
  transition: border-color .12s, background .12s, box-shadow .12s, transform .12s;
  position: relative;
}
.kb-card:hover { border-color: var(--border); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.kb-card:active { cursor: grabbing; }
.kb-card--dragging { opacity: .4; }
.kb-card--overdue::before {
  content: '';
  position: absolute;
  left: 0; top: 9px; bottom: 9px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: #dc2626;
}

.kb-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}
.kb-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  line-height: 1.35;
  letter-spacing: -.01em;
}
.kb-card-score {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 5px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.kb-card-company {
  font-size: 12px;
  color: var(--text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kb-card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
.kb-card-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
.kb-card-value {
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: rgba(22,163,74,.10);
  border-radius: 4px;
  padding: 1px 6px;
}
.kb-card-date { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; }
.kb-card-date-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.kb-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
}
.kb-fu { display: flex; gap: 2px; }
.kb-fu-dot { width: 6px; height: 6px; border-radius: 2px; background: var(--border); }
.kb-fu-dot--done { background: #16a34a; }
.kb-card-days { font-size: 11px; color: var(--text-3); font-variant-numeric: tabular-nums; }

.kb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  font-size: 12px;
  color: var(--text-3);
  opacity: .6;
}

/* ── Drag ghost ──────────────────────────────────────────── */
.kb-drag-ghost {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text-1);
  color: var(--bg);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 999;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
}
.kb-ghost-enter-active, .kb-ghost-leave-active { transition: all .16s ease; }
.kb-ghost-enter-from, .kb-ghost-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }
</style>
