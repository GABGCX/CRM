<template>
  <div class="tp" data-tag-picker>
    <div class="tp-assigned">
      <UiTagChip v-for="t in assigned" :key="t.id" :tag="t" removable @remove="toggle(t.id)" />
      <button class="tp-add" @click="open = !open">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Etiqueta
      </button>
    </div>

    <Transition name="fade">
      <div v-if="open" class="tp-pop">
        <div class="tp-pop-list">
          <button v-for="t in tags" :key="t.id" class="tp-opt" @click="toggle(t.id)">
            <span class="tp-opt-dot" :style="{ background: t.color }" />
            <span class="tp-opt-name">{{ t.name }}</span>
            <svg v-if="isAssigned(t.id)" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <div v-if="!tags.length" class="tp-empty">Nenhuma etiqueta ainda. Crie a primeira abaixo.</div>
        </div>

        <div class="tp-create">
          <div class="tp-colors">
            <button v-for="c in TAG_COLORS" :key="c" class="tp-color" :class="{ active: newColor === c }"
              :style="{ background: c }" @click="newColor = c" :title="c" />
          </div>
          <div class="tp-create-row">
            <input v-model="newName" placeholder="Nova etiqueta..." maxlength="40"
              @keydown.enter="create" class="tp-input" />
            <button class="btn btn-primary tp-create-btn" :disabled="!newName.trim() || creating" @click="create">
              {{ creating ? '...' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { TAG_COLORS } from '~/composables/useTags'

const props = defineProps<{ modelValue: string[] }>()
const emit  = defineEmits<{ 'update:modelValue': [ids: string[]] }>()

const { tags, fetchTags, createTag, resolve } = useTags()
onMounted(() => {
  fetchTags()
  document.addEventListener('click', onClickOutside)
})
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const open      = ref(false)
const newName   = ref('')
const newColor  = ref(TAG_COLORS[5])
const creating  = ref(false)

const assigned = computed(() => resolve(props.modelValue))
const isAssigned = (id: string) => props.modelValue.includes(id)

function toggle(id: string) {
  const next = isAssigned(id)
    ? props.modelValue.filter(x => x !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

async function create() {
  if (!newName.value.trim()) return
  creating.value = true
  try {
    const t = await createTag(newName.value.trim(), newColor.value)
    emit('update:modelValue', [...props.modelValue, t.id])
    newName.value = ''
  } finally {
    creating.value = false
  }
}

function onClickOutside(e: MouseEvent) {
  if (!(e.target as Element)?.closest?.('[data-tag-picker]')) open.value = false
}
</script>

<style scoped>
.tp { position: relative; }
.tp-assigned { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.tp-add {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px dashed var(--border);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  font-family: inherit;
  transition: all .12s;
}
.tp-add:hover { border-color: var(--accent); color: var(--accent); }

.tp-pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 120;
  width: 260px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,.16);
  overflow: hidden;
}
.tp-pop-list { max-height: 200px; overflow-y: auto; padding: 5px; }
.tp-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  transition: background .1s;
}
.tp-opt:hover { background: var(--bg-subtle); }
.tp-opt-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.tp-opt-name { flex: 1; text-align: left; font-size: 13px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tp-empty { padding: 12px 10px; font-size: 12px; color: var(--text-3); text-align: center; line-height: 1.5; }

.tp-create { border-top: 1px solid var(--border-soft); padding: 9px; }
.tp-colors { display: flex; gap: 5px; margin-bottom: 8px; flex-wrap: wrap; }
.tp-color { width: 16px; height: 16px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; padding: 0; transition: transform .1s; }
.tp-color:hover { transform: scale(1.15); }
.tp-color.active { border-color: var(--text-1); }
.tp-create-row { display: flex; gap: 6px; }
.tp-input { flex: 1; font-size: 12px; }
.tp-create-btn { padding: 6px 12px; flex-shrink: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity .12s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
