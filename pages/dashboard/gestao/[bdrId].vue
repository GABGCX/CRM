<template>
  <div>
    <NuxtLink to="/dashboard/gestao" class="gd-back">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Equipe
    </NuxtLink>

    <div v-if="pending" class="gd-skel" />

    <template v-else-if="data">
      <div style="margin-bottom:16px">
        <div class="page-title">{{ data.profile.name || 'BDR' }}</div>
        <div class="page-sub">{{ ROLE_LABEL[data.profile.role] || data.profile.role }} · {{ MONTH_NAMES[(data.month||1)-1] }} {{ data.year }}</div>
      </div>

      <!-- Totais do mês -->
      <div class="gd-stats">
        <div v-for="s in stats" :key="s.label" class="gd-stat">
          <div class="gd-stat-label">{{ s.label }}</div>
          <div class="gd-stat-value">{{ s.value }}</div>
          <div class="gd-stat-sub" :style="{ color: s.color }">{{ s.sub }}</div>
        </div>
      </div>

      <!-- Gargalo -->
      <div class="gd-bottleneck" :style="bottleneck.style">
        <div class="gd-bn-eyebrow">{{ bottleneck.eyebrow }}</div>
        <div class="gd-bn-title">{{ bottleneck.title }}</div>
        <div class="gd-bn-body">{{ bottleneck.body }}</div>
        <div class="gd-bn-action">{{ bottleneck.action }}</div>
      </div>

      <!-- Meta individual -->
      <div class="card" style="margin-bottom:14px">
        <div class="card-label">Meta individual {{ data.hasGoal ? '' : '· usando meta da organização' }}</div>
        <div class="gd-goal">
          <div class="gd-goal-field">
            <label>Meta mensal (R$)</label>
            <input type="number" v-model.number="goalMeta" min="0" step="500" />
          </div>
          <div class="gd-goal-field">
            <label>Ticket médio (R$)</label>
            <input type="number" v-model.number="goalTicket" min="0" step="100" />
          </div>
          <button class="btn btn-primary" :disabled="savingGoal" @click="saveGoal" style="flex-shrink:0">
            {{ savingGoal ? '...' : 'Salvar meta' }}
          </button>
          <span v-if="goalToast" class="gd-goal-toast">{{ goalToast }}</span>
        </div>
      </div>

      <!-- Leads do BDR -->
      <div class="card">
        <div class="card-label">Leads ({{ data.leads.length }})</div>
        <div v-if="!data.leads.length" style="padding:16px;text-align:center;color:var(--text-3);font-size:13px">Nenhum lead atribuido.</div>
        <div v-else class="gd-leads">
          <div v-for="l in data.leads" :key="l.id" class="gd-lead">
            <NuxtLink :to="`/dashboard/pipeline?highlight=${l.id}`" class="gd-lead-link">
              <div class="gd-lead-name">{{ l.decisor || 'Sem nome' }}</div>
              <div class="gd-lead-company">{{ l.negocio || 'Sem empresa' }}</div>
            </NuxtLink>
            <span v-if="l.valor_estimado" class="gd-lead-value">R$ {{ fmtK(l.valor_estimado) }}</span>
            <UiStatusTag :status="l.resultado" />
            <select v-if="otherMembers.length" class="gd-reassign" title="Reatribuir a outro BDR" @change="reassign(l.id, $event)">
              <option value="">Mover...</option>
              <option v-for="mb in otherMembers" :key="mb.id" :value="mb.id">{{ mb.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Coaching / 1-on-1 -->
      <div class="card" style="margin-top:14px">
        <div class="card-label">Notas de coaching</div>
        <textarea v-model="noteInput" rows="2" placeholder="Registrar feedback, plano de acao, pontos do 1-on-1..."
          style="resize:vertical" maxlength="4000" @keydown.ctrl.enter="postNote" />
        <button class="btn btn-primary" style="margin-top:8px" :disabled="postingNote || !noteInput.trim()" @click="postNote">
          {{ postingNote ? 'Salvando...' : 'Adicionar nota' }}
        </button>
        <div v-if="notes.length" class="gd-notes">
          <div v-for="n in notes" :key="n.id" class="gd-note">
            <div class="gd-note-body">{{ n.content }}</div>
            <div class="gd-note-meta">{{ n.profiles?.name || 'Gestor' }} · {{ fmtNoteDate(n.created_at) }}</div>
          </div>
        </div>
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

const route = useRoute()
interface Drill {
  profile: { id: string; name: string | null; role: string }
  series: { date: string; ce: number; rm: number; rr: number; fr: number }[]
  totals: { ce: number; rm: number; rr: number; fr: number }
  leads: { id: string; decisor: string; negocio: string | null; resultado: string; valor_estimado: number | null; data_retorno: string | null }[]
  members: { id: string; name: string }[]
  meta_mensal: number; ticket_medio: number; hasGoal: boolean; month: number; year: number
}
const { data, pending, refresh } = await useAsyncData(
  () => `mgmt-bdr-${route.params.bdrId}`,
  () => $fetch<Drill>(`/api/management/bdr/${route.params.bdrId}`)
)

const otherMembers = computed(() => (data.value?.members ?? []).filter(mb => mb.id !== route.params.bdrId))

// Reatribuir lead a outro BDR
async function reassign(leadId: string, e: Event) {
  const ownerId = (e.target as HTMLSelectElement).value
  ;(e.target as HTMLSelectElement).value = ''
  if (!ownerId) return
  try { await $fetch('/api/management/assign', { method: 'POST', body: { lead_id: leadId, owner_id: ownerId } }); await refresh() }
  catch { /* noop */ }
}

// Notas de coaching
const notes       = ref<any[]>([])
const noteInput   = ref('')
const postingNote = ref(false)
async function loadNotes() {
  try { notes.value = await $fetch<any[]>(`/api/management/bdr/${route.params.bdrId}/notes`) } catch { /* migration? */ }
}
onMounted(loadNotes)
async function postNote() {
  if (!noteInput.value.trim()) return
  postingNote.value = true
  try {
    const n = await $fetch<any>(`/api/management/bdr/${route.params.bdrId}/notes`, { method: 'POST', body: { content: noteInput.value.trim() } })
    notes.value.unshift(n)
    noteInput.value = ''
  } catch { /* migration? */ }
  finally { postingNote.value = false }
}
function fmtNoteDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Editor de meta individual
const goalMeta   = ref(0)
const goalTicket = ref(0)
const savingGoal = ref(false)
const goalToast  = ref('')
watch(data, d => { if (d) { goalMeta.value = d.meta_mensal; goalTicket.value = d.ticket_medio } }, { immediate: true })

async function saveGoal() {
  savingGoal.value = true
  try {
    await $fetch('/api/management/goals', {
      method: 'POST',
      body: { user_id: route.params.bdrId, meta_mensal: goalMeta.value, ticket_medio: goalTicket.value },
    })
    goalToast.value = 'Meta individual salva!'
  } catch (e: any) {
    goalToast.value = e?.data?.message || 'Erro ao salvar (rodou a migration bdr_goals?)'
  } finally {
    savingGoal.value = false
    setTimeout(() => (goalToast.value = ''), 3500)
  }
}

const t = computed(() => data.value?.totals ?? { ce: 0, rm: 0, rr: 0, fr: 0 })
const ceRm = computed(() => t.value.ce > 0 ? (t.value.rm / t.value.ce) * 100 : 0)
const rmRr = computed(() => t.value.rm > 0 ? (t.value.rr / t.value.rm) * 100 : 0)
const rrFr = computed(() => t.value.rr > 0 ? (t.value.fr / t.value.rr) * 100 : 0)

const stats = computed(() => [
  { label: 'Contatos efetivos', value: t.value.ce, sub: 'no mês', color: 'var(--text-3)' },
  { label: 'Reuniões marcadas', value: t.value.rm, sub: `CE→RM ${ceRm.value.toFixed(1)}%`, color: ceRm.value >= OUTBOUND_BENCHMARKS.TX_CE_RM*100 ? '#16a34a' : '#d97706' },
  { label: 'Reuniões realizadas', value: t.value.rr, sub: `RM→RR ${rmRr.value.toFixed(0)}%`, color: rmRr.value >= 35 ? '#16a34a' : '#d97706' },
  { label: 'Fechamentos', value: t.value.fr, sub: `RR→FR ${rrFr.value.toFixed(0)}%`, color: t.value.fr > 0 ? '#16a34a' : 'var(--text-3)' },
])

// Gargalo (mesma logica do matematica.vue)
const bottleneck = computed(() => {
  if (t.value.ce === 0) return {
    eyebrow: 'Sem atividade', title: 'Nenhum contato registrado este mês',
    body: 'Este BDR ainda não registrou contatos efetivos no diário.',
    action: 'Verifique se o diário está sendo preenchido.',
    style: 'background:var(--bg-subtle);border-color:var(--border);color:var(--text-2)',
  }
  if (rrFr.value < 20 && t.value.rr > 0) return {
    eyebrow: 'Gargalo identificado', title: 'Conversão reunião → fechamento (RR→FR)',
    body: `Taxa atual ${rrFr.value.toFixed(0)}% contra benchmark de 40%.`,
    action: 'Foco em técnica de negociação e fechamento, não em prospecção.',
    style: 'background:var(--bad-bg);border-color:var(--bad-bd);color:var(--bad)',
  }
  if (ceRm.value < 1.5 && t.value.ce > 20) return {
    eyebrow: 'Gargalo identificado', title: 'Conversão contato → reunião (CE→RM)',
    body: `Taxa CE→RM ${ceRm.value.toFixed(1)}% contra benchmark de 2.7%.`,
    action: 'Foco em script de abertura e geração de interesse.',
    style: 'background:var(--warn-bg);border-color:var(--warn-bd);color:var(--warn)',
  }
  return {
    eyebrow: 'No ritmo', title: 'Taxas dentro do benchmark',
    body: `CE→RM ${ceRm.value.toFixed(1)}% · RM→RR ${rmRr.value.toFixed(0)}%.`,
    action: 'Manter o volume diário de contatos.',
    style: 'background:var(--ok-bg);border-color:var(--ok-bd);color:var(--ok)',
  }
})
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
.gd-back { display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--text-2);text-decoration:none;margin-bottom:14px }
.gd-back:hover { color:var(--accent) }
.gd-skel { height:300px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:12px;animation:pulse 1.5s infinite }

.gd-stats { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px }
@media(max-width:640px){ .gd-stats{ grid-template-columns:repeat(2,1fr) } }
.gd-stat { background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;box-shadow:var(--shadow-sm) }
.gd-stat-label { font-size:11px;color:var(--text-2);margin-bottom:8px }
.gd-stat-value { font-size:var(--num-lg);font-weight:600;color:var(--text-1);letter-spacing:-.01em;font-variant-numeric:tabular-nums;font-family:var(--font-mono) }
.gd-stat-sub { font-size:11px;margin-top:4px;font-weight:500 }

.gd-bottleneck { border:1px solid;border-radius:12px;padding:16px 18px;margin-bottom:14px }
.gd-bn-eyebrow { font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;opacity:.7;margin-bottom:6px }
.gd-bn-title { font-size:14px;font-weight:600;margin-bottom:5px }
.gd-bn-body { font-size:13px;opacity:.85;line-height:1.6 }
.gd-bn-action { font-size:12px;font-weight:600;opacity:.85;margin-top:10px }

.gd-goal { display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap }
.gd-goal-field { display:flex;flex-direction:column;gap:4px }
.gd-goal-field label { font-size:11px;color:var(--text-3) }
.gd-goal-field input { width:150px }
.gd-goal-toast { font-size:12px;color:var(--text-2);align-self:center }

.gd-leads { display:flex;flex-direction:column;gap:5px }
.gd-lead { display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--border-soft);border-radius:8px;transition:border-color .1s }
.gd-lead:hover { border-color:var(--border) }
.gd-lead-link { flex:1;min-width:0;text-decoration:none }
.gd-lead-name { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.gd-lead-company { font-size:12px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.gd-lead-value { font-size:11px;font-weight:600;color:var(--ok);background:var(--ok-bg);border-radius:var(--radius-sm);padding:1px 6px;flex-shrink:0 }
.gd-reassign { width:auto;flex-shrink:0;font-size:11px;padding:4px 6px }

.gd-notes { display:flex;flex-direction:column;gap:7px;margin-top:14px }
.gd-note { background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px;padding:10px 12px }
.gd-note-body { font-size:13px;color:var(--text-1);line-height:1.5;white-space:pre-wrap }
.gd-note-meta { font-size:11px;color:var(--text-3);margin-top:5px }
</style>
