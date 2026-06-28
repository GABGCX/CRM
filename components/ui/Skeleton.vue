<template>
  <div class="ui-skel" :style="{ height, width, borderRadius: radius }" />
</template>

<script setup lang="ts">
// Bloco de carregamento (pulse) reutilizavel. Use varios pra montar skeletons.
withDefaults(defineProps<{ height?: string; width?: string; radius?: string }>(), {
  height: '16px',
  width: '100%',
  radius: 'var(--radius)',
})
</script>

<style scoped>
.ui-skel { background: var(--bg-subtle); animation: ui-skel-pulse 1.5s ease-in-out infinite; }
@keyframes ui-skel-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
</style>
