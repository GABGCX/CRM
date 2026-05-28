<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div class="page-title">Pipeline</div>
        <div class="page-sub">{{ totalLeads }} leads · {{ activeLeads.length }} ativos</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <!-- View toggle -->
        <div class="view-toggle">
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            title="Visualização em lista"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="8"  y1="6"  x2="21" y2="6"/>
              <line x1="8"  y1="12" x2="21" y2="12"/>
              <line x1="8"  y1="18" x2="21" y2="18"/>
              <line x1="3"  y1="6"  x2="3.01" y2="6"/>
              <line x1="3"  y1="12" x2="3.01" y2="12"/>
              <line x1="3"  y1="18" x2="3.01" y2="18"/>
            </svg>
            Lista
          </button>
          <button
            class="view-toggle-btn"
            :class="{ active: viewMode === 'kanban' }"
            @click="viewMode = 'kanban'"
            title="Visualização Kanban"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3"  y="3" width="5" height="18" rx="1"/>
              <rect x="10" y="3" width="5" height="12" rx="1"/>
              <rect x="17" y="3" width="5" height="15" rx="1"/>
            </svg>
            Kanban
          </button>
        </div>

        <button class="btn" @click="exportCSV" title="Exportar CSV">
          <i class="ti ti-download" aria-hidden="true"></i> CSV
        </button>
        <button class="btn btn-primary" @click="showModal = true">+ Novo lead</button>
      </div>
    </div>

    <!-- Filters — visible in both views -->
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
      <button
        v-for="s in ['Todos', ...STATUSES]" :key="s"
        @click="filterStatus = s"
        :class="filterStatus === s ? 'btn btn-primary' : 'btn'"
        style="font-size:11px;padding:4px 10px">
        {{ s }}
        <span style="opacity:.6;margin-left:2px">
          {{ s === 'Todos' ? totalLeads : (countByStatus[s] || 0) }}
        </span>
      </button>
    </div>

    <!-- Search + sort (list only) -->
    <div v-if="viewMode === 'list'"
      style="display:flex;gap:8px;margin-bottom:12px">
      <input v-model="searchQ"
        placeholder="Buscar por nome, empresa ou telefone..."
        style="max-width:320px" />
      <select v-model="sortBy" style="width:auto;flex-shrink:0">
        <option value="created_at">Mais recentes</option>
        <option value="data_retorno">Retorno mais próximo</option>
        <option value="fu_done">Menos follow-ups</option>
      </select>
    </div>

    <!-- Search (kanban) -->
    <div v-if="viewMode === 'kanban'" style="margin-bottom:12px">
      <input v-model="searchQ"
        placeholder="Filtrar cards por nome ou empresa..."
        style="max-width:320px" />
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  KANBAN VIEW                                               -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <KanbanBoard
      v-if="viewMode === 'kanban'"
      :leads="filteredForKanban"
      :pending="pending"
      @select="openDetail"
      @status-change="onKanbanStatusChange"
    />

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!--  LIST VIEW                                                 -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- Loading skeleton -->
      <div v-if="pending" style="display:flex;flex-direction:column;gap:5px">
        <div v-for="i in 5" :key="i"
          style="height:62px;background:#fff;border:1px solid #f0f0f0;border-radius:8px;animation:pulse 1.5s infinite" />
      </div>

      <div v-else :style="{ display:'grid', gap:'12px',
        gridTemplateColumns: selectedLead ? '300px 1fr' : '1fr' }">

        <!-- Lead list -->
        <div style="display:flex;flex-direction:column;gap:5px;overflow-y:auto;max-height:calc(100vh - 300px)">
          <div v-if="!filtered.length"
            style="text-align:center;padding:32px;color:#a3a3a3;font-size:13px">
            Nenhum lead encontrado.
          </div>
          <div
            v-for="l in filtered" :key="l.id"
            @click="selectLead(l)"
            class="lead-row"
            :class="{ 'lead-row--selected': selectedId === l.id }"
          >
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px">
              <div style="min-width:0;flex:1">
                <div style="font-size:13px;font-weight:500;color:#0a0a0a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ l.decisor || 'Sem nome' }}
                </div>
                <div style="font-size:11px;color:#737373;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ l.negocio || '—' }}
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px">
                <span v-if="isVencido(l)" style="font-size:10px;color:#dc2626;font-weight:500">vencido</span>
                <span class="tag" :class="statusTagClass(l.resultado)">{{ l.resultado }}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;gap:2px;align-items:center">
                <div v-for="fu in sortedFU(l.followups)" :key="fu.attempt_index"
                  class="fu-dot" :class="fu.completed_at ? 'fu-dot-done' : 'fu-dot-todo'" />
              </div>
              <div style="font-size:10px;color:#a3a3a3;display:flex;gap:8px">
                <span>{{ fuDone(l) }}/10</span>
                <span>{{ daysIn(l.created_at) }}d</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail panel -->
        <div v-if="selectedLead" class="card"
          style="overflow-y:auto;max-height:calc(100vh - 300px)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div>
              <div style="font-size:15px;font-weight:600;color:#0a0a0a">{{ selectedLead.decisor }}</div>
              <div style="font-size:12px;color:#737373">
                {{ selectedLead.negocio }} · {{ daysIn(selectedLead.created_at) }} dias no funil
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span v-if="hasUnsavedChanges"
                style="font-size:11px;color:#d97706;font-weight:500">● Não salvo</span>
              <button class="btn btn-danger" @click="removeLead(selectedLead.id)"
                style="font-size:11px;padding:5px 8px">
                <i class="ti ti-trash" aria-hidden="true"></i>
              </button>
              <button class="btn" @click="confirmClose" style="font-size:11px;padding:5px 8px">✕</button>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
            <div v-for="f in detailFields" :key="f.key"
              :style="{ gridColumn: f.wide ? 'span 2' : 'span 1' }">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">{{ f.label }}</div>
              <input v-if="f.type !== 'select' && f.type !== 'textarea'"
                :type="f.type || 'text'" v-model="editForm[f.key]"
                @input="hasUnsavedChanges = true" />
              <select v-else-if="f.type === 'select'" v-model="editForm[f.key]"
                @change="onStatusChange">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
              <textarea v-else v-model="editForm[f.key]" rows="2"
                @input="hasUnsavedChanges = true" />
            </div>
            <div style="grid-column:span 2;display:flex;align-items:center;gap:6px">
              <input type="checkbox" v-model="editForm.reuniao_agendada" id="reun"
                @change="hasUnsavedChanges = true" />
              <label for="reun" style="font-size:12px;color:#525252;cursor:pointer">
                Reunião agendada
              </label>
            </div>
          </div>

          <button class="btn btn-primary" :disabled="detailSaving" @click="saveLead"
            style="width:100%;justify-content:center;margin-bottom:14px">
            {{ detailSaving ? 'Salvando...' : 'Salvar alterações' }}
          </button>

          <div class="divider"></div>
          <div style="font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">
            Follow-ups · {{ fuDone(selectedLead) }}/10
          </div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px">
            <button v-for="fu in sortedFU(selectedLead.followups)" :key="fu.attempt_index"
              @click="handleToggleFU(selectedLead.id, fu.attempt_index)"
              style="border-radius:6px;padding:7px 4px;text-align:center;cursor:pointer;border:1px solid;transition:all .1s;font-family:inherit"
              :style="fu.completed_at
                ? 'background:#f0fdf4;border-color:#bbf7d0'
                : 'background:#f9f9f9;border-color:#f0f0f0'">
              <div style="font-size:11px;font-weight:500"
                :style="{ color: fu.completed_at ? '#16a34a' : '#525252' }">
                {{ fu.attempt_index + 1 }}º
              </div>
              <div style="font-size:10px;color:#a3a3a3">{{ FU_DAYS[fu.attempt_index] }}d</div>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ─── New lead modal ─────────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="showModal"
        style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px"
        @click.self="showModal = false">
        <div class="card" style="width:100%;max-width:480px;max-height:90vh;overflow-y:auto">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
            <div style="font-size:15px;font-weight:600">Novo lead</div>
            <button class="btn" @click="showModal = false" style="padding:4px 8px">✕</button>
          </div>
          <div v-if="createError"
            style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;font-size:12px;padding:8px 10px;border-radius:6px;margin-bottom:10px">
            {{ createError }}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Nome do Decisor *</div>
              <input v-model="newForm.decisor" placeholder="João Silva" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Telefone</div>
              <input v-model="newForm.telefone" placeholder="(85) 9 9999-9999" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Empresa</div>
              <input v-model="newForm.negocio" placeholder="Empresa XYZ" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Instagram</div>
              <input v-model="newForm.instagram" placeholder="@empresa" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Vendedores</div>
              <input v-model.number="newForm.num_vendedores" type="number" min="0" />
            </div>
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Nome da Ponte</div>
              <input v-model="newForm.nome_ponte" placeholder="Atendente que abriu a porta" />
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Resultado</div>
              <select v-model="newForm.resultado">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <div style="font-size:11px;color:#737373;margin-bottom:3px">
                Data de retorno
                <button type="button" @click="suggestRetorno"
                  style="border:none;background:none;color:#2563eb;font-size:10px;cursor:pointer;padding:0 0 0 4px">
                  +2d
                </button>
              </div>
              <input type="date" v-model="newForm.data_retorno" />
            </div>
            <div style="grid-column:span 2">
              <div style="font-size:11px;color:#737373;margin-bottom:3px">Informações úteis</div>
              <textarea v-model="newForm.info" rows="2"
                placeholder="Detalhes para a sessão estratégica..." />
            </div>
            <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:6px;padding-top:4px">
              <button class="btn" @click="showModal = false">Cancelar</button>
              <button class="btn btn-primary" :disabled="createSaving"
                @click="handleCreateLead">
                {{ createSaving ? 'Criando...' : 'Criar lead' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">✓ {{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus } from '~/types'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }

const STATUSES: LeadStatus[] = [
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado','Sem interesse','Não atende',
]
const FU_DAYS = [2,4,6,8,10,12,14,16,18,20]
const STATUS_TAG: Record<string,string> = {
  'Aguardando retorno':'tag-amber','Follow-up':'tag-blue','De molho':'tag-purple',
  'Reunião agendada':'tag-teal','Enviar proposta':'tag-amber','Proposta enviada':'tag-blue',
  'Fechado':'tag-green','Recusado':'tag-red','Sem interesse':'tag-gray','Não atende':'tag-gray',
}

// ── View mode (persisted in localStorage) ─────────────────────────
const viewMode = ref<'list' | 'kanban'>('list')
onMounted(() => {
  const saved = localStorage.getItem('pipeline-view')
  if (saved === 'kanban' || saved === 'list') viewMode.value = saved
})
watch(viewMode, v => localStorage.setItem('pipeline-view', v))

// ── Busca de dados: await garante que os leads estejam disponíveis  ──
// antes da primeira renderização (SSR + navegação client-side).
// A chave 'leads-global' é a mesma usada em useLeads(), portanto
// ambos apontam para o mesmo ref reativo — sem double-fetch.
const { data: leads, pending } = await useAsyncData<LeadWithFU[]>(
  'leads-global',
  () => $fetch('/api/leads'),
  { default: () => [] as LeadWithFU[] }
)

// ── Métodos de mutação via composable (lê o mesmo ref acima) ────────
const {
  activeLeads,
  toggleFU,
  patchStatus,
  patchLead,
  createLead: createLeadComposable,
  deleteLead: deleteLeadComposable,
  exportCSV,
} = useLeads()

// ── UI state ───────────────────────────────────────────────────────
const filterStatus       = ref('Todos')
const searchQ            = ref('')
const sortBy             = ref<'created_at'|'data_retorno'|'fu_done'>('created_at')
const selectedId         = ref<string | null>(null)
const showModal          = ref(false)
const toastMsg           = ref<string | null>(null)
const detailSaving       = ref(false)
const createSaving       = ref(false)
const createError        = ref<string | null>(null)
const hasUnsavedChanges  = ref(false)

const showToast = (m: string) => { toastMsg.value = m; setTimeout(() => toastMsg.value = null, 2500) }
const fuDone    = (l: LeadWithFU) => (l.followups||[]).filter(f => f.completed_at).length
const sortedFU  = (fus: Followup[]) => [...(fus||[])].sort((a,b) => a.attempt_index - b.attempt_index)
const daysIn    = (dt: string) => Math.floor((Date.now() - new Date(dt).getTime()) / 86_400_000)
const statusTagClass = (s: string) => STATUS_TAG[s] || 'tag-gray'
const isVencido = (l: LeadWithFU) =>
  l.data_retorno && new Date(l.data_retorno) <= new Date() &&
  !['Fechado','Recusado','Sem interesse'].includes(l.resultado)

const totalLeads    = computed(() => (leads.value||[]).length)
const countByStatus = computed(() =>
  (leads.value||[]).reduce((a: Record<string,number>, l) => {
    a[l.resultado] = (a[l.resultado]||0) + 1; return a
  }, {})
)

// ── Filtered + sorted list ────────────────────────────────────────
const filtered = computed(() => {
  let list = (leads.value||[]).filter(l => {
    const ms = filterStatus.value === 'Todos' || l.resultado === filterStatus.value
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) ||
               (l.negocio||'').toLowerCase().includes(q) ||
               (l.telefone||'').includes(q)
    return ms && mq
  })
  if (sortBy.value === 'data_retorno') {
    list = [...list].sort((a, b) => {
      if (!a.data_retorno && !b.data_retorno) return 0
      if (!a.data_retorno) return 1
      if (!b.data_retorno) return -1
      return a.data_retorno.localeCompare(b.data_retorno)
    })
  } else if (sortBy.value === 'fu_done') {
    list = [...list].sort((a, b) => fuDone(a) - fuDone(b))
  }
  return list
})

// ── Filtered for Kanban (respects search + status filter) ─────────
const filteredForKanban = computed(() =>
  (leads.value||[]).filter(l => {
    const ms = filterStatus.value === 'Todos' || l.resultado === filterStatus.value
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) ||
               (l.negocio||'').toLowerCase().includes(q)
    return ms && mq
  })
)

