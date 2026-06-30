<template>
  <div class="ui-empty">
    <div v-if="$slots.icon" class="ui-empty-icon"><slot name="icon" /></div>
    <div class="ui-empty-title">{{ title }}</div>
    <div v-if="sub" class="ui-empty-sub">{{ sub }}</div>
    <div v-if="$slots.action" class="ui-empty-action"><slot name="action" /></div>
  </div>
</template>

<script setup lang="ts">
// Estado vazio generico: icone (slot) + titulo + subtitulo + acao (slot).
defineProps<{ title: string; sub?: string }>()
</script>

<style scoped>
.ui-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:48px 24px; text-align:center; gap:10px; }
.ui-empty-icon { opacity:.7; margin-bottom:4px; color:var(--text-3); }
.ui-empty-title { font-size:15px; font-weight:600; color:var(--text-2); }
.ui-empty-sub { font-size:13px; color:var(--text-3); max-width:340px; line-height:1.6; }
.ui-empty-action { margin-top:6px; }
</style>
