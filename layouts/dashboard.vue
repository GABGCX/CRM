<template>
  <div class="app-shell">
    <!-- Topbar mobile (so <=768px) -->
    <header class="mobile-topbar">
      <button class="mobile-burger" @click="mobileOpen = true" aria-label="Abrir menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="mobile-brand">
        <UiBrandMark :size="26" radius="8px" glow />
        <span>Prospecta</span>
      </div>
      <button class="mobile-theme" @click="toggleTheme" :aria-label="isDark ? 'Tema claro' : 'Tema escuro'">
        <svg v-if="isDark" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
    </header>

    <Transition name="mb-fade">
      <div v-if="mobileOpen" class="sidebar-backdrop" @click="mobileOpen = false" />
    </Transition>

    <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed, 'sidebar--mobile-open': mobileOpen }">

      <!-- Header: logo + toggle -->
      <div class="sb-header">
        <div v-if="!collapsed" class="sb-logo">
          <div class="sb-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="min-width:0">
            <div class="sb-brand">Prospecta</div>
            <div class="sb-brand-sub">{{ profile?.name || 'BDR' }}</div>
          </div>
        </div>
        <button class="sb-toggle" @click="onToggleCollapse" :title="collapsed ? 'Expandir menu' : 'Recolher menu'">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
            :style="{ transform: collapsed ? 'rotate(180deg)' : '', transition: 'transform .18s' }">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sb-nav">
        <!-- Search -->
        <button class="sb-search" @click="openGlobalSearch" :title="collapsed ? 'Buscar lead (Ctrl+K)' : undefined">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <span v-show="!collapsed" class="sb-label">Buscar lead...</span>
          <kbd v-show="!collapsed" class="sb-kbd">Ctrl K</kbd>
        </button>

        <div v-show="!collapsed" class="sb-section">Hoje</div>

        <NuxtLink to="/dashboard" custom v-slot="{ isExactActive }">
          <button class="nav-item" :class="{ active: isExactActive }" @click="navigateTo('/dashboard')" :title="collapsed ? 'Início' : undefined">
            <i class="ti ti-home sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Início</span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/diario" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/diario')" :title="collapsed ? 'Meu Dia' : undefined">
            <i class="ti ti-calendar sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Meu Dia</span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/agenda" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/agenda')" :title="collapsed ? 'Agenda' : undefined">
            <i class="ti ti-calendar-event sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Agenda</span>
          </button>
        </NuxtLink>

        <div v-show="!collapsed" class="sb-section">Leads</div>

        <NuxtLink to="/dashboard/pipeline" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/pipeline')" :title="collapsed ? `Pipeline (${overdueCount} vencidos)` : undefined">
            <i class="ti ti-users sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Pipeline</span>
            <span v-if="overdueCount > 0" class="nav-badge">{{ overdueCount }}</span>
            <span v-if="overdueCount > 0" class="nav-dot"></span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/followup" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/followup')" :title="collapsed ? `Follow-up (${overdueCount} vencidos)` : undefined">
            <i class="ti ti-repeat sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Follow-up</span>
            <span v-if="overdueCount > 0" class="nav-badge">{{ overdueCount }}</span>
            <span v-if="overdueCount > 0" class="nav-dot"></span>
          </button>
        </NuxtLink>

        <NuxtLink v-if="isManager" to="/dashboard/cadencias" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/cadencias')" :title="collapsed ? 'Cadências' : undefined">
            <i class="ti ti-route sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Cadências</span>
          </button>
        </NuxtLink>

        <div v-show="!collapsed" class="sb-section">Análise</div>

        <NuxtLink to="/dashboard/matematica" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/matematica')" :title="collapsed ? 'Metas e Ritmo' : undefined">
            <i class="ti ti-calculator sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Metas e Ritmo</span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/relatorios" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/relatorios')" :title="collapsed ? 'Relatórios' : undefined">
            <i class="ti ti-chart-bar sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Relatórios</span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/atividade" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/atividade')" :title="collapsed ? 'Atividade' : undefined">
            <i class="ti ti-activity sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Atividade</span>
          </button>
        </NuxtLink>

        <NuxtLink v-if="isManager" to="/dashboard/gestao" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/gestao')" :title="collapsed ? 'Gestão' : undefined">
            <i class="ti ti-users-group sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Gestão</span>
          </button>
        </NuxtLink>

        <NuxtLink to="/dashboard/configuracoes" custom v-slot="{ isActive }">
          <button class="nav-item" :class="{ active: isActive }" @click="navigateTo('/dashboard/configuracoes')" :title="collapsed ? 'Configurações' : undefined">
            <i class="ti ti-settings sb-icon" aria-hidden="true"></i>
            <span v-show="!collapsed" class="sb-label">Configurações</span>
          </button>
        </NuxtLink>

        <!-- Dark mode toggle -->
        <button class="nav-item sb-theme-toggle" @click="toggleTheme" :title="isDark ? 'Mudar para claro' : 'Mudar para escuro'">
          <svg v-if="isDark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="sb-icon">
            <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="sb-icon">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <span v-show="!collapsed" class="sb-label">{{ isDark ? 'Tema claro' : 'Tema escuro' }}</span>
        </button>
      </nav>

      <!-- User footer -->
      <div class="sb-footer">
        <div class="sb-user">
          <div class="sb-avatar">{{ (profile?.name || 'U')[0].toUpperCase() }}</div>
          <template v-if="!collapsed">
            <div class="sb-user-info">
              <div class="sb-user-name">{{ profile?.name || 'Usuário' }}</div>
              <div class="sb-user-role">{{ profile?.role }}</div>
            </div>
            <button class="sb-logout" @click="logout" title="Sair">
              <i class="ti ti-logout" style="font-size:14px" aria-hidden="true"></i>
            </button>
          </template>
        </div>
      </div>

    </aside>

    <main class="main-content">
      <div class="page-container">
        <slot />
      </div>
    </main>

    <!-- Tab bar mobile (app-like, so <=768px) -->
    <nav class="mobile-tabbar">
      <button
        v-for="t in mobileTabs" :key="t.key"
        class="mtab" :class="{ active: t.match(route.path) }"
        @click="haptic(); navigateTo(t.to)">
        <span class="mtab-ic-wrap">
          <i class="ti" :class="t.icon" aria-hidden="true"></i>
          <span v-if="t.badge" class="mtab-badge">{{ t.badge > 9 ? '9+' : t.badge }}</span>
        </span>
        <span class="mtab-lbl">{{ t.label }}</span>
      </button>
      <button class="mtab" :class="{ active: mobileOpen }" @click="haptic(); mobileOpen = true">
        <span class="mtab-ic-wrap"><i class="ti ti-dots" aria-hidden="true"></i></span>
        <span class="mtab-lbl">Mais</span>
      </button>
    </nav>

    <LazyUiGlobalSearch @select="onSearchSelect" />
    <LazyUiOnboardingTour />

    <Transition name="toast">
      <div v-if="errorToast" class="layout-toast layout-toast-error">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        {{ errorToast }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { profile, fetchProfile } = useProfile()
const { overdueCount } = useLeads()
const { isDark, init: initDark, toggle: toggleTheme } = useDarkMode()

const isManager = computed(() => ['owner', 'admin'].includes(profile.value?.role || ''))

// Carrega o perfil assim que o usuario de auth estiver disponível (robusto a timing).
watch(user, (u) => { if (u && !profile.value) fetchProfile() }, { immediate: true })

useHead(computed(() => ({
  title: overdueCount.value > 0 ? `(${overdueCount.value}) Prospecta` : 'Prospecta',
})))

const collapsed       = ref(false)  // estado visual (icon-only) — sempre falso no mobile
const desktopCollapsed = ref(false) // preferencia persistida do desktop
const isMobile        = ref(false)
const mobileOpen      = ref(false)

// Fecha o drawer ao navegar
const route = useRoute()
watch(() => route.fullPath, () => { mobileOpen.value = false })

// ── Tab bar mobile (navegacao estilo app) ───────────────────────────────
interface MobileTab { key: string; label: string; icon: string; to: string; match: (p: string) => boolean; badge?: number }
const mobileTabs = computed<MobileTab[]>(() => [
  { key: 'home',   label: 'Início',    icon: 'ti-home',     to: '/dashboard',           match: (p: string) => p === '/dashboard' },
  { key: 'pipe',   label: 'Pipeline',  icon: 'ti-users',    to: '/dashboard/pipeline',  match: (p: string) => p.startsWith('/dashboard/pipeline') || p.startsWith('/dashboard/leads') },
  { key: 'follow', label: 'Follow-up', icon: 'ti-repeat',   to: '/dashboard/followup',  match: (p: string) => p.startsWith('/dashboard/followup'), badge: overdueCount.value },
  { key: 'act',    label: 'Atividade', icon: 'ti-activity', to: '/dashboard/atividade', match: (p: string) => p.startsWith('/dashboard/atividade') },
])

function onToggleCollapse() {
  if (isMobile.value) { mobileOpen.value = false; return }  // no mobile, age como "fechar"
  desktopCollapsed.value = !desktopCollapsed.value
  collapsed.value = desktopCollapsed.value
  localStorage.setItem('sidebar-collapsed', desktopCollapsed.value ? '1' : '0')
}

let mq: MediaQueryList | null = null
function onMqChange(e: MediaQueryListEvent | MediaQueryList) {
  isMobile.value = e.matches
  collapsed.value = e.matches ? false : desktopCollapsed.value
  if (!e.matches) mobileOpen.value = false
}

onMounted(() => {
  desktopCollapsed.value = localStorage.getItem('sidebar-collapsed') === '1'
  mq = window.matchMedia('(max-width: 768px)')
  onMqChange(mq)
  mq.addEventListener('change', onMqChange)
  initDark()
  fetchProfile()
  window.addEventListener('crm:toast-error', onCrmToastError)
})

const errorToast = ref<string | null>(null)
let errorToastTimer: ReturnType<typeof setTimeout> | null = null

function showErrorToast(msg: string) {
  errorToast.value = msg
  if (errorToastTimer) clearTimeout(errorToastTimer)
  errorToastTimer = setTimeout(() => (errorToast.value = null), 3000)
}

function onCrmToastError(e: Event) {
  showErrorToast((e as CustomEvent).detail?.message || 'Ocorreu um erro.')
}

onUnmounted(() => {
  window.removeEventListener('crm:toast-error', onCrmToastError)
  mq?.removeEventListener('change', onMqChange)
})

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}