// ── Kanban: status change via drag ────────────────────────────────
async function onKanbanStatusChange(leadId: string, resultado: LeadStatus) {
  try {
    await patchStatus(leadId, resultado)
    showToast('Status atualizado!')
  } catch {
    showToast('Erro ao mover card.')
  }
}

// ── List: lead selection / detail panel ───────────────────────────
const selectedLead = computed(() =>
  (leads.value||[]).find(l => l.id === selectedId.value) || null
)

function selectLead(l: LeadWithFU) {
  if (selectedId.value === l.id) return
  if (hasUnsavedChanges.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value        = l.id
  hasUnsavedChanges.value = false
}

function openDetail(l: LeadWithFU) {
  viewMode.value   = 'list'
  selectLead(l)
}

function confirmClose() {
  if (hasUnsavedChanges.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value        = null
  hasUnsavedChanges.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') confirmClose()
}

// ── Edit form ─────────────────────────────────────────────────────
const editForm = reactive<Record<string,any>>({})
watch(selectedLead, l => {
  if (!l) return
  Object.assign(editForm, {
    decisor: l.decisor, telefone: l.telefone||'', negocio: l.negocio||'',
    instagram: l.instagram||'', num_vendedores: l.num_vendedores||null,
    nome_ponte: l.nome_ponte||'', resultado: l.resultado,
    data_retorno: l.data_retorno||'', reuniao_agendada: l.reuniao_agendada,
    turno: l.turno||'', horario: l.horario||'', info: l.info||'',
  })
  hasUnsavedChanges.value = false
}, { immediate: true })

function onStatusChange() {
  hasUnsavedChanges.value = true
  if (editForm.resultado === 'Follow-up' && !editForm.data_retorno) {
    const d = new Date(); d.setDate(d.getDate() + 2)
    editForm.data_retorno = d.toISOString().slice(0, 10)
  }
}

const detailFields = [
  { key:'decisor',      label:'Decisor' },
  { key:'telefone',     label:'Telefone' },
  { key:'negocio',      label:'Empresa' },
  { key:'instagram',    label:'Instagram' },
  { key:'nome_ponte',   label:'Ponte',        wide:true },
  { key:'resultado',    label:'Resultado',    type:'select' },
  { key:'data_retorno', label:'Data retorno', type:'date' },
  { key:'turno',        label:'Turno' },
  { key:'horario',      label:'Horário' },
  { key:'info',         label:'Informações',  type:'textarea', wide:true },
]

async function saveLead() {
  if (!selectedLead.value) return
  detailSaving.value = true
  try {
    await patchLead(selectedLead.value.id, editForm)
    hasUnsavedChanges.value = false
    showToast('Salvo!')
  } finally {
    detailSaving.value = false
  }
}

async function removeLead(id: string) {
  if (!confirm('Remover este lead?')) return
  await deleteLeadComposable(id)
  selectedId.value = null
  showToast('Lead removido.')
}

async function handleToggleFU(leadId: string, idx: number) {
  await toggleFU(leadId, idx)
}

// ── New form ──────────────────────────────────────────────────────
const newForm = reactive<Record<string,any>>({
  decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null,
  nome_ponte:'', resultado:'Aguardando retorno', data_retorno:'', info:'',
})

function suggestRetorno() {
  const d = new Date(); d.setDate(d.getDate() + 2)
  newForm.data_retorno = d.toISOString().slice(0, 10)
}

async function handleCreateLead() {
  if (!newForm.decisor) { createError.value = 'Informe o nome do decisor.'; return }
  createSaving.value = true; createError.value = null
  try {
    await createLeadComposable({ ...newForm, reuniao_agendada: false })
    showModal.value = false
    showToast('Lead criado!')
    Object.assign(newForm, {
      decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null,
      nome_ponte:'', resultado:'Aguardando retorno', data_retorno:'', info:'',
    })
  } catch (e: any) {
    createError.value = e?.data?.message || 'Erro ao criar.'
  } finally {
    createSaving.value = false
  }
}
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* ── View toggle ─────────────────────────────────────────────────── */
.view-toggle {
  display: flex;
  background: #f5f5f5;
  border-radius: 7px;
  padding: 3px;
  gap: 2px;
}
.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: #737373;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
}
.view-toggle-btn:hover { color: #0a0a0a }
.view-toggle-btn.active {
  background: #fff;
  color: #0a0a0a;
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}

/* ── Lead row (list view) ────────────────────────────────────────── */
.lead-row {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  background: #fff;
  transition: border-color .1s;
}
.lead-row:hover        { border-color: #e5e5e5 }
.lead-row--selected    { border-color: #0a0a0a }

.fade-enter-active,.fade-leave-active { transition: opacity .15s }
.fade-enter-from,.fade-leave-to       { opacity: 0 }
</style>