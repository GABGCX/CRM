<template>
  <div class="ld-wrap">
    <!-- Header -->
    <div class="ld-head">
      <div style="min-width:0;flex:1">
        <div class="ld-title-row">
          <span class="ld-title">{{ lead.decisor }}</span>
          <UiScorePill :lead="lead" prefix="Score" />
        </div>
        <div class="ld-sub">{{ lead.negocio }} · {{ daysIn(lead.created_at) }} dias no funil</div>
        <div v-if="lead.motivo_perda" style="margin-top:6px">
          <span style="font-size:11px;color:#dc2626;background:var(--bad-bg);border:1px solid var(--bad-bd);border-radius:4px;padding:2px 7px;font-weight:500">
            Perda: {{ lead.motivo_perda }}
          </span>
        </div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
        <span v-if="hasUnsavedChanges" style="font-size:11px;color:#d97706;font-weight:500">Não salvo</span>
        <button class="btn btn-danger" @click="removeLead" style="padding:5px 8px">
          <i class="ti ti-trash" aria-hidden="true"></i>
        </button>
        <button v-if="showClose" class="btn" @click="$emit('close')" style="padding:5px 10px">X</button>
      </div>
    </div>

    <div class="ld-body">
      <!-- Etiquetas -->
      <div style="margin-bottom:14px">
        <div class="input-label" style="margin-bottom:6px">Etiquetas</div>
        <UiTagPicker :model-value="editForm.tag_ids || []" @update:model-value="onTagsChange" />
      </div>

      <!-- Funnel progress -->
      <div style="display:flex;align-items:center;margin-bottom:16px;background:var(--bg-subtle);border-radius:10px;padding:10px 12px">
        <template v-for="(stage, i) in FUNNEL_STAGES" :key="stage.key">
          <div style="flex:1;text-align:center;min-width:0">
            <div style="width:9px;height:9px;border-radius:50%;margin:0 auto 4px"
              :style="{ background: funnelStageColor(lead.resultado, i) }" />
            <div style="font-size:9px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
              :style="{ color: funnelStageColor(lead.resultado, i) }">
              {{ stage.label }}
            </div>
          </div>
          <div v-if="i < FUNNEL_STAGES.length - 1"
            style="width:16px;height:2px;flex-shrink:0"
            :style="{ background: funnelStagePassed(lead.resultado, i) ? '#0f62fe' : 'var(--border)' }" />
        </template>
      </div>

      <!-- Fields -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div v-for="f in detailFields" :key="f.key"
          :style="{ gridColumn: f.wide ? 'span 2' : 'span 1' }">
          <div class="input-label" style="margin-bottom:4px">{{ f.label }}</div>
          <input v-if="f.type !== 'select' && f.type !== 'textarea'"
            :type="f.type || 'text'" v-model="editForm[f.key]"
            @input="hasUnsavedChanges = true" />
          <select v-else-if="f.type === 'select'" v-model="editForm[f.key]" @change="onStatusChange">
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
          <textarea v-else v-model="editForm[f.key]" rows="2" @input="hasUnsavedChanges = true" />
        </div>
        <div style="grid-column:span 2;display:flex;align-items:center;gap:7px">
          <input type="checkbox" v-model="editForm.reuniao_agendada" id="ld-reun" @change="hasUnsavedChanges = true" />
          <label for="ld-reun" class="input-label" style="cursor:pointer">Reunião agendada</label>
        </div>

        <!-- Campos personalizados -->
        <template v-if="customDefs.length && editForm.custom_fields">
          <div v-for="cf in customDefs" :key="cf.id" style="grid-column:span 2">
            <div class="input-label" style="margin-bottom:4px">{{ cf.label }}</div>
            <select v-if="cf.field_type === 'select'" v-model="editForm.custom_fields[cf.key]" @change="hasUnsavedChanges = true">
              <option value="">--</option>
              <option v-for="o in (cf.options || [])" :key="o" :value="o">{{ o }}</option>
            </select>
            <input v-else
              :type="cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'"
              v-model="editForm.custom_fields[cf.key]" @input="hasUnsavedChanges = true" />
          </div>
        </template>
      </div>

      <button class="btn btn-primary" :disabled="detailSaving" @click="saveLead"
        style="width:100%;justify-content:center;margin-bottom:10px">
        {{ detailSaving ? 'Salvando...' : 'Salvar alterações' }}
      </button>

      <!-- Template selector -->
      <div v-if="templates.length" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <UiTemplateSelector :templates="templates" @select="applyTemplate" />
        <a v-if="lead.telefone" :href="`tel:${lead.telefone}`" class="btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 2 2 0 012 1.84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
          Ligar
        </a>
        <a v-if="lead.telefone" :href="`https://wa.me/55${lead.telefone.replace(/\D/g,'')}`" target="_blank" class="btn" style="color:#16a34a;border-color:var(--ok-bd);background:var(--ok-bg)">
          WhatsApp
        </a>
      </div>

      <!-- Template preview -->
      <div v-if="templatePreview" style="margin-bottom:12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:8px;padding:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <span style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em">{{ templatePreview.channel }} · {{ templatePreview.name }}</span>
          <button style="border:none;background:none;font-size:11px;color:var(--accent);cursor:pointer;font-family:inherit;font-weight:500;padding:0"
            @click="copyTemplate">
            Copiar
          </button>
        </div>
        <div style="font-size:13px;color:var(--text-1);white-space:pre-wrap;line-height:1.6">{{ templatePreview.content }}</div>
      </div>

      <div class="divider"></div>

      <!-- Tabs -->
      <div class="detail-tabs">
        <button v-for="t in (['follow-ups','notas','histórico'] as const)" :key="t"
          @click="detailTab = t"
          class="detail-tab-btn"
          :class="{ active: detailTab === t }">
          {{ t === 'follow-ups' ? `FU (${fuDone(lead)}/10)` : t === 'notas' ? `Notas${leadNotes.length ? ` (${leadNotes.length})` : ''}` : 'Atividades' }}
        </button>
      </div>

      <!-- FU tab -->
      <div v-if="detailTab === 'follow-ups'"
        style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:12px">
        <button v-for="fu in sortedFU(lead.followups)" :key="fu.attempt_index"
          @click="handleToggleFU(fu.attempt_index)"
          style="border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;border:1px solid;transition:all .12s;font-family:inherit"
          :style="fu.completed_at
            ? 'background:var(--ok-bg);border-color:var(--ok-bd)'
            : 'background:var(--bg-subtle);border-color:var(--border)'">
          <div style="font-size:12px;font-weight:500"
            :style="{ color: fu.completed_at ? '#16a34a' : 'var(--text-2)' }">{{ fu.attempt_index + 1 }}º</div>
          <div style="font-size:10px;color:var(--text-3)">{{ FU_DAYS[fu.attempt_index] }}d</div>
        </button>
      </div>

      <!-- Notas tab -->
      <div v-if="detailTab === 'notas'" style="margin-top:12px">
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
          <textarea v-model="newNote" rows="2" placeholder="Adicionar nota..."
            style="resize:vertical" @keydown.ctrl.enter="submitNote" maxlength="2000" />
          <div style="display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:11px;color:var(--text-3)">Ctrl+Enter para salvar</span>
            <span style="font-size:11px;color:var(--text-3)"
              :style="{ color: newNote.length > 1900 ? '#d97706' : 'var(--text-3)' }">
              {{ newNote.length }} / 2000
            </span>
          </div>
          <button class="btn btn-primary" :disabled="noteSaving || !newNote.trim()"
            style="align-self:flex-end" @click="submitNote">
            {{ noteSaving ? 'Salvando...' : 'Adicionar nota' }}
          </button>
        </div>
        <div v-if="notesLoading" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">Carregando...</div>
        <div v-else-if="!leadNotes.length" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">
          Nenhuma nota registrada.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:8px">
          <div v-for="note in leadNotes" :key="note.id"
            style="background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px;padding:12px;font-size:13px">
            <div style="color:var(--text-1);line-height:1.6;white-space:pre-wrap">{{ note.content }}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
              <span style="font-size:11px;color:var(--text-3)">
                {{ note.profiles?.name || 'Usuário' }} &middot; {{ formatEventDate(note.created_at) }}
              </span>
              <button @click="deleteNote(note.id)"
                style="border:none;background:none;color:var(--text-3);cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;transition:color .1s">
                Remover
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Atividades / Histórico tab -->
      <div v-if="detailTab === 'histórico'" style="margin-top:12px">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
          <button v-for="a in ACTIVITY_KINDS" :key="a.kind" class="btn"
            style="padding:5px 11px;font-size:12px" :disabled="activitySaving"
            @click="logActivity(a.kind)">
            {{ a.label }}
          </button>
        </div>
        <div v-if="eventsLoading" style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">Carregando...</div>
        <div v-else-if="!leadEvents.length" style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">
          Nenhuma atividade registrada.
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:8px">
          <div v-for="ev in leadEvents" :key="ev.id" style="display:flex;gap:10px;font-size:12px">
            <div style="width:30px;height:30px;background:var(--bg-subtle);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:var(--text-2);font-weight:600">
              {{ eventIcon(ev.type) }}
            </div>
            <div style="flex:1;min-width:0;padding-top:5px">
              <div style="color:var(--text-1)">{{ eventLabel(ev) }}</div>
              <div style="color:var(--text-3);font-size:11px;margin-top:2px">
                {{ ev.profiles?.name || 'Usuário' }} · {{ formatEventDate(ev.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LazyUiLossReasonModal
      :show="showLossModal"
      :status="lossModalStatus"
      @confirm="onLossConfirm"
      @cancel="showLossModal = false" />
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus, MessageTemplate, LeadEvent, LeadNote } from '~/types'
import {
  STATUSES, FU_DAYS, LOSS_STATUSES, FUNNEL_STAGES,
  funnelStageColor, funnelStagePassed, fuDone, sortedFU, daysIn, localDateISO,
} from '~/utils/leadDomain'

type LeadWithFU = Lead & { followups: Followup[] }

const props = withDefaults(defineProps<{
  lead: LeadWithFU
  templates?: MessageTemplate[]
  customDefs?: any[]
  showClose?: boolean
}>(), { templates: () => [], customDefs: () => [], showClose: false })

const emit = defineEmits<{ close: []; deleted: []; saved: []; unsaved: [v: boolean]; notify: [msg: string] }>()

const { patchLead, toggleFU, deleteLead } = useLeads()

const detailSaving      = ref(false)
const hasUnsavedChanges = ref(false)
const detailTab         = ref<'follow-ups' | 'notas' | 'histórico'>('follow-ups')
const leadEvents        = ref<LeadEvent[]>([])
const eventsLoading     = ref(false)
const leadNotes         = ref<LeadNote[]>([])
const notesLoading      = ref(false)
const noteSaving        = ref(false)
const newNote           = ref('')
const activitySaving    = ref(false)
const templatePreview   = ref<MessageTemplate | null>(null)
const showLossModal     = ref(false)
const lossModalStatus   = ref('')

watch(hasUnsavedChanges, v => emit('unsaved', v))

const detailFields = [
  { key:'decisor',        label:'Decisor' },
  { key:'telefone',       label:'Telefone' },
  { key:'negocio',        label:'Empresa' },
  { key:'instagram',      label:'Instagram' },
  { key:'nome_ponte',     label:'Indicação / Ponte', wide:true },
  { key:'resultado',      label:'Resultado',       type:'select' },
  { key:'data_retorno',   label:'Data retorno',    type:'date' },
  { key:'valor_estimado', label:'Valor estimado (R$)', type:'number' },
  { key:'turno',          label:'Turno' },
  { key:'horario',        label:'Horário' },
  { key:'info',           label:'Observações',     type:'textarea', wide:true },
  { key:'proposta_url',   label:'URL da proposta', type:'url', wide:true },
]

const SAVE_NULLABLE = [
  'telefone','negocio','instagram','nome_ponte','data_retorno','info',
  'turno','horario','proposta_url','motivo_perda','valor_estimado','num_vendedores',
]

const editForm = reactive<Record<string,any>>({})
watch(() => props.lead, l => {
  if (!l) return
  Object.assign(editForm, {
    decisor: l.decisor, telefone: l.telefone||'', negocio: l.negocio||'',
    instagram: l.instagram||'', num_vendedores: l.num_vendedores||null,
    nome_ponte: l.nome_ponte||'', resultado: l.resultado,
    data_retorno: l.data_retorno||'', reuniao_agendada: l.reuniao_agendada,
    turno: l.turno||'', horario: l.horario||'', info: l.info||'',
    proposta_url: l.proposta_url||'',
    valor_estimado: l.valor_estimado||null, motivo_perda: l.motivo_perda||'',
    tag_ids: [...(l.tag_ids || [])],
    custom_fields: { ...(l.custom_fields || {}) },
  })
  templatePreview.value = null
  hasUnsavedChanges.value = false
  detailTab.value = 'follow-ups'
  leadEvents.value = []
  leadNotes.value = []
  newNote.value = ''
}, { immediate: true })

watch(detailTab, async (tab) => {
  if (tab === 'histórico' && !leadEvents.value.length) {
    eventsLoading.value = true
    try { leadEvents.value = await $fetch<LeadEvent[]>(`/api/leads/${props.lead.id}/events`) }
    finally { eventsLoading.value = false }
  }
  if (tab === 'notas') await loadNotes()
})

async function loadNotes() {
  notesLoading.value = true
  try { leadNotes.value = await $fetch<LeadNote[]>(`/api/leads/${props.lead.id}/notes`) }
  finally { notesLoading.value = false }
}

async function onTagsChange(ids: string[]) {
  editForm.tag_ids = ids
  try { await patchLead(props.lead.id, { tag_ids: ids }) }
  catch { emit('notify', 'Erro ao salvar etiquetas.') }
}

function onStatusChange() {
  hasUnsavedChanges.value = true
  if (editForm.resultado === 'Follow-up' && !editForm.data_retorno) {
    const d = new Date(); d.setDate(d.getDate() + 2)
    editForm.data_retorno = localDateISO(d)
  }
  if (LOSS_STATUSES.includes(editForm.resultado)) {
    lossModalStatus.value = editForm.resultado
    showLossModal.value   = true
  }
}

function onLossConfirm(reason: string) {
  editForm.motivo_perda = reason
  showLossModal.value   = false
}

function applyTemplate(tpl: MessageTemplate) { templatePreview.value = tpl }
function copyTemplate() {
  if (!templatePreview.value) return
  navigator.clipboard?.writeText(templatePreview.value.content)
}

async function saveLead() {
  detailSaving.value = true
  try {
    const payload: Record<string, any> = { ...editForm }
    delete payload.tag_ids
    for (const k of SAVE_NULLABLE) if (payload[k] === '') payload[k] = null
    payload.custom_fields = Object.fromEntries(
      Object.entries(payload.custom_fields || {}).filter(([, v]) => v !== '' && v != null)
    )
    await patchLead(props.lead.id, payload)
    hasUnsavedChanges.value = false
    emit('saved')
  } catch {
    emit('notify', 'Erro ao salvar. Verifique os campos.')
  } finally {
    detailSaving.value = false
  }
}

async function removeLead() {
  if (!confirm('Remover este lead?')) return
  await deleteLead(props.lead.id)
  emit('deleted')
}

async function handleToggleFU(idx: number) {
  await toggleFU(props.lead.id, idx)
}

async function submitNote() {
  if (!newNote.value.trim()) return
  noteSaving.value = true
  try {
    const note = await $fetch<LeadNote>(`/api/leads/${props.lead.id}/notes`, {
      method: 'POST', body: { content: newNote.value.trim() },
    })
    leadNotes.value.unshift(note)
    newNote.value = ''
  } catch {
    emit('notify', 'Erro ao salvar nota.')
  } finally { noteSaving.value = false }
}

async function deleteNote(noteId: string) {
  try {
    await $fetch(`/api/leads/${props.lead.id}/notes/${noteId}`, { method: 'DELETE' })
    leadNotes.value = leadNotes.value.filter(n => n.id !== noteId)
  } catch { emit('notify', 'Erro ao remover nota.') }
}

const ACTIVITY_KINDS = [
  { kind: 'ligacao',  label: 'Ligação'  },
  { kind: 'whatsapp', label: 'WhatsApp' },
  { kind: 'reuniao',  label: 'Reunião'  },
  { kind: 'email',    label: 'Email'    },
] as const

const ACTIVITY_LABELS: Record<string, string> = {
  ligacao: 'Ligação registrada', whatsapp: 'WhatsApp registrado',
  reuniao: 'Reunião registrada', email: 'Email registrado', outro: 'Atividade registrada',
}

async function logActivity(kind: string) {
  activitySaving.value = true
  try {
    const ev = await $fetch<LeadEvent>(`/api/leads/${props.lead.id}/events`, {
      method: 'POST', body: { kind },
    })
    if (ev) leadEvents.value.unshift(ev)
    emit('notify', 'Atividade registrada')
  } catch {
    emit('notify', 'Erro ao registrar atividade.')
  } finally { activitySaving.value = false }
}

const EVENT_ICONS: Record<string, string> = {
  created: '+', status_change: '>', field_update: '~', followup: 'v', note: '@', activity: '*',
}
function eventIcon(type: string) { return EVENT_ICONS[type] ?? '·' }

function eventLabel(ev: LeadEvent): string {
  const p = (ev.payload ?? {}) as Record<string, any>
  switch (ev.type) {
    case 'created':       return 'Lead criado'
    case 'status_change': return `Status: ${p.from} → ${p.to}`
    case 'field_update':  return `Campos atualizados: ${(p.fields ?? []).join(', ')}`
    case 'followup':      return p.completed
      ? `Follow-up ${p.attempt_index + 1} concluído`
      : `Follow-up ${p.attempt_index + 1} reaberto`
    case 'activity': {
      const base = ACTIVITY_LABELS[p.kind] ?? 'Atividade registrada'
      return p.note ? `${base}: ${p.note}` : base
    }
    default: return ev.type
  }
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}
</script>

<style scoped>
.ld-wrap { display:flex; flex-direction:column; height:100%; min-height:0; }
.ld-head {
  display:flex; align-items:flex-start; justify-content:space-between; gap:10px;
  padding:18px 20px 14px; border-bottom:1px solid var(--border-soft); flex-shrink:0;
}
.ld-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ld-title { font-size:17px; font-weight:600; color:var(--text-1); letter-spacing:-.01em; }
.ld-sub { font-size:13px; color:var(--text-2); margin-top:2px; }
.ld-body { flex:1; overflow-y:auto; padding:18px 20px; }

.detail-tabs { display:flex; border-bottom:1px solid var(--border-soft); }
.detail-tab-btn {
  padding:8px 14px; border:none; border-bottom:2px solid transparent; background:transparent;
  color:var(--text-3); font-size:13px; font-weight:500; font-family:inherit; cursor:pointer;
  transition:all .12s; margin-bottom:-1px;
}
.detail-tab-btn:hover { color:var(--text-2) }
.detail-tab-btn.active { color:var(--text-1); border-bottom-color:var(--accent); }
</style>
