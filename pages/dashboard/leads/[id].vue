<template>
  <div class="lead-page">
    <NuxtLink to="/dashboard/pipeline" class="lp-back">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      Pipeline
    </NuxtLink>

    <div v-if="pending && !lead">
      <UiSkeleton height="360px" />
    </div>

    <UiEmptyState
      v-else-if="!lead"
      title="Lead não encontrado"
      sub="Ele pode não estar carregado nesta sessão. Volte ao Pipeline e abra o lead por lá.">
      <template #icon>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </template>
    </UiEmptyState>

    <div v-else class="card lp-card">
      <UiLeadDetail
        :lead="lead"
        :templates="templates"
        :custom-defs="customDefs"
        @deleted="onDeleted"
        @saved="showToast('Salvo!')"
        @notify="showToast($event)" />
    </div>

    <Transition name="toast"><div v-if="toast" class="toast">{{ toast }}</div></Transition>
  </div>
</template>

<script setup lang="ts">
import type { MessageTemplate } from '~/types'
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { leads, pending } = useLeads()
const { defs: customDefs, load: loadCustomFields } = useCustomFields()

const leadId = computed(() => String(route.params.id))
const lead = computed(() => (leads.value || []).find(l => l.id === leadId.value) || null)

const templates = ref<MessageTemplate[]>([])
const toast = ref<string | null>(null)
const showToast = (m: string) => { toast.value = m; setTimeout(() => toast.value = null, 2500) }

onMounted(async () => {
  loadCustomFields()
  try { templates.value = await $fetch<MessageTemplate[]>('/api/templates') } catch {}
})

function onDeleted() {
  showToast('Lead removido.')
  navigateTo('/dashboard/pipeline')
}
</script>

<style scoped>
.lead-page { max-width: 680px; }
.lp-back {
  display: inline-flex; align-items: center; gap: 4px; margin-bottom: 14px;
  font-size: 13px; font-weight: 500; color: var(--text-2); text-decoration: none;
}
.lp-back:hover { color: var(--accent); }
.lp-card { padding: 0; overflow: hidden; }
</style>
