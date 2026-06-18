<template>
  <div class="empty-leads">
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" class="empty-svg">
      <!-- Funil outline -->
      <path d="M12 14h48l-18 24v16l-12-6V38L12 14z" stroke="#e2e8f0" stroke-width="2.5" stroke-linejoin="round" fill="#f9f6ef"/>
      <!-- Linhas pontilhadas representando leads -->
      <line x1="26" y1="22" x2="46" y2="22" stroke="#b8cafd" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 3"/>
      <line x1="30" y1="30" x2="42" y2="30" stroke="#b8cafd" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 3"/>
      <!-- Seta de entrada no topo -->
      <path d="M36 4v8" stroke="#b8cafd" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 8l4-4 4 4" stroke="#b8cafd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <div class="empty-title">Ainda não há leads aqui</div>
    <div class="empty-sub">
      Comece criando seu primeiro lead. Um lead é qualquer empresa ou pessoa
      que você quer prospectar.
    </div>
    <button class="btn btn-primary" @click="$emit('create')">
      + Criar meu primeiro lead
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{ create: [] }>()
</script>

<style scoped>
.empty-leads {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  gap: 12px;
}

.empty-svg {
  opacity: .7;
  margin-bottom: 4px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-2);
}

.empty-sub {
  font-size: 13px;
  color: var(--text-3);
  max-width: 340px;
  line-height: 1.6;
}
</style>