function onSearchSelect(leadId: string) {
  navigateTo(`/dashboard/pipeline?highlight=${leadId}`)
}

function openGlobalSearch() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
}
</script>

<style scoped>
/* ── Sidebar header ─────────────────────────────────── */
.sb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 10px 11px;
  border-bottom: 1px solid var(--sb-border);
  flex-shrink: 0;
  gap: 8px;
}

.sb-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  flex: 1;
}

.sb-logo-icon {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--grad-brand);
  box-shadow: 0 3px 12px rgba(15,98,254,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sb-brand {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  font-family: var(--font-sans);
  letter-spacing: -.01em;
  white-space: nowrap;
}

.sb-brand-sub {
  font-size: 11px;
  color: var(--sb-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-toggle {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  border: 1px solid var(--sb-toggle-border);
  background: transparent;
  color: var(--sb-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .1s;
}
.sb-toggle:hover { border-color: #555; color: var(--sb-text-hover); background: var(--sb-hover); }

/* ── Nav ────────────────────────────────────────────── */
.sb-nav {
  padding: 8px 7px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sb-section {
  font-size: 10px;
  font-weight: 600;
  color: var(--sb-section);
  text-transform: uppercase;
  letter-spacing: .08em;
  padding: 8px 10px 3px;
  white-space: nowrap;
}

.sb-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid var(--sb-search-border);
  background: var(--sb-search-bg);
  color: var(--sb-text);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  margin-bottom: 6px;
  text-align: left;
  transition: all .12s;
  white-space: nowrap;
  overflow: hidden;
}
.sb-search:hover { border-color: var(--sb-toggle-border); color: var(--sb-text-hover); }

.sb-label {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-kbd {
  font-size: 10px;
  border: 1px solid var(--sb-kbd-border);
  border-radius: 4px;
  padding: 1px 5px;
  background: var(--sb-kbd-bg);
  color: var(--sb-section);
  flex-shrink: 0;
}

.sb-icon { font-size: 15px; flex-shrink: 0; }

/* ── Collapsed overrides ────────────────────────────── */
.sidebar--collapsed .sb-header  { justify-content: center; padding: 11px 0; }
.sidebar--collapsed .sb-toggle  { border: none; background: transparent; color: var(--sb-text); width: 36px; height: 36px; border-radius: 8px; }
.sidebar--collapsed .sb-toggle:hover { background: var(--sb-hover); color: var(--sb-text-hover); }
.sidebar--collapsed .sb-nav     { padding: 8px 5px; }
.sidebar--collapsed .sb-search  { padding: 9px; justify-content: center; width: 42px; margin: 0 auto 6px; }
.sidebar--collapsed .nav-item   { padding: 9px; justify-content: center; gap: 0; position: relative; }
.sidebar--collapsed .nav-badge  { display: none; }

/* Notificacao de vencidos: ponto pulsante visivel quando recolhido */
.nav-dot { display: none; }
.sidebar--collapsed .nav-dot {
  display: block;
  position: absolute;
  top: 5px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #dc2626;
  border: 1.5px solid var(--sb-bg);
  animation: nav-pulse 2s infinite;
}
@keyframes nav-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,.55); }
  60%      { box-shadow: 0 0 0 4px rgba(220,38,38,0); }
}
.sidebar--collapsed .sb-footer  { padding: 5px 4px; }
.sidebar--collapsed .sb-user    { padding: 4px; justify-content: center; }

/* ── User footer ────────────────────────────────────── */
.sb-footer {
  padding: 7px;
  border-top: 1px solid var(--sb-border);
  flex-shrink: 0;
}

.sb-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 7px;
  border-radius: 7px;
}

.sb-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #EDA398;
  color: #282828;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0;
}

.sb-user-info { flex: 1; min-width: 0; }

.sb-user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--sb-text-hover);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-user-role {
  font-size: 11px;
  color: var(--sb-text);
  text-transform: capitalize;
}

