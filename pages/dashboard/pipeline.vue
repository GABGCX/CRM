<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:18px">
      <div>
        <div class="page-title">Pipeline</div>
        <div class="page-sub">{{ totalLeads }} leads · {{ activeLeads.length }} ativos</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn" @click="exportCSV">
          <i class="ti ti-download" aria-hidden="true"></i> CSV
        </button>
        <button class="btn" @click="showImport = true">Importar CSV</button>
        <button class="btn btn-primary" @click="showModal = true">+ Novo lead</button>
      </div>
    </div>

    <!-- Resumo de valor do pipeline -->
    <div v-if="pipelineValue > 0" class="pipe-summary">
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Valor em pipeline</span>
        <span class="pipe-summary-value">R$ {{ fmtMoney(pipelineValue) }}</span>
        <span class="pipe-summary-hint">{{ leadsWithValue.length }} leads com valor</span>
      </div>
      <div class="pipe-summary-divider"></div>
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Previsão ponderada</span>
        <span class="pipe-summary-value" style="color:var(--ok)">R$ {{ fmtMoney(Math.round(weightedForecast)) }}</span>
        <span class="pipe-summary-hint">por probabilidade de estágio</span>
      </div>
      <div class="pipe-summary-divider"></div>
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Ticket médio aberto</span>
        <span class="pipe-summary-value">R$ {{ fmtMoney(avgTicket) }}</span>
        <span class="pipe-summary-hint">média dos leads ativos</span>
      </div>
    </div>

    <!-- Visualizacao (primaria) + filtros (secundarios) -->
    <div class="pipe-bar">
      <div class="pipe-views">
        <button class="pipe-view" :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
          Kanban
        </button>
        <button class="pipe-view" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Lista
        </button>
      </div>
      <div class="pipe-filters">
        <input v-model="searchQ" class="pipe-search" :placeholder="viewMode === 'kanban' ? 'Filtrar cards...' : 'Buscar lead...'" />
        <select v-if="tags.length" v-model="filterTag" class="pipe-filter-select" title="Filtrar por etiqueta">
          <option value="">Todas etiquetas</option>
          <option v-for="t in tags" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select v-model="filterCreated" class="pipe-filter-select" title="Filtrar por data de criação">
          <option value="">Qualquer criação</option>
          <option value="7">Criados: 7 dias</option>
          <option value="30">Criados: 30 dias</option>
          <option value="month">Criados: este mês</option>
        </select>
        <button class="pipe-toggle" :class="{ active: filterOverdue }"
          @click="filterOverdue = !filterOverdue" title="Apenas leads com retorno atrasado">
          Atrasados
        </button>
        <select v-if="viewMode === 'list'" v-model="filterStatus" class="pipe-filter-select" title="Filtrar por status">
          <option value="Todos">Todos os status ({{ totalLeads }})</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }} ({{ countByStatus[s] || 0 }})</option>
        </select>
        <select v-if="viewMode === 'list'" v-model="sortBy" class="pipe-filter-select" title="Ordenar">
          <option value="created_at">Mais recentes</option>
          <option value="data_retorno">Retorno próximo</option>
          <option value="fu_done">Menos follow-ups</option>
          <option value="score">Maior score</option>
        </select>
        <UiCardCustomizer />
      </div>
    </div>

    <!-- Kanban view -->
    <UiKanbanBoard
      v-if="viewMode === 'kanban'"
      :leads="filteredForKanban"
      :pending="pending"
      :prefs="cardPrefs"
      @select="openDetail"
      @status-change="onKanbanStatusChange"
    />

    <!-- List view -->
    <template v-else>
      <div v-if="pending" style="display:flex;flex-direction:column;gap:6px">
        <div v-for="i in 5" :key="i"
          style="height:66px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite" />
      </div>

      <UiEmptyLeads v-else-if="!filtered.length && filterStatus === 'Todos' && !searchQ" @create="showModal = true" />

      <div v-else-if="!filtered.length" style="text-align:center;padding:36px;color:var(--text-3);font-size:13px">
        Nenhum lead encontrado.
      </div>

      <div v-else class="lead-list">
        <div
          v-for="l in filtered" :key="l.id"
          @click="selectLead(l)"
          class="lead-row"
          :class="{ 'lead-row--selected': selectedId === l.id }">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:7px">
            <div style="min-width:0;flex:1">
              <div style="font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ l.decisor || 'Sem nome' }}
              </div>
              <div v-if="cardPrefs.company" style="display:flex;align-items:center;gap:6px">
                <span style="font-size:12px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ l.negocio || '' }}
                </span>
                <span v-if="l.fonte && FONTE_LABEL[l.fonte]"
                  style="font-size:10px;color:var(--text-3);background:var(--bg-subtle);border-radius:4px;padding:1px 5px;white-space:nowrap;flex-shrink:0">
                  {{ FONTE_LABEL[l.fonte] }}
                </span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-left:8px">
              <span v-if="isVencido(l)" style="font-size:10px;color:#dc2626;font-weight:600">vencido</span>
              <UiScorePill v-if="cardPrefs.score" :lead="l" />
              <UiStatusTag :status="l.resultado" />
            </div>
          </div>
          <div v-if="cardPrefs.tags && leadTags(l).length" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">
            <UiTagChip v-for="t in leadTags(l)" :key="t.id" :tag="t" />
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div v-if="cardPrefs.fu" style="display:flex;gap:2px;align-items:center">
              <div v-for="fu in sortedFU(l.followups)" :key="fu.attempt_index"
                class="fu-dot" :class="fu.completed_at ? 'fu-dot-done' : 'fu-dot-todo'" />
            </div>
            <span v-else></span>
            <div style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:8px">
              <UiLeadQuickActions class="lead-row-qa" :lead="l" @fu="handleToggleFU(l.id, fuDone(l))" />
              <UiMoneyPill v-if="cardPrefs.value" :value="l.valor_estimado" compact />
              <span v-if="cardPrefs.fu">{{ fuDone(l) }}/10</span>
              <span>{{ daysIn(l.created_at) }}d</span>
            </div>
          </div>
        </div>

        <div v-if="hasMore" style="padding:12px 0;text-align:center">
          <button class="btn" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? 'Carregando...' : `Carregar mais (${totalLeads - (leads?.length ?? 0)} restantes)` }}
          </button>
        </div>
      </div>
    </template>

    <!-- Detail drawer (slide-over) -->
    <Transition name="drawer">
      <div v-if="selectedLead" class="drawer-backdrop" @click.self="confirmClose">
        <aside class="drawer">
          <UiLeadDetail
            :lead="selectedLead"
            :templates="templates"
            :custom-defs="customDefs"
            show-close
            @close="confirmClose"
            @deleted="onLeadDeleted"
            @saved="showToast('Salvo!')"
            @unsaved="drawerUnsaved = $event" />
        </aside>
      </div>
    </Transition>

    <!-- New lead modal -->
    <LazyUiNewLeadModal
      v-if="showModal"
      :cadences="cadences"
      :custom-defs="customDefs"
      @close="showModal = false"
      @created="showToast('Lead criado!')"
      @go-duplicate="onGoDuplicate" />

    <LazyUiImportLeadsModal v-if="showImport" @close="showImport = false" @imported="onImported" />

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus, Cadence, MessageTemplate } from '~/types'
import {
  STATUSES, STAGE_PROBABILITY, FONTE_LABEL,
  fuDone, sortedFU, daysIn, isActive, calcLeadScore,
  fmtMoney, daysUntil, localDateISO,
} from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }

const viewMode = ref<'list' | 'kanban'>('kanban')
onMounted(() => {
  const saved = localStorage.getItem('pipeline-view')
  if (saved === 'kanban' || saved === 'list') viewMode.value = saved
})
watch(viewMode, v => localStorage.setItem('pipeline-view', v))

const {
  leads, pending, hasMore, loadingMore, loadMore, leadsTotal,
  activeLeads, toggleFU, patchStatus,
  exportCSV, refresh: refreshLeads,
} = useLeads()

const filterStatus       = ref('Todos')
const filterTag          = ref('')
const filterCreated      = ref<''|'7'|'30'|'month'>('')
const filterOverdue      = ref(false)
const searchQ            = ref('')
const sortBy             = ref<'created_at'|'data_retorno'|'fu_done'|'score'>('created_at')

const todayISO = localDateISO()
const monthStartISO = localDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

function matchesCreated(l: LeadWithFU): boolean {
  if (!filterCreated.value) return true
  const created = (l.created_at || '').slice(0, 10)
  if (!created) return false
  if (filterCreated.value === 'month') return created >= monthStartISO
  const d = new Date(); d.setDate(d.getDate() - Number(filterCreated.value))
  return created >= localDateISO(d)
}

// Filtros que valem tanto na lista quanto no kanban: etiqueta, atrasados, data de criação.
function passesExtra(l: LeadWithFU): boolean {
  const mt = !filterTag.value || (l.tag_ids || []).includes(filterTag.value)
  const mo = !filterOverdue.value || (!!l.data_retorno && l.data_retorno < todayISO)
  return mt && mo && matchesCreated(l)
}

const { tags, fetchTags, resolve: resolveTags } = useTags()
const { prefs: cardPrefs, init: initCardPrefs } = useCardPrefs()
const { defs: customDefs, load: loadCustomFields } = useCustomFields()
const route = useRoute()
onMounted(() => {
  fetchTags(); initCardPrefs(); loadCustomFields()
  // Drill-down vindo dos Relatórios (?status=...&view=list)
  if (typeof route.query.status === 'string') {
    filterStatus.value = route.query.status
    if (route.query.view === 'list') viewMode.value = 'list'
  }
})
const leadTags = (l: LeadWithFU) => resolveTags(l.tag_ids)
const selectedId    = ref<string | null>(null)
const showModal     = ref(false)
const showImport    = ref(false)
const toastMsg      = ref<string | null>(null)
const drawerUnsaved = ref(false)
const templates     = ref<MessageTemplate[]>([])

const showToast = (m: string) => { toastMsg.value = m; setTimeout(() => toastMsg.value = null, 2500) }
const isVencido = (l: LeadWithFU) => {
  const d = daysUntil(l.data_retorno)
  return d !== null && d < 0 && isActive(l)
}

const totalLeads    = computed(() => leadsTotal.value || (leads.value||[]).length)
const countByStatus = computed(() =>
  (leads.value||[]).reduce((a: Record<string,number>, l) => {
    a[l.resultado] = (a[l.resultado]||0) + 1; return a
  }, {})
)

// ── Inteligencia de valor do pipeline ──────────────────────────────────
const leadsWithValue = computed(() =>
  activeLeads.value.filter(l => l.valor_estimado && l.valor_estimado > 0)
)
const pipelineValue = computed(() =>
  leadsWithValue.value.reduce((s, l) => s + (l.valor_estimado || 0), 0)
)
const weightedForecast = computed(() =>
  leadsWithValue.value.reduce((s, l) => s + (l.valor_estimado || 0) * (STAGE_PROBABILITY[l.resultado] ?? 0), 0)
)
const avgTicket = computed(() =>
  leadsWithValue.value.length ? Math.round(pipelineValue.value / leadsWithValue.value.length) : 0
)

const filtered = computed(() => {
  let list = (leads.value||[]).filter(l => {
    const ms = filterStatus.value === 'Todos' || l.resultado === filterStatus.value
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) ||
               (l.negocio||'').toLowerCase().includes(q) ||
               (l.telefone||'').includes(q)
    return ms && mq && passesExtra(l)
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
  } else if (sortBy.value === 'score') {
    list = [...list].sort((a, b) => calcLeadScore(b) - calcLeadScore(a))
  }
  return list
})

// No Kanban as colunas ja representam os status, entao so busca e etiqueta filtram.
const filteredForKanban = computed(() =>
  (leads.value||[]).filter(l => {
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) || (l.negocio||'').toLowerCase().includes(q)
    return mq && passesExtra(l)
  })
)

async function onKanbanStatusChange(leadId: string, resultado: LeadStatus) {
  try {
    await patchStatus(leadId, resultado)
    showToast('Status atualizado!')
  } catch {
    showToast('Erro ao mover card.')
  }
}

const selectedLead = computed(() =>
  (leads.value||[]).find(l => l.id === selectedId.value) || null
)

function selectLead(l: LeadWithFU) {
  if (selectedId.value === l.id) return
  if (drawerUnsaved.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value = l.id
  drawerUnsaved.value = false
}

function openDetail(l: LeadWithFU) {
  selectLead(l)
}

function confirmClose() {
  if (drawerUnsaved.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value = null
  drawerUnsaved.value = false
}

function onLeadDeleted() {
  selectedId.value = null
  showToast('Lead removido.')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') confirmClose()
}

async function handleToggleFU(leadId: string, idx: number) {
  await toggleFU(leadId, idx)
}

const cadences  = ref<Cadence[]>([])
onMounted(async () => {
  try { cadences.value = await $fetch<Cadence[]>('/api/cadences') } catch {}
  try { templates.value = await $fetch<MessageTemplate[]>('/api/templates') } catch {}
})

function onGoDuplicate(id: string) {
  showModal.value = false
  viewMode.value = 'list'
  selectedId.value = id
}

async function onImported() {
  await refreshLeads()
  showToast('Leads importados com sucesso!')
}
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* ── Resumo de valor do pipeline ─────────────────────────── */
.pipe-summary {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, var(--border-soft));
  border-radius: var(--radius);
  padding: 16px 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-sm);
}
.pipe-summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 22px;
  flex: 1;
  min-width: 150px;
}
.pipe-summary-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-3, var(--text-3));
}
.pipe-summary-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-1, var(--text-1));
  letter-spacing: -.01em;
  line-height: 1.05;
  font-family: var(--font-mono);
}
.pipe-summary-hint { font-size: 11px; color: var(--text-3, var(--text-3)); }
.pipe-summary-divider { width: 1px; background: var(--border-soft, var(--border-soft)); align-self: stretch; }

.lead-value {
  font-weight: 600;
  color: var(--ok);
  background: var(--ok-bg);
  border: 1px solid var(--ok-bd);
  border-radius: 4px;
  padding: 0 5px;
}

/* ── Control bar: visualizacao (primaria) + filtros (secundarios) ── */
.pipe-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.pipe-views {
  display: flex;
  gap: 3px;
  background: var(--bg-subtle, var(--border-soft));
  border-radius: 9px;
  padding: 3px;
  flex-shrink: 0;
}
.pipe-view {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pipe-view:hover { color: var(--text-1); }
.pipe-view.active {
  background: var(--bg-card, #fff);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}
.pipe-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 0;
}
.pipe-search { width: 220px; max-width: 100%; }
.pipe-filter-select { width: auto; flex-shrink: 0; }
.pipe-toggle {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-2);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pipe-toggle:hover { border-color: var(--bad); color: var(--bad); }
.pipe-toggle.active { background: var(--bad-bg); border-color: var(--bad-bd); color: var(--bad); font-weight: 500; }

/* ── Lista (largura total) ───────────────────────────────── */
.lead-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* ── Drawer de detalhe (slide-over) ──────────────────────── */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(40, 40, 40, .45);
  backdrop-filter: blur(2px);
  z-index: 60;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: var(--bg-card, #fff);
  border-left: 1px solid var(--border, var(--border));
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, .14);
}
.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-soft, var(--border-soft));
  flex-shrink: 0;
}
.drawer-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.drawer-title { font-size: 17px; font-weight: 600; color: var(--text-1, var(--text-1)); letter-spacing: -.01em; }
.drawer-sub { font-size: 13px; color: var(--text-2, var(--text-2)); margin-top: 2px; }
.drawer-body { flex: 1; overflow-y: auto; padding: 18px 20px; }

.drawer-enter-active, .drawer-leave-active { transition: opacity .2s ease; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform .24s cubic-bezier(.16, 1, .3, 1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }

.view-toggle {
  display: flex;
  background: var(--border-soft);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
}
.view-toggle-btn:hover { color: var(--text-1) }
.view-toggle-btn.active {
  background:var(--bg-card);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.lead-row {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 11px 14px;
  cursor: pointer;
  background: var(--bg-card);
  transition: all .12s;
}
.lead-row:hover       { border-color: var(--border); }
.lead-row--selected   { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(15,98,254,.12); }
.lead-row-qa          { opacity: 0; transition: opacity .12s; }
.lead-row:hover .lead-row-qa,
.lead-row:focus-within .lead-row-qa { opacity: 1; }

.detail-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-soft);
  margin-bottom: 0;
}
.detail-tab-btn {
  padding: 8px 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-3);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
  margin-bottom: -1px;
}
.detail-tab-btn:hover { color: var(--text-2) }
.detail-tab-btn.active { color: var(--text-1); border-bottom-color: var(--accent); }

.fade-enter-active,.fade-leave-active { transition: opacity .15s }
.fade-enter-from,.fade-leave-to       { opacity: 0 }
</style>
