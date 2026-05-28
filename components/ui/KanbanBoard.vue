<template>
  <div class="kb-root">

    <!-- Scroll container -->
    <div class="kb-scroll" ref="scrollEl">
      <div class="kb-track">

        <div
          v-for="col in columns"
          :key="col.status"
          class="kb-col"
          :class="{ 'kb-col--over': dragOverCol === col.status }"
          @dragover.prevent="onDragOver(col.status)"
          @dragleave="onDragLeave(col.status)"
          @drop.prevent="onDrop(col.status)"
        >
          <!-- Column header -->
          <div class="kb-col-header">
            <div class="kb-col-dot" :style="{ background: col.color }" />
            <span class="kb-col-title">{{ col.label }}</span>
            <span class="kb-col-count">{{ col.leads.length }}</span>
          </div>

          <!-- Drop zone hint -->
          <div
            class="kb-dropzone"
            :class="{ 'kb-dropzone--active': dragOverCol === col.status && dragSourceStatus !== col.status }"
          >
            <span>Soltar aqui</span>
          </div>

          <!-- Cards -->
          <div class="kb-cards">
            <div
              v-for="lead in col.leads"
              :key="lead.id"
              class="kb-card"
              :class="{
                'kb-card--dragging': draggingId === lead.id,
                'kb-card--overdue': isOverdue(lead),
              }"
              draggable="true"
              @dragstart="onDragStart(lead)"
              @dragend="onDragEnd"
              @click="$emit('select', lead)"
            >
              <!-- Top row -->
              <div class="kb-card-top">
                <span class="kb-card-name">{{ lead.decisor }}</span>
                <span v-if="isOverdue(lead)" class="kb-card-overdue-badge">vencido</span>
              </div>

              <!-- Company -->
              <div v-if="lead.negocio" class="kb-card-company">{{ lead.negocio }}</div>

              <!-- Return date chip -->
              <div v-if="lead.data_retorno" class="kb-card-date"
                :style="{ color: retColor(lead.data_retorno) }">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8"  y1="2" x2="8"  y2="6"/>
                  <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                {{ fmtDate(lead.data_retorno) }}
              </div>

              <!-- FU dots + meta -->
              <div class="kb-card-footer">
                <div class="kb-fu-dots">
                  <div
                    v-for="fu in sortedFU(lead.followups)"
                    :key="fu.attempt_index"
                    class="kb-fu-dot"
                    :class="fu.completed_at ? 'kb-fu-dot--done' : ''"
                  />
                </div>
                <span class="kb-card-days">{{ daysIn(lead.created_at) }}d</span>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="!col.leads.length" class="kb-empty">
              <span>Nenhum lead</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Drag ghost (follows cursor via CSS) -->
    <Transition name="kb-toast">
      <div v-if="draggingName" class="kb-drag-ghost">
        {{ draggingName }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'

type LeadWithFU = Lead & { followups: Followup[] }

const props = defineProps<{
  leads:   LeadWithFU[]
  pending: boolean
}>()

const emit = defineEmits<{
  select:       [lead: LeadWithFU]
  statusChange: [leadId: string, status: LeadStatus]
}>()

// ── Column definitions (order defines board flow) ───────────────────
const COLUMN_DEFS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'Aguardando retorno', label: 'Aguardando',       color: '#f59e0b' },
  { status: 'Follow-up',         label: 'Follow-up',         color: '#3b82f6' },
  { status: 'De molho',          label: 'De molho',          color: '#8b5cf6' },
  { status: 'Reunião agendada',  label: 'Reunião agendada',  color: '#0d9488' },
  { status: 'Enviar proposta',   label: 'Enviar proposta',   color: '#f97316' },
  { status: 'Proposta enviada',  label: 'Proposta enviada',  color: '#06b6d4' },
  { status: 'Fechado',           label: 'Fechado ✓',         color: '#16a34a' },
  { status: 'Recusado',          label: 'Recusado',          color: '#ef4444' },
  { status: 'Sem interesse',     label: 'Sem interesse',     color: '#6b7280' },
  { status: 'Não atende',        label: 'Não atende',        color: '#9ca3af' },
]

// ── Drag state ────────────────────────────────────────────────────────
const draggingId     = ref<string | null>(null)
const draggingName   = ref<string | null>(null)
const dragSourceStatus = ref<LeadStatus | null>(null)
const dragOverCol    = ref<LeadStatus | null>(null)

function onDragStart(lead: LeadWithFU) {
  draggingId.value       = lead.id
  draggingName.value     = lead.decisor
  dragSourceStatus.value = lead.resultado
}

function onDragEnd() {
  draggingId.value       = null
  draggingName.value     = null
  dragSourceStatus.value = null
  dragOverCol.value      = null
}

function onDragOver(status: LeadStatus) {
  dragOverCol.value = status
}

function onDragLeave(status: LeadStatus) {
  if (dragOverCol.value === status) dragOverCol.value = null
}

function onDrop(targetStatus: LeadStatus) {
  if (!draggingId.value || dragSourceStatus.value === targetStatus) {
    onDragEnd()
    return
  }
  emit('statusChange', draggingId.value, targetStatus)
  onDragEnd()
}

// ── Derived columns ────────────────────────────────────────────────
const columns = computed(() =>
  COLUMN_DEFS.map(def => ({
    ...def,
    leads: props.leads.filter(l => l.resultado === def.status),
  }))
)

// ── Helpers ────────────────────────────────────────────────────────
const sortedFU = (fus: Followup[]) =>
  [...(fus || [])].sort((a, b) => a.attempt_index - b.attempt_index)

const daysIn = (dt: string) =>
  Math.floor((Date.now() - new Date(dt).getTime()) / 86_400_000)

function fmtDate(iso: string) {
  const diff = Math.floor(
    (new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86_400_000
  )
  if (diff < 0)  return `${Math.abs(diff)}d atraso`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanhã'
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })
}

function retColor(iso: string) {
  const diff = Math.floor(
    (new Date(iso).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86_400_000
  )
  if (diff < 0)  return '#ef4444'
  if (diff === 0) return '#f97316'
  if (diff <= 3) return '#f59e0b'
  return '#a3a3a3'
}

function isOverdue(lead: LeadWithFU) {
  if (!lead.data_retorno) return false
  return new Date(lead.data_retorno).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) &&
    !['Fechado','Recusado','Sem interesse'].includes(lead.resultado)
}
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────── */
.kb-root {
  position: relative;
  height: calc(100vh - 220px);
  min-height: 400px;
}

/* ── Horizontal scroll track ──────────────────────────────────────── */
.kb-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  padding-bottom: 8px;
  /* custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #e5e5e5 transparent;
}
.kb-scroll::-webkit-scrollbar       { height: 6px }
.kb-scroll::-webkit-scrollbar-track { background: transparent }
.kb-scroll::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 3px }

.kb-track {
  display: flex;
  gap: 10px;
  height: 100%;
  padding: 2px 2px 8px;
  width: max-content;
}

/* ── Column ───────────────────────────────────────────────────────── */
.kb-col {
  display: flex;
  flex-direction: column;
  width: 220px;
  flex-shrink: 0;
  background: #f9f9f9;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
}
.kb-col--over {
  border-color: #0a0a0a;
  box-shadow: 0 0 0 3px rgba(10,10,10,.06);
}

/* ── Column header ────────────────────────────────────────────────── */
.kb-col-header {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 12px 8px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.kb-col-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.kb-col-title {
  font-size: 11px;
  font-weight: 600;
  color: #0a0a0a;
  letter-spacing: .01em;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kb-col-count {
  font-size: 10px;
  font-weight: 600;
  color: #a3a3a3;
  background: #f0f0f0;
  padding: 1px 6px;
  border-radius: 20px;
  flex-shrink: 0;
}

/* ── Drop zone ────────────────────────────────────────────────────── */
.kb-dropzone {
  display: none;
  align-items: center;
  justify-content: center;
  margin: 8px;
  border: 1.5px dashed #d4d4d4;
  border-radius: 6px;
  padding: 10px;
  font-size: 11px;
  color: #a3a3a3;
  transition: all .15s;
}
.kb-dropzone--active {
  display: flex;
  border-color: #0a0a0a;
  color: #0a0a0a;
  background: rgba(10,10,10,.03);
}

/* ── Cards scroll area ────────────────────────────────────────────── */
.kb-cards {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
  scrollbar-color: #e5e5e5 transparent;
}

/* ── Card ─────────────────────────────────────────────────────────── */
.kb-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 10px 11px;
  cursor: grab;
  user-select: none;
  transition: box-shadow .12s, transform .12s, border-color .12s, opacity .12s;
}
.kb-card:hover {
  border-color: #d4d4d4;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  transform: translateY(-1px);
}
.kb-card:active {
  cursor: grabbing;
}
.kb-card--dragging {
  opacity: .35;
  transform: scale(.97);
}
.kb-card--overdue {
  border-left: 3px solid #ef4444;
}

.kb-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 3px;
}
.kb-card-name {
  font-size: 12px;
  font-weight: 600;
  color: #0a0a0a;
  line-height: 1.3;
  word-break: break-word;
}
.kb-card-overdue-badge {
  font-size: 9px;
  font-weight: 600;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
  white-space: nowrap;
}
.kb-card-company {
  font-size: 11px;
  color: #737373;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kb-card-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 8px;
}

.kb-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.kb-fu-dots {
  display: flex;
  gap: 2px;
}
.kb-fu-dot {
  width: 6px;
  height: 6px;
  border-radius: 1.5px;
  background: #f0f0f0;
  border: 1px solid #e5e5e5;
}
.kb-fu-dot--done {
  background: #16a34a;
  border-color: #16a34a;
}
.kb-card-days {
  font-size: 10px;
  color: #a3a3a3;
}

/* ── Empty column ─────────────────────────────────────────────────── */
.kb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  font-size: 11px;
  color: #d4d4d4;
}

/* ── Drag ghost label ─────────────────────────────────────────────── */
.kb-drag-ghost {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: #0a0a0a;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 999;
  white-space: nowrap;
}
.kb-toast-enter-active { transition: all .18s ease }
.kb-toast-leave-active { transition: all .14s ease }
.kb-toast-enter-from,
.kb-toast-leave-to     { opacity: 0; transform: translateX(-50%) translateY(6px) }
</style>