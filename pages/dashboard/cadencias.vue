<template>
  <div>
    <UiPageHeader
      title="Cadências"
      sub="Sequências de follow-up que guiam a prospecção dos seus leads" />

    <div v-if="isManager" class="card">
      <UiCadenceManager />
    </div>

    <UiEmptyState
      v-else
      title="Acesso restrito"
      sub="Apenas gestores (owner/admin) criam e editam cadências. Você pode aplicá-las ao criar um lead no Pipeline.">
      <template #icon>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </template>
    </UiEmptyState>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { profile } = useProfile()
const isManager = computed(() => ['owner', 'admin'].includes(profile.value?.role || ''))
</script>
