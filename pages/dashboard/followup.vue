<template>
  <div>
    <div style="margin-bottom:16px">
      <div class="page-title">Follow-up</div>
      <div class="page-sub">Protocolo 10 tentativas · trabalhe a fila de cima para baixo</div>
    </div>

    <!-- Stats strip -->
    <div class="fu-stats">
      <span><strong>{{ activeLeads.length }}</strong> ativos</span>
      <span class="fu-stats-sep">·</span>
      <span :style="{ color: overdue.length ? '#dc2626' : 'var(--text-3)' }"><strong>{{ overdue.length }}</strong> vencidos</span>
      <span class="fu-stats-sep">·</span>
      <span><strong>{{ dueToday.length }}</strong> hoje</span>
      <span class="fu-stats-sep">·</span>
      <span><strong>{{ (leads||[]).filter(l=>l.reuniao_agendada).length }}</strong> reunioes</span>
      <span class="fu-stats-sep">·</span>
      <span style="color:#16a34a"><strong>{{ closedThisMonth }}</strong> fechados/mes</span>
    </div>

    <!-- Log rapido do dia -->
    <div class="ql-bar">
      <div class="ql-bar-head">
        <span class="ql-bar-title">Registrar dia</span>
        <span class="ql-bar-hint">conforme trabalha a fila</span>
      </div>
      <div class="ql-items">
        <div v-for="f in qlFields" :key="f.key" class="ql-item">
          <button class="ql-btn" @click="bump(f.key, -1)" :disabled="day[f.key] === 0" title="Remover">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div class="ql-count">
            <span class="ql-num tabular">{{ day[f.key] }}</span>
            <span class="ql-label">{{ f.label }}</span>
          </div>
          <button class="ql-btn ql-plus" @click="bump(f.key, 1)" :title="`+1 ${f.label}`">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
      <span class="ql-state" :class="{ 'ql-state--saving': saving }">{{ saving ? 'salvando' : 'salvo' }}</span>
    </div>

    <!-- View switch -->
    <div class="seg">
      <button v-for="v in views" :key="v.id" @click="view = v.id"
        class="seg-btn" :class="{ active: view === v.id }">{{ v.label }}</button>
    </div>

    <!-- FILA: cockpit de trabalho (fila + painel) -->
    <div v-if="view === 'fila'">
      <div v-if="pending" class="fu-skel">
        <div v-for="i in 4" :key="i" class="fu-skel-row" />
      </div>

      <div v-else-if="!queueAll.length" class="fu-empty">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div class="fu-empty-title">Tudo em dia</div>
        <div class="fu-empty-sub">Nenhum retorno pendente. Hora de prospectar novos leads.</div>
      </div>

      <div v-else class="fu-cockpit">
        <!-- Fila -->
        <div class="fu-queue">
          <template v-for="group in queueGroups" :key="group.key">
            <div v-if="group.leads.length" class="fu-group-head">
              <span class="fu-group-dot" :style="{ background: group.color }" />
              {{ group.label }}
              <span class="fu-group-count">{{ group.leads.length }}</span>
            </div>
            <button
              v-for="l in group.leads" :key="l.id"
              class="fu-qrow" :class="{ 'fu-qrow--active': selectedId === l.id }"
              @click="select(l)">
              <span class="fu-qbar" :style="{ background: group.color }" />
              <span class="fu-qavatar" :style="{ background: avatarBg(l), color: avatarFg(l) }">
                {{ (l.decisor || 'L')[0].toUpperCase() }}
              </span>
              <span class="fu-qmain">
                <span class="fu-qname">{{ l.decisor || 'Sem nome' }}</span>
                <span class="fu-qcompany">{{ l.negocio || 'Sem empresa' }}</span>
              </span>
              <span class="fu-qmeta">
                <span class="fu-qret" :style="{ color: group.color }">{{ retLabel(l.data_retorno) }}</span>
                <span class="fu-qfu">{{ fuDone(l) }}/10</span>
              </span>
            </button>
          </template>
        </div>

        <!-- Painel de trabalho -->
        <div class="fu-panel">
          <div v-if="!selectedLead" class="fu-panel-empty">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="1.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <div>Selecione um lead da fila para trabalhar</div>
          </div>

          <div v-else class="fu-work">
            <!-- Header -->
            <div class="fu-work-head">
              <div style="min-width:0">
                <div class="fu-work-name">{{ selectedLead.decisor }}</div>
                <div class="fu-work-company">{{ selectedLead.negocio || 'Sem empresa' }} · {{ daysIn(selectedLead.created_at) }}d no funil</div>
              </div>
              <UiStatusTag :status="selectedLead.resultado" />
            </div>

            <!-- Contato -->
            <div class="fu-actions">
              <a v-if="selectedLead.telefone" :href="telHref(selectedLead.telefone)" class="btn fu-call">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 9.81 2 2 0 0 1 2 1.84h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L6.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {{ selectedLead.telefone }}
              </a>
              <a v-if="selectedLead.telefone" :href="waHref(selectedLead.telefone)" target="_blank" class="btn fu-wa">WhatsApp</a>
              <span v-if="!selectedLead.telefone" class="fu-nophone">Sem telefone cadastrado</span>
            </div>

            <!-- Cadencia: proximo passo -->
            <div v-if="nextStep(selectedLead)" class="fu-cadence">
              <span class="fu-cadence-tag">Dia {{ nextStep(selectedLead)!.day_offset }} · {{ nextStep(selectedLead)!.channel }}</span>
              <span v-if="nextStep(selectedLead)!.instruction" class="fu-cadence-text">{{ nextStep(selectedLead)!.instruction }}</span>
            </div>

            <!-- FU tracker -->
            <div class="fu-block-label">Tentativa {{ Math.min(fuDone(selectedLead) + 1, 10) }} de 10</div>
            <div class="fu-grid">
              <button v-for="fu in sortedFU(selectedLead.followups)" :key="fu.attempt_index"
                class="fu-cell" :class="{ 'fu-cell--done': fu.completed_at }"
                @click="onToggle(selectedLead, fu.attempt_index)">
                <span class="fu-cell-n">{{ fu.attempt_index + 1 }}º</span>
                <span class="fu-cell-d">{{ FU_DAYS[fu.attempt_index] }}d</span>
              </button>
            </div>

            <!-- Reagendar retorno -->
            <div class="fu-block-label">Proximo retorno</div>
            <div class="fu-resched">
              <button v-for="opt in [2,4,7]" :key="opt" class="btn fu-resched-btn" @click="setRetorno(opt)">+{{ opt }}d</button>
              <input type="date" v-model="retornoDate" @change="setRetornoDate" class="fu-date" />
            </div>

            <!-- Status -->
            <div class="fu-block-label">Status</div>
            <select :value="selectedLead.resultado" @change="onStatus(selectedLead, ($event.target as HTMLSelectElement).value as LeadStatus)" class="fu-status">
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>

            <!-- Notas -->
            <div class="fu-block-label" style="display:flex;justify-content:space-between">
              <span>Notas</span>
              <span style="color:var(--text-3);font-weight:400">{{ notes.length }}</span>
            </div>
            <textarea v-model="noteInput" rows="2" placeholder="Registrar contexto da ligacao..."
              class="fu-note-input" @keydown.ctrl.enter="postNote" maxlength="2000" />
            <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:6px" :disabled="postingNote || !noteInput.trim()" @click="postNote">
              {{ postingNote ? 'Salvando...' : 'Adicionar nota' }}
            </button>
            <div v-if="notes.length" class="fu-notes">
              <div v-for="n in notes" :key="n.id" class="fu-note">
                <div class="fu-note-body">{{ n.content }}</div>
                <div class="fu-note-meta">{{ n.profiles?.name || 'Voce' }} · {{ fmtDate(n.created_at) }}</div>
              </div>
            </div>

            <!-- Proximo na fila -->
            <button class="btn fu-next" @click="goNext" :disabled="!hasNext">Proximo na fila &rarr;</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TODOS -->
    <div v-else-if="view === 'todos'">
      <div v-if="!activeLeads.length" class="fu-empty-simple">Nenhum lead ativo.</div>
      <UiFuSection v-else title="Todos os leads ativos" :leads="activeLeads" :today="todayStr"
        :cadences="cadences" @toggle="onToggle" @status="onStatus" :show-all="true" />
    </div>

    <!-- PREVISAO -->
    <div v-else-if="view === 'previsao'">
      <div class="card" style="margin-bottom:14px">
        <div class="card-label">Carga de follow-ups nos proximos 7 dias</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">
          <div v-for="d in weekForecast" :key="d.date"
            style="text-align:center;padding:10px 4px;border-radius:8px;border:1px solid"
            :style="d.isToday ? 'background:var(--accent-soft);border-color:var(--accent-bd)' : 'background:var(--bg-subtle);border-color:var(--border-soft)'"
            :title="d.count > 0 ? d.names : undefined">
            <div style="font-size:10px;margin-bottom:4px;font-weight:500" :style="{ color: d.isToday ? '#0f62fe' : 'var(--text-3)' }">
              {{ d.isToday ? 'Hoje' : d.label }}
            </div>
            <div style="font-size:var(--num-md);font-weight:600;color:var(--text-1)" class="tabular">{{ d.count }}</div>
            <div style="height:3px;border-radius:2px;margin-top:6px" :style="{ background: d.color }"></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-label">Protocolo de 10 tentativas</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:16px">
          <div v-for="(d,i) in FU_DAYS" :key="d" style="background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-3);margin-bottom:3px">{{ i+1 }}ª tent.</div>
            <div style="font-size:18px;font-weight:600;color:var(--text-1)">{{ d }}d</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="background:var(--warn-bg);border:1px solid var(--warn-bd);border-radius:10px;padding:14px">
            <div style="font-size:var(--num-hero);font-weight:600;color:var(--warn)" class="tabular">44%</div>
            <div style="font-size:13px;color:var(--warn);margin-top:4px">dos vendedores desistem na <strong>1ª tentativa</strong></div>
          </div>
          <div style="background:var(--ok-bg);border:1px solid var(--ok-bd);border-radius:10px;padding:14px">
            <div style="font-size:var(--num-hero);font-weight:600;color:var(--ok)" class="tabular">80%</div>
            <div style="font-size:13px;color:var(--ok);margin-top:4px">das vendas fecham com <strong>8+ contatos</strong></div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus, Cadence, CadenceStep, LeadNote } from '~/types'
import {
  FU_DAYS, STATUSES, leadUrgency, URGENCY_COLOR, URGENCY_AVATAR,
  fuDone, sortedFU, daysIn, telHref, waHref,
} from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }
type ViewId = 'fila' | 'todos' | 'previsao'

const todayStr  = new Date().toISOString().slice(0, 10)
const view      = ref<ViewId>('fila')
const toastMsg  = ref<string | null>(null)
const showToast = (m: string) => { toastMsg.value = m; setTimeout(() => toastMsg.value = null, 2500) }

const { leads, pending, activeLeads, toggleFU, patchStatus, patchLead } = useLeads()

// Log rapido do dia
const { day, saving, load: loadDiary, bump } = useDiaryToday()
const qlFields = [
  { key: 'ld' as const, label: 'LD' }, { key: 'ce' as const, label: 'CE' },
  { key: 'rm' as const, label: 'RM' }, { key: 'rr' as const, label: 'RR' },
  { key: 'fr' as const, label: 'FR' },
]

const cadences = ref<Cadence[]>([])
onMounted(async () => {
  loadDiary()
  try { cadences.value = await $fetch<Cadence[]>('/api/cadences') } catch {}
})

// ── Fila priorizada ───────────────────────────────────────────────────
const overdue  = computed(() => activeLeads.value.filter(l => leadUrgency(l) === 'overdue'))
const dueToday = computed(() => activeLeads.value.filter(l => leadUrgency(l) === 'today'))
const dueSoon  = computed(() => activeLeads.value.filter(l => leadUrgency(l) === 'soon'))

const queueGroups = computed(() => [
  { key: 'overdue', label: 'Vencidos',        color: URGENCY_COLOR.overdue, leads: overdue.value },
  { key: 'today',   label: 'Hoje',            color: URGENCY_COLOR.today,   leads: dueToday.value },
  { key: 'soon',    label: 'Proximos 3 dias', color: URGENCY_COLOR.soon,    leads: dueSoon.value },
])
const queueAll = computed(() => [...overdue.value, ...dueToday.value, ...dueSoon.value])

const monthStart      = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
const closedThisMonth = computed(() => (leads.value || []).filter(l => l.resultado === 'Fechado' && l.updated_at >= monthStart).length)

const views = [
  { id: 'fila' as const,     label: 'Fila' },
  { id: 'todos' as const,    label: 'Todos' },
  { id: 'previsao' as const, label: 'Previsao' },
]

// ── Selecao + painel de trabalho ──────────────────────────────────────
const selectedId  = ref<string | null>(null)
const selectedLead = computed(() => queueAll.value.find(l => l.id === selectedId.value) || null)
const notes       = ref<LeadNote[]>([])
const noteInput   = ref('')
const postingNote = ref(false)
const retornoDate = ref('')

// Auto-seleciona o primeiro da fila
watch(queueAll, (q) => {
  if (!selectedId.value && q.length) selectedId.value = q[0].id
  if (selectedId.value && !q.find(l => l.id === selectedId.value)) selectedId.value = q[0]?.id ?? null
}, { immediate: true })

watch(selectedId, async (id) => {
  notes.value = []
  noteInput.value = ''
  retornoDate.value = selectedLead.value?.data_retorno || ''
  if (!id) return
  try { notes.value = await $fetch<LeadNote[]>(`/api/leads/${id}/notes`) } catch {}
})

function select(l: LeadWithFU) { selectedId.value = l.id }

const hasNext = computed(() => {
  const i = queueAll.value.findIndex(l => l.id === selectedId.value)
  return i >= 0 && i < queueAll.value.length - 1
})
function goNext() {
  const i = queueAll.value.findIndex(l => l.id === selectedId.value)
  if (i >= 0 && i < queueAll.value.length - 1) selectedId.value = queueAll.value[i + 1].id
}

// ── Cadencia: proximo passo ───────────────────────────────────────────
function nextStep(lead: LeadWithFU): CadenceStep | null {
  if (!lead.cadence_id) return null
  const cad = cadences.value.find(c => c.id === lead.cadence_id)
  if (!cad?.cadence_steps?.length) return null
  const steps = [...cad.cadence_steps].sort((a, b) => a.step_order - b.step_order)
  return steps[fuDone(lead)] || null
}

// ── Acoes ─────────────────────────────────────────────────────────────
async function onToggle(lead: LeadWithFU, idx: number) {
  try { await toggleFU(lead.id, idx) }
  catch { showToast('Erro ao atualizar follow-up.') }
}

async function onStatus(lead: LeadWithFU, resultado: LeadStatus) {
  try { await patchStatus(lead.id, resultado); showToast('Status atualizado!') }
  catch { showToast('Erro ao atualizar status.') }
}

async function setRetorno(days: number) {
  if (!selectedLead.value) return
  const d = new Date(); d.setDate(d.getDate() + days)
  const iso = d.toISOString().slice(0, 10)
  try { await patchLead(selectedLead.value.id, { data_retorno: iso }); showToast(`Retorno em +${days}d`) }
  catch { showToast('Erro ao reagendar.') }
}
async function setRetornoDate() {
  if (!selectedLead.value || !retornoDate.value) return
  try { await patchLead(selectedLead.value.id, { data_retorno: retornoDate.value }); showToast('Retorno agendado') }
  catch { showToast('Erro ao reagendar.') }
}

async function postNote() {
  if (!noteInput.value.trim() || !selectedId.value) return
  postingNote.value = true
  try {
    const note = await $fetch<LeadNote>(`/api/leads/${selectedId.value}/notes`, {
      method: 'POST', body: { content: noteInput.value.trim() },
    })
    notes.value.unshift(note)
    noteInput.value = ''
  } catch { showToast('Erro ao salvar nota.') }
  finally { postingNote.value = false }
}

// ── Helpers de UI ─────────────────────────────────────────────────────
const avatarBg = (l: LeadWithFU) => URGENCY_AVATAR[leadUrgency(l)].bg
const avatarFg = (l: LeadWithFU) => URGENCY_AVATAR[leadUrgency(l)].fg

function retLabel(date: string | null): string {
  if (!date) return ''
  const diff = Math.floor((new Date(date).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86_400_000)
  if (diff < 0)  return `${Math.abs(diff)}d atraso`
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'amanha'
  return `+${diff}d`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ── Previsao ──────────────────────────────────────────────────────────
const weekForecast = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })
    const dayLeads = activeLeads.value.filter(l => l.data_retorno === date)
    const count = dayLeads.length
    const color = count === 0 ? '#e2e8f0' : count <= 3 ? '#16a34a' : count <= 6 ? '#d97706' : '#dc2626'
    const names = dayLeads.map(l => l.decisor || l.negocio || 'Lead').join(', ')
    return { date, label, count, isToday: date === todayStr, color, names }
  })
)
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* ── Stats strip ─────────────────────────────────────────── */
.fu-stats { display:flex;align-items:center;gap:12px;padding:8px 0;margin-bottom:14px;border-bottom:1px solid var(--border-soft);flex-wrap:wrap;font-size:13px;color:var(--text-1) }
.fu-stats strong { font-weight:600 }
.fu-stats span:not(.fu-stats-sep) { color:var(--text-2) }
.fu-stats-sep { color:var(--border) }

/* ── Log rapido ──────────────────────────────────────────── */
.ql-bar { display:flex;align-items:center;gap:16px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:14px;flex-wrap:wrap }
.ql-bar-head { display:flex;flex-direction:column;min-width:0;margin-right:4px }
.ql-bar-title { font-size:12px;font-weight:600;color:var(--text-1) }
.ql-bar-hint { font-size:11px;color:var(--text-3) }
.ql-items { display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:1 }
.ql-item { display:flex;align-items:center;gap:8px;padding:4px 6px;background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px }
.ql-btn { width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-2);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .1s }
.ql-btn:hover:not(:disabled) { border-color:var(--accent);color:var(--accent) }
.ql-btn:disabled { opacity:.35;cursor:not-allowed }
.ql-plus { background:var(--accent);border-color:var(--accent);color:#fff }
.ql-plus:hover:not(:disabled) { background:var(--accent-dark);border-color:var(--accent-dark);color:#fff }
.ql-count { display:flex;flex-direction:column;align-items:center;min-width:30px }
.ql-num { font-size:18px;font-weight:600;color:var(--text-1);line-height:1.1;font-family:var(--font-mono);font-variant-numeric:tabular-nums;letter-spacing:-.01em }
.ql-label { font-size:10px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.04em }
.ql-state { font-size:11px;font-weight:500;color:#16a34a;flex-shrink:0;display:flex;align-items:center;gap:5px }
.ql-state::before { content:'';width:6px;height:6px;border-radius:50%;background:#16a34a }
.ql-state--saving { color:var(--text-3) }
.ql-state--saving::before { background:var(--text-3);animation:pulse 1s infinite }

/* ── Segmented switch ────────────────────────────────────── */
.seg { display:flex;gap:3px;background:var(--bg-subtle);border-radius:10px;padding:3px;width:fit-content;margin-bottom:16px }
.seg-btn { padding:6px 16px;border-radius:8px;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:var(--text-2);transition:all .12s }
.seg-btn.active { background:var(--bg-card);color:var(--text-1);box-shadow:0 1px 3px rgba(0,0,0,.08) }

/* ── Cockpit (fila + painel) ─────────────────────────────── */
.fu-cockpit { display:grid;grid-template-columns:320px 1fr;gap:14px;align-items:start }
@media (max-width:820px){ .fu-cockpit{ grid-template-columns:1fr } }

.fu-queue { display:flex;flex-direction:column;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--bg-card);max-height:calc(100vh - 300px);overflow-y:auto }
.fu-group-head { display:flex;align-items:center;gap:6px;padding:9px 12px 5px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3) }
.fu-group-dot { width:7px;height:7px;border-radius:50%;flex-shrink:0 }
.fu-group-count { margin-left:auto;font-size:10px;color:var(--text-3);background:var(--bg-subtle);border-radius:10px;padding:0 6px }
.fu-qrow { display:flex;align-items:center;gap:9px;width:100%;padding:9px 12px;border:none;border-top:1px solid var(--border-soft);background:transparent;cursor:pointer;text-align:left;position:relative;font-family:inherit;transition:background .1s }
.fu-qrow:hover { background:var(--bg-subtle) }
.fu-qrow--active { background:var(--bg-subtle) }
.fu-qbar { position:absolute;left:0;top:0;bottom:0;width:3px }
.fu-qavatar { width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0 }
.fu-qmain { flex:1;min-width:0;display:flex;flex-direction:column }
.fu-qname { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.fu-qcompany { font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.fu-qmeta { display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0 }
.fu-qret { font-size:11px;font-weight:600 }
.fu-qfu { font-size:10px;color:var(--text-3) }

/* ── Painel de trabalho ──────────────────────────────────── */
.fu-panel { border:1px solid var(--border);border-radius:12px;background:var(--bg-card);min-height:300px }
.fu-panel-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;height:300px;color:var(--text-3);font-size:13px;text-align:center }
.fu-work { padding:18px 20px }
.fu-work-head { display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:14px }
.fu-work-name { font-size:17px;font-weight:600;color:var(--text-1);letter-spacing:-.01em }
.fu-work-company { font-size:13px;color:var(--text-2);margin-top:2px }
.fu-actions { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px }
.fu-call { color:#16a34a;border-color:var(--ok-bd);background:var(--ok-bg) }
.fu-wa { color:#16a34a;border-color:var(--ok-bd);background:var(--ok-bg) }
.fu-nophone { font-size:12px;color:var(--text-3) }
.fu-cadence { display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--accent-soft);border:1px solid var(--accent-bd);border-radius:8px;padding:8px 12px;margin-bottom:14px }
.fu-cadence-tag { font-size:11px;font-weight:600;color:#3730a3;white-space:nowrap }
.fu-cadence-text { font-size:12px;color:var(--text-2) }
.fu-block-label { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);margin:14px 0 7px }
.fu-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:5px }
.fu-cell { border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;border:1px solid var(--border);background:var(--bg-subtle);transition:all .12s;font-family:inherit;display:flex;flex-direction:column;gap:2px }
.fu-cell--done { background:var(--ok-bg);border-color:var(--ok-bd) }
.fu-cell-n { font-size:12px;font-weight:500;color:var(--text-2) }
.fu-cell--done .fu-cell-n { color:#16a34a }
.fu-cell-d { font-size:10px;color:var(--text-3) }
.fu-resched { display:flex;gap:6px;align-items:center;flex-wrap:wrap }
.fu-resched-btn { padding:5px 12px }
.fu-date { width:auto;flex:1;min-width:130px }
.fu-status { width:100% }
.fu-note-input { resize:vertical;width:100% }
.fu-notes { display:flex;flex-direction:column;gap:7px;margin-top:12px }
.fu-note { background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px;padding:10px 12px }
.fu-note-body { font-size:13px;color:var(--text-1);line-height:1.5;white-space:pre-wrap }
.fu-note-meta { font-size:11px;color:var(--text-3);margin-top:5px }
.fu-next { width:100%;justify-content:center;margin-top:16px }

/* ── Estados ─────────────────────────────────────────────── */
.fu-skel { display:flex;flex-direction:column;gap:6px }
.fu-skel-row { height:60px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite }
.fu-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:52px 24px;text-align:center }
.fu-empty-title { font-size:15px;font-weight:600;color:var(--text-1) }
.fu-empty-sub { font-size:13px;color:var(--text-2) }
.fu-empty-simple { text-align:center;padding:52px;color:var(--text-3);font-size:13px }
</style>
