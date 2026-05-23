<template>
  <div class="app-shell">
    <aside class="sidebar">
      <!-- Logo -->
      <div style="padding:14px 14px 12px;border-bottom:1px solid #f0f0f0">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:24px;height:24px;border-radius:6px;background:#0a0a0a;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#0a0a0a">Outbound</div>
            <div style="font-size:11px;color:#737373">{{ profile?.name || 'BDR' }}</div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav style="padding:6px;flex:1;overflow-y:auto">
        <div style="font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.07em;padding:8px 8px 3px">Hoje</div>

        <NuxtLink to="/dashboard" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard')">
            <i class="ti ti-home" style="font-size:14px" aria-hidden="true"></i>Cockpit
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/diario" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/diario')">
            <i class="ti ti-calendar" style="font-size:14px" aria-hidden="true"></i>Diário
          </button>
        </NuxtLink>

        <div style="font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.07em;padding:8px 8px 3px;margin-top:4px">Leads</div>

        <NuxtLink to="/dashboard/pipeline" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/pipeline')">
            <i class="ti ti-users" style="font-size:14px" aria-hidden="true"></i>Pipeline
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/followup" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/followup')">
            <i class="ti ti-repeat" style="font-size:14px" aria-hidden="true"></i>Follow-up
            <span v-if="overdueCount > 0" class="nav-badge">{{ overdueCount }}</span>
          </button>
        </NuxtLink>

        <div style="font-size:10px;font-weight:500;color:#a3a3a3;text-transform:uppercase;letter-spacing:.07em;padding:8px 8px 3px;margin-top:4px">Análise</div>

        <NuxtLink to="/dashboard/matematica" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/matematica')">
            <i class="ti ti-calculator" style="font-size:14px" aria-hidden="true"></i>Matemática
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/configuracoes" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/configuracoes')">
            <i class="ti ti-settings" style="font-size:14px" aria-hidden="true"></i>Configurações
          </button>
        </NuxtLink>
      </nav>

      <!-- User -->
      <div style="padding:10px;border-top:1px solid #f0f0f0">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 8px">
          <div style="width:26px;height:26px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#525252;flex-shrink:0">
            {{ (profile?.name || 'U')[0].toUpperCase() }}
          </div>
          <div style="min-width:0;flex:1">
            <div style="font-size:12px;font-weight:500;color:#0a0a0a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ profile?.name || 'Usuário' }}</div>
            <div style="font-size:11px;color:#737373;text-transform:capitalize">{{ profile?.role }}</div>
          </div>
        </div>
        <button @click="logout" style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:5px;border:none;background:transparent;color:#a3a3a3;font-size:12px;font-family:inherit;cursor:pointer;width:100%;margin-top:2px" onmouseenter="this.style.color='#dc2626'" onmouseleave="this.style.color='#a3a3a3'">
          <i class="ti ti-logout" style="font-size:13px" aria-hidden="true"></i>Sair
        </button>
      </div>
    </aside>

    <main class="main-content">
      <div class="page-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { profile, fetchProfile } = useProfile()

const overdueLeads = useState<number>('overdue-count', () => 0)
const overdueCount = computed(() => overdueLeads.value)

onMounted(async () => {
  await fetchProfile()
  const today = new Date().toISOString().slice(0, 10)
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .lte('data_retorno', today)
    .not('resultado', 'in', '("Fechado","Recusado","Sem interesse")')
  overdueLeads.value = count || 0
})

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>
