<template>
  <div>
    <UiPageHeader title="Atividade" sub="Tudo que aconteceu nos leads da equipe, do mais recente ao mais antigo" />

    <div v-if="pending" style="display:flex;flex-direction:column;gap:8px;max-width:720px">
      <UiSkeleton v-for="i in 6" :key="i" height="52px" />
    </div>

    <UiEmptyState
      v-else-if="!events || !events.length"
      title="Nada por aqui ainda"
      sub="Conforme a equipe registra ligações, reuniões, status e notas nos leads, tudo aparece aqui.">
      <template #icon>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </template>
    </UiEmptyState>

    <div v-else class="card act-feed">
      <NuxtLink
        v-for="ev in events" :key="ev.id"
        :to="`/dashboard/leads/${ev.lead_id}`"
        class="act-row">
        <span class="act-icon" :class="`act-icon--${ev.type}`">{{ eventIcon(ev.type) }}</span>
        <div class="act-main">
          <div class="act-label">{{ eventLabel(ev) }}</div>
          <div class="act-sub">
            <strong>{{ ev.leads?.decisor || 'Lead' }}</strong>
            <span v-if="ev.leads?.negocio"> · {{ ev.leads.negocio }}</span>
            <span class="act-by"> · {{ ev.profiles?.name || 'Alguém' }}</span>
          </div>
        </div>
        <span class="act-time">{{ fmtTime(ev.created_at) }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { eventIcon, eventLabel } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const events  = ref<any[]>([])
const pending = ref(true)
const url = (s: string) => s // evita a inferencia de rota tipada (excessive stack depth)

onMounted(async () => {
  try { events.value = await $fetch<any[]>(url('/api/activity')) }
  catch { /* silencioso */ }
  finally { pending.value = false }
})

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'agora'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}
</script>

<style scoped>
.act-feed { padding:0; max-width:720px; overflow:hidden; }
.act-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border-soft); text-decoration:none; transition:background .08s; }
.act-row:last-child { border-bottom:none; }
.act-row:hover { background:var(--bg-subtle); }
.act-icon { width:30px; height:30px; border-radius:50%; background:var(--bg-subtle); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:13px; font-weight:700; color:var(--text-2); }
.act-icon--activity { background:var(--accent-soft); color:var(--accent); }
.act-icon--status_change { background:var(--warn-bg); color:var(--warn); }
.act-icon--created { background:var(--ok-bg); color:var(--ok); }
.act-main { flex:1; min-width:0; }
.act-label { font-size:13px; font-weight:500; color:var(--text-1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.act-sub { font-size:12px; color:var(--text-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.act-sub strong { color:var(--text-2); font-weight:600; }
.act-by { color:var(--text-3); }
.act-time { font-size:11px; color:var(--text-3); flex-shrink:0; font-variant-numeric:tabular-nums; }
</style>
