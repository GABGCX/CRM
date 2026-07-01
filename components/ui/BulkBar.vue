<template>
  <Transition name="bulk">
    <div v-if="count > 0" class="bulk-bar">
      <span class="bulk-count">{{ count }} selecionado{{ count > 1 ? 's' : '' }}</span>

      <div class="bulk-divider"></div>

      <select v-model="statusPick" class="bulk-select" title="Mudar status dos selecionados" @change="onStatus">
        <option value="">Mudar status...</option>
        <option v-for="s in statuses" :key="s" :value="s">{{ s }}</option>
      </select>

      <select v-if="tags.length" v-model="tagPick" class="bulk-select" title="Adicionar etiqueta aos selecionados" @change="onTag">
        <option value="">Adicionar etiqueta...</option>
        <option v-for="t in tags" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>

      <button class="bulk-btn bulk-danger" @click="emit('delete')">Excluir</button>

      <div class="bulk-divider"></div>

      <button class="bulk-btn" @click="emit('clear')">Limpar</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  count: number
  statuses: readonly string[]
  tags: { id: string; name: string }[]
}>()
const emit = defineEmits<{
  'set-status': [status: string]
  'add-tag': [tagId: string]
  delete: []
  clear: []
}>()

const statusPick = ref('')
const tagPick    = ref('')

function onStatus() {
  if (statusPick.value) { emit('set-status', statusPick.value); statusPick.value = '' }
}
function onTag() {
  if (tagPick.value) { emit('add-tag', tagPick.value); tagPick.value = '' }
}
</script>

<style scoped>
.bulk-bar {
  position: fixed;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: var(--text-1);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, .28);
  max-width: calc(100vw - 32px);
  flex-wrap: wrap;
}
.bulk-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--bg-card);
  white-space: nowrap;
}
.bulk-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, .18);
}
.bulk-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .08);
  color: var(--bg-card);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  max-width: 170px;
}
.bulk-select option { color: var(--text-1); background: var(--bg-card); }
.bulk-btn {
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, .22);
  background: rgba(255, 255, 255, .08);
  color: var(--bg-card);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background .12s;
  white-space: nowrap;
}
.bulk-btn:hover { background: rgba(255, 255, 255, .16); }
.bulk-danger { border-color: rgba(218, 30, 40, .55); background: rgba(218, 30, 40, .82); color: #fff; }
.bulk-danger:hover { background: rgba(218, 30, 40, 1); }

.bulk-enter-active, .bulk-leave-active { transition: all .2s cubic-bezier(.16, 1, .3, 1); }
.bulk-enter-from, .bulk-leave-to { opacity: 0; transform: translateX(-50%) translateY(10px); }
</style>
