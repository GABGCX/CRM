<template>
  <span class="tag" :class="cls" style="display:inline-flex;align-items:center;gap:3px">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0" v-html="icon" />
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { statusTagClass, statusIconHtml } from '~/utils/leadDomain'

const props = defineProps<{ status: string }>()
const cls  = computed(() => statusTagClass(props.status))
const icon = computed(() => statusIconHtml(props.status))
</script>
