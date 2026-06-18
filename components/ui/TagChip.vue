<template>
  <span class="tag-chip" :style="chipStyle">
    {{ tag.name }}
    <button v-if="removable" class="tag-chip-x" @click.stop="$emit('remove')" aria-label="remover">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import type { Tag } from '~/types'

const props = defineProps<{ tag: Tag; removable?: boolean }>()
defineEmits<{ remove: [] }>()

const chipStyle = computed(() => ({
  color: props.tag.color,
  background: props.tag.color + '1a',
  border: `1px solid ${props.tag.color}40`,
}))
</script>

<style scoped>
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 5px;
  white-space: nowrap;
  line-height: 1.6;
}
.tag-chip-x {
  display: flex;
  align-items: center;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  opacity: .6;
}
.tag-chip-x:hover { opacity: 1; }
</style>
