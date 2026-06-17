<template>
  <div class="metric-card">
    <div class="metric-label">
      <slot name="label">{{ label }}</slot>
    </div>
    <div class="metric-value">{{ value }}</div>
    <div v-if="sub" class="metric-sub" :class="subClass">{{ sub }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  value: string | number
  sub?: string
  subClass?: string
}>()
</script>
