<template>
  <div>
    <UiPageHeader title="Agenda" sub="Seus retornos agendados, organizados por dia" />

    <div v-if="pending" style="display:flex;flex-direction:column;gap:10px">
      <UiSkeleton v-for="i in 3" :key="i" height="120px" radius="var(--radius)" />
    </div>

    <UiEmptyState
      v-else-if="!groups.length"
      title="Nenhum retorno agendado"
      sub="Quando você marcar uma data de retorno num lead, ele aparece aqui no dia certo.">
      <template #icon>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </template>
    </UiEmptyState>

    <div v-else class="agenda">
      <section v-for="g in groups" :key="g.key" class="card agenda-group">
        <div class="agenda-head">
          <span class="agenda-dot" :style="{ background: g.color }" />
          <span class="agenda-label">{{ g.label }}</span>
          <span class="agenda-count">{{ g.leads.length }}</span>
        </div>
        <NuxtLink
          v-for="l in g.leads" :key="l.id"
          :to="`/dashboard/pipeline?highlight=${l.id}`"
          class="agenda-row">
          <span class="agenda-name">{{ l.decisor || 'Sem nome' }}</span>
          <span class="agenda-company">{{ l.negocio || '' }}</span>
          <UiStatusTag :status="l.resultado" />
          <a v-if="l.telefone" :href="telHref(l.telefone)" class="agenda-call" @click.stop>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 9.81 2 2 0 0 1 2 1.84h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Ligar
          </a>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isActive, daysUntil, telHref } from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

const { leads, pending } = useLeads()

const groups = computed(() => {
  const withRet = (leads.value || []).filter(l => l.data_retorno && isActive(l))
  const overdue: typeof withRet = []
  const byDate = new Map<string, typeof withRet>()
  for (const l of withRet) {
    const d = daysUntil(l.data_retorno)
    if (d === null) continue
    if (d < 0) { overdue.push(l); continue }
    const k = l.data_retorno!
    if (!byDate.has(k)) byDate.set(k, [])
    byDate.get(k)!.push(l)
  }
  const out: { key: string; label: string; color: string; leads: typeof withRet }[] = []
  if (overdue.length) {
    out.push({ key: 'overdue', label: 'Vencidos', color: 'var(--bad)', leads: overdue })
  }
  for (const k of [...byDate.keys()].sort()) {
    const d = daysUntil(k) ?? 0
    const label = d === 0 ? 'Hoje'
      : d === 1 ? 'Amanhã'
      : new Date(k + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    const color = d === 0 ? 'var(--warn)' : d <= 3 ? 'var(--accent)' : 'var(--text-3)'
    out.push({ key: k, label, color, leads: byDate.get(k)! })
  }
  return out
})
</script>

<style scoped>
.agenda { display:flex; flex-direction:column; gap:12px; max-width:760px; }
.agenda-group { padding:0; overflow:hidden; }
.agenda-head { display:flex; align-items:center; gap:8px; padding:13px 16px; border-bottom:1px solid var(--border-soft); }
.agenda-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.agenda-label { font-size:13px; font-weight:600; color:var(--text-1); text-transform:capitalize; }
.agenda-count { margin-left:auto; font-size:11px; font-weight:600; color:var(--text-3); font-variant-numeric:tabular-nums; }
.agenda-row { display:flex; align-items:center; gap:10px; padding:11px 16px; border-bottom:1px solid var(--border-soft); text-decoration:none; transition:background .08s; }
.agenda-row:last-child { border-bottom:none; }
.agenda-row:hover { background:var(--bg-subtle); }
.agenda-name { font-size:13px; font-weight:500; color:var(--text-1); white-space:nowrap; }
.agenda-company { flex:1; min-width:0; font-size:12px; color:var(--text-3); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.agenda-call { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; color:var(--ok); border:1px solid var(--ok-bd); background:var(--ok-bg); border-radius:var(--radius); padding:3px 8px; text-decoration:none; flex-shrink:0; }
</style>
