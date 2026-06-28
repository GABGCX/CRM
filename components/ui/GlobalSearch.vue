<template>
  <div class="gs-wrap" v-if="open">
    <div class="gs-backdrop" @click="close" />
    <div class="gs-modal">
      <div class="gs-input-row">
        <svg class="gs-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref="inputRef"
          v-model="query"
          class="gs-input"
          placeholder="Buscar lead ou executar uma ação…"
          @keydown.escape="close"
          @keydown.down.prevent="moveCursor(1)"
          @keydown.up.prevent="moveCursor(-1)"
          @keydown.enter.prevent="selectCurrent"
        />
        <kbd class="gs-esc">esc</kbd>
      </div>

      <div v-if="loading" class="gs-status">Buscando…</div>

      <ul v-if="filteredActions.length || results.length" class="gs-list">
        <template v-if="filteredActions.length">
          <li class="gs-section">Ações</li>
          <li
            v-for="(a, i) in filteredActions"
            :key="a.id"
            class="gs-item"
            :class="{ 'gs-item-active': cursor === i }"
            @mouseenter="cursor = i"
            @click="runAction(a)"
          >
            <div class="gs-row">
              <span class="gs-act-icon" v-html="a.icon" />
              <span class="gs-item-name">{{ a.label }}</span>
              <span class="gs-act-hint">{{ a.hint }}</span>
            </div>
          </li>
        </template>

        <template v-if="results.length">
          <li class="gs-section">Leads</li>
          <li
            v-for="(lead, j) in results"
            :key="lead.id"
            class="gs-item"
            :class="{ 'gs-item-active': cursor === filteredActions.length + j }"
            @mouseenter="cursor = filteredActions.length + j"
            @click="select(lead)"
          >
            <div class="gs-row">
              <div class="gs-avatar">{{ (lead.negocio || lead.decisor || '?')[0].toUpperCase() }}</div>
              <div style="min-width:0;flex:1">
                <div class="gs-item-name">{{ lead.decisor }}</div>
                <div class="gs-item-sub" style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
                  <span v-if="lead.negocio">{{ lead.negocio }}</span>
                  <span v-if="lead.negocio" style="color:var(--border)">·</span>
                  <span style="display:inline-flex;align-items:center;gap:3px">
                    <span style="width:6px;height:6px;border-radius:50%;flex-shrink:0;display:inline-block"
                      :style="{ background: statusDotColor(lead.resultado) }"></span>
                    {{ lead.resultado }}
                  </span>
                  <span v-if="lead.telefone" style="color:var(--border)">·</span>
                  <span v-if="lead.telefone">{{ lead.telefone }}</span>
                </div>
              </div>
            </div>
          </li>
        </template>
      </ul>

      <div v-else-if="query.length >= 2 && !loading" class="gs-status">Nenhum resultado para "{{ query }}"</div>

      <div class="gs-footer">
        <span>↑↓ navegar</span>
        <span>↵ selecionar</span>
        <span>esc fechar</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'select', leadId: string): void }>()

const open     = ref(false)
const query    = ref('')
const results  = ref<any[]>([])
const cursor   = ref(0)
const loading  = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// ── Acoes rapidas (command palette) ─────────────────────────────────────
type Action = { id: string; label: string; hint: string; icon: string; to?: string; kind: 'nav' | 'new' }
const ICON_ARROW = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
const ICON_PLUS  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
const ACTIONS: Action[] = [
  { id: 'new-lead',   label: 'Novo lead',     hint: 'Criar',    icon: ICON_PLUS,  kind: 'new' },
  { id: 'pipeline',   label: 'Pipeline',      hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/pipeline' },
  { id: 'followup',   label: 'Follow-up',     hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/followup' },
  { id: 'agenda',     label: 'Agenda',        hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/agenda' },
  { id: 'diario',     label: 'Meu Dia',       hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/diario' },
  { id: 'relatorios', label: 'Relatórios',    hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/relatorios' },
  { id: 'matematica', label: 'Metas e Ritmo', hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/matematica' },
  { id: 'config',     label: 'Configurações', hint: 'Ir para',  icon: ICON_ARROW, kind: 'nav', to: '/dashboard/configuracoes' },
]
const filteredActions = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return ACTIONS
  return ACTIONS.filter(a => a.label.toLowerCase().includes(q))
})

const STATUS_DOT_COLOR: Record<string, string> = {
  'Novo': '#8a857d', 'Prospecção': '#5b6bb0', 'Qualificação': '#4f7fa8',
  'Aguardando retorno': '#a87b35', 'Follow-up': '#46599a', 'De molho': '#7a6f9c',
  'Reunião agendada': '#3f7a74', 'Enviar proposta': '#a8693f', 'Proposta enviada': '#4f7d8a',
  'Fechado': '#4e8c6a', 'Recusado': '#b14a44', 'Sem interesse': '#8a857d', 'Não atende': '#a8a39b',
}
function statusDotColor(status: string): string { return STATUS_DOT_COLOR[status] || '#cbd5e1' }

let debounce: ReturnType<typeof setTimeout> | null = null
watch(query, (q) => {
  cursor.value = 0
  if (debounce) clearTimeout(debounce)
  if (q.length < 2) { results.value = []; return }
  loading.value = true
  debounce = setTimeout(async () => {
    try {
      const res = await $fetch<{ leads: any[] }>('/api/search', { query: { q } })
      results.value = res.leads
    } finally {
      loading.value = false
    }
  }, 200)
})

function close() {
  open.value = false
  query.value = ''
  results.value = []
  cursor.value = 0
}

function openSearch() {
  open.value = true
  cursor.value = 0
  nextTick(() => inputRef.value?.focus())
}

const itemsLen = computed(() => filteredActions.value.length + results.value.length)
function moveCursor(dir: 1 | -1) {
  const len = itemsLen.value
  if (!len) return
  cursor.value = (cursor.value + dir + len) % len
}

function selectCurrent() {
  const fa = filteredActions.value
  if (cursor.value < fa.length) runAction(fa[cursor.value])
  else { const lead = results.value[cursor.value - fa.length]; if (lead) select(lead) }
}

function runAction(a: Action) {
  close()
  if (a.kind === 'nav' && a.to) navigateTo(a.to)
  else if (a.kind === 'new') navigateTo('/dashboard/pipeline?new=1')
}

function select(lead: any) {
  emit('select', lead.id)
  close()
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    open.value ? close() : openSearch()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.gs-wrap { position:fixed;inset:0;z-index:9000;display:flex;align-items:flex-start;justify-content:center;padding-top:80px }
.gs-backdrop { position:absolute;inset:0;background:rgba(40,40,40,.5);backdrop-filter:blur(3px) }
.gs-modal { position:relative;width:100%;max-width:540px;background:var(--bg-card);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.2),0 8px 24px rgba(0,0,0,.08);overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--border-soft) }

.gs-input-row { display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border-soft) }
.gs-icon { flex-shrink:0;color:var(--text-3) }
.gs-input { flex:1;border:none;outline:none;font-size:15px;color:var(--text-1);background:transparent;font-family:inherit }
.gs-input::placeholder { color:var(--text-3) }
.gs-esc { font-size:10px;color:var(--text-3);border:1px solid var(--border);border-radius:4px;padding:2px 6px;font-family:inherit;cursor:default;background:var(--bg-subtle) }

.gs-status { font-size:13px;color:var(--text-3);padding:16px;text-align:center }

.gs-list { list-style:none;margin:0;padding:6px 0;max-height:360px;overflow-y:auto }
.gs-section { font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);padding:8px 16px 4px }
.gs-item { padding:9px 16px;cursor:pointer;transition:background .1s }
.gs-item-active { background:var(--bg-subtle) }
.gs-row { display:flex;align-items:center;gap:10px }
.gs-act-icon { width:28px;height:28px;border-radius:6px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0 }
.gs-act-hint { margin-left:auto;font-size:11px;color:var(--text-3);flex-shrink:0 }
.gs-avatar { width:28px;height:28px;border-radius:6px;background:var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-2);flex-shrink:0 }
.gs-item-name { font-size:14px;font-weight:500;color:var(--text-1) }
.gs-item-sub { font-size:12px;color:var(--text-3) }

.gs-footer { display:flex;gap:14px;padding:9px 16px;border-top:1px solid var(--border-soft);font-size:11px;color:var(--text-3) }
</style>
