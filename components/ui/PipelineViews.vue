<template>
  <div v-if="views.length || isFiltered" class="pv-bar">
    <span class="pv-label">Visões</span>

    <button
      v-for="v in views" :key="v.id"
      class="pv-chip" :class="{ active: v.id === activeId }"
      @click="applyView(v)">
      {{ v.name }}
      <span class="pv-x" title="Remover visão" @click.stop="remove(v.id)">×</span>
    </button>

    <button v-if="isFiltered" class="pv-chip pv-clear" @click="clear">
      Limpar filtros
    </button>

    <button
      class="pv-save" :disabled="!isFiltered"
      title="Salvar os filtros atuais como uma visão"
      @click="onSave">
      + Salvar visão
    </button>
  </div>
</template>

<script setup lang="ts">
type Filters = Record<string, unknown>

const props = defineProps<{ current: Filters; defaults: Filters }>()
const emit  = defineEmits<{ apply: [filters: Filters] }>()

const { views, load, save, remove, matches } = useSavedViews<Filters>('pipeline')
onMounted(load)

const activeId = computed(() => views.value.find(v => matches(props.current, v))?.id || null)
const isFiltered = computed(() => JSON.stringify(props.current) !== JSON.stringify(props.defaults))

function applyView(v: { filters: Filters }) {
  emit('apply', JSON.parse(JSON.stringify(v.filters)))
}
function clear() {
  emit('apply', JSON.parse(JSON.stringify(props.defaults)))
}
function onSave() {
  const name = (window.prompt('Nome da visão:') || '').trim()
  if (!name) return
  save(name, props.current)
}
</script>

<style scoped>
.pv-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pv-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-3);
  margin-right: 2px;
}
.pv-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pv-chip:hover { border-color: var(--accent); color: var(--text-1); }
.pv-chip.active {
  background: var(--accent-soft);
  border-color: var(--accent-bd);
  color: var(--accent);
}
.pv-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 13px;
  line-height: 1;
  color: var(--text-3);
  transition: all .12s;
}
.pv-x:hover { background: var(--bad-bg); color: var(--bad); }
.pv-clear { color: var(--text-3); }
.pv-clear:hover { border-color: var(--bad-bd); color: var(--bad); }
.pv-save {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pv-save:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pv-save:disabled { opacity: .4; cursor: not-allowed; }
</style>
