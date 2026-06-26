<template>
  <div data-template-selector style="position:relative">
    <button
      class="btn"
      :title="`Templates de ${channel || 'mensagem'}`"
      @click="open = !open"
      :disabled="!filtered.length">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Templates
      <span v-if="filtered.length" style="font-size:10px;opacity:.65">({{ filtered.length }})</span>
    </button>

    <Transition name="fade">
      <div v-if="open && filtered.length"
        style="position:absolute;top:calc(100% + 6px);left:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;min-width:260px;max-width:340px;box-shadow:0 4px 16px rgba(0,0,0,.12);overflow:hidden">
        <div style="padding:6px">
          <div v-for="tpl in filtered" :key="tpl.id"
            @click="select(tpl)"
            style="padding:8px 10px;border-radius:6px;cursor:pointer;transition:background .08s"
            :style="{ background: hovered === tpl.id ? 'var(--bg-subtle)' : 'transparent' }"
            @mouseenter="hovered = tpl.id"
            @mouseleave="hovered = null">
            <div style="font-size:13px;font-weight:500;color:var(--text-1)">{{ tpl.name }}</div>
            <div style="font-size:11px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">
              {{ tpl.content.slice(0, 60) }}{{ tpl.content.length > 60 ? '...' : '' }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { MessageTemplate } from '~/types'

const props = defineProps<{
  templates: MessageTemplate[]
  channel?: string
}>()

const emit = defineEmits<{ select: [tpl: MessageTemplate] }>()

const open    = ref(false)
const hovered = ref<string | null>(null)

const filtered = computed(() =>
  props.channel
    ? props.templates.filter(t => t.channel === props.channel)
    : props.templates
)

function select(tpl: MessageTemplate) {
  emit('select', tpl)
  open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

function onClickOutside(e: MouseEvent) {
  if (!(e.target as Element).closest?.('[data-template-selector]')) open.value = false
}
</script>
