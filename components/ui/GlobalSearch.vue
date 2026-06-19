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
          placeholder="Buscar lead por nome, empresa ou telefone…"
          @keydown.escape="close"
          @keydown.down.prevent="moveCursor(1)"
          @keydown.up.prevent="moveCursor(-1)"
          @keydown.enter.prevent="selectCurrent"
        />
        <kbd class="gs-esc">esc</kbd>
      </div>

      <div v-if="loading" class="gs-status">Buscando…</div>
      <div v-else-if="query.length >= 2 && results.length === 0" class="gs-status">Nenhum resultado para "{{ query }}"</div>

      <ul v-if="results.length" class="gs-list">
        <li
          v-for="(lead, i) in results"
          :key="lead.id"
          class="gs-item"
          :class="{ 'gs-item-active': cursor === i }"
          @mouseenter="cursor = i"
          @click="select(lead)"
        >
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:28px;height:28px;border-radius:6px;background:var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-2);flex-shrink:0">
              {{ (lead.negocio || lead.decisor || '?')[0].toUpperCase() }}
            </div>
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
      </ul>

      <div class="gs-footer">
        <span>↑↓ navegar</span>
        <span>↵ selecionar</span>
        <span>esc fechar</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'select', leadId: string): void
}>()

const open     = ref(false)
const query    = ref('')
const results  = ref<any[]>([])
const cursor   = ref(0)
const loading  = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const STATUS_DOT_COLOR: Record<string, string> = {
  'Aguardando retorno': '#f59e0b',
  'Follow-up':          '#3b82f6',
  'De molho':           '#8b5cf6',
  'Reunião agendada':   '#0d9488',
  'Enviar proposta':    '#f97316',
  'Proposta enviada':   '#06b6d4',
  'Fechado':            '#16a34a',
  'Recusado':           '#ef4444',
  'Sem interesse':      '#6b7280',
  'Não atende':         '#9ca3af',
}
function statusDotColor(status: string): string {
  return STATUS_DOT_COLOR[status] || '#cbd5e1'
}

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
  open.value  = false
  query.value = ''
  results.value = []
}

function openSearch() {
  open.value = true
  nextTick(() => inputRef.value?.focus())
}

function moveCursor(dir: 1 | -1) {
  const len = results.value.length
  if (!len) return
  cursor.value = (cursor.value + dir + len) % len
}

function selectCurrent() {
  if (results.value[cursor.value]) select(results.value[cursor.value])
}

function select(lead: any) {
  emit('select', lead.id)
  close()
}

// Ctrl+K / Cmd+K opens the search
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

.gs-list { list-style:none;margin:0;padding:6px 0;max-height:340px;overflow-y:auto }
.gs-item { padding:10px 16px;cursor:pointer;display:flex;flex-direction:column;gap:3px;transition:background .1s }
.gs-item-active { background:var(--bg-subtle) }
.gs-item-name { font-size:14px;font-weight:500;color:var(--text-1) }
.gs-item-sub { font-size:12px;color:var(--text-3) }

.gs-footer { display:flex;gap:14px;padding:9px 16px;border-top:1px solid var(--border-soft);font-size:11px;color:var(--text-3) }
</style>