.sb-logout {
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  color: var(--sb-text);
  cursor: pointer;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all .1s;
}
.sb-logout:hover { background: rgba(220,38,38,.15); color: #ef4444; }

.sb-theme-toggle { margin-top: 4px; }

/* ── Mobile topbar + drawer ─────────────────────────── */
.mobile-topbar { justify-content: space-between; }
.mobile-burger, .mobile-theme {
  width: 36px; height: 36px; border: none; background: transparent;
  color: var(--text-2); cursor: pointer; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mobile-burger:hover, .mobile-theme:hover { background: var(--bg-subtle); color: var(--text-1); }
.mobile-brand { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--text-1); letter-spacing: -.01em; }
.mobile-brand-icon {
  width: 26px; height: 26px; border-radius: 8px; background: var(--grad-brand);
  box-shadow: 0 2px 10px rgba(15,98,254,.4);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mb-fade-enter-active, .mb-fade-leave-active { transition: opacity .2s ease; }
.mb-fade-enter-from, .mb-fade-leave-to { opacity: 0; }

/* ── Tab bar mobile (navegacao estilo app) ──────────── */
.mobile-tabbar { display: none; }
@media (max-width: 768px) {
  .mobile-tabbar {
    display: flex;
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 65;
    padding: 7px 6px calc(7px + env(safe-area-inset-bottom));
    background: var(--glass-bg);
    -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur);
    border-top: 1px solid var(--glass-brd);
  }
  .mtab {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; cursor: pointer; padding: 7px 2px 3px;
    color: var(--text-3); font-family: inherit; font-size: 10px; font-weight: 600;
    position: relative; -webkit-tap-highlight-color: transparent; transition: color .15s;
  }
  .mtab .ti { font-size: 24px; line-height: 1; transition: transform .18s var(--spring); }
  .mtab:active .ti { transform: scale(.8); }
  /* iOS: item ativo apenas na cor de tint (sem gradiente/indicador) */
  .mtab.active { color: var(--accent); }
  .mtab.active .ti, .mtab.active .mtab-lbl { color: var(--accent); }
  .mtab-ic-wrap { position: relative; display: flex; }
  .mtab-badge {
    position: absolute; top: -5px; right: -10px;
    min-width: 15px; height: 15px; padding: 0 4px;
    background: var(--bad); color: #fff; font-size: 9px; font-weight: 700;
    border-radius: 999px; display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--bg-card);
  }
}

/* ── Layout toast ───────────────────────────────────── */
.layout-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); font-size:13px; font-weight:500; padding:9px 16px; border-radius:8px; display:flex; align-items:center; gap:7px; box-shadow:0 2px 8px rgba(0,0,0,.14); z-index:9999; white-space:nowrap; pointer-events:none; letter-spacing:-.01em; }
.layout-toast-error { background:#dc2626; color:#fff; }
.toast-enter-active { transition:all .2s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition:all .15s ease-in; }
.toast-enter-from   { opacity:0; transform:translateX(-50%) translateY(8px) scale(.96); }
.toast-leave-to     { opacity:0; transform:translateX(-50%) translateY(4px) scale(.98); }
</style>
