<template>
  <header class="ph">
    <div class="ph-main">
      <slot name="breadcrumb" />
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="sub" class="page-sub">{{ sub }}</p>
    </div>
    <div v-if="$slots.actions" class="ph-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
// Cabecalho de pagina padrao: titulo + subtitulo + acoes (slot).
// Usa as classes globais .page-title/.page-sub pra manter consistencia.
defineProps<{ title: string; sub?: string }>()
</script>

<style scoped>
.ph { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:18px; }
.ph-main { min-width:0; }
.ph-actions { display:flex; align-items:center; gap:8px; flex-wrap:wrap; flex-shrink:0; }
</style>
