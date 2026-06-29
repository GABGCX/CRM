<template>
  <div class="settings-page">

    <div class="page-header">
      <div class="page-title">Configurações</div>
      <div class="page-sub">{{ org?.name }} · {{ org?.slug }}.{{ appDomain }}</div>
    </div>

    <div v-if="!loading" class="cfg-tabs">
      <button v-for="t in cfgTabs" :key="t.id" class="cfg-tab" :class="{ active: tab === t.id }" @click="tab = t.id">
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div v-for="i in 3" :key="i"
          style="height:200px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite" />
      </div>
    </div>

    <div v-else class="settings-grid">
      <UiSettingsAccount     v-if="tab === 'conta'"      @notify="showToast" />
      <UiSettingsProspecting v-if="tab === 'prospeccao'" @notify="showToast" />
      <UiSettingsTeam        v-if="tab === 'equipe'"     @notify="showToast" />
    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ toast }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const config    = useRuntimeConfig()
const appDomain = config.public.appDomain
const { org, fetchProfile } = useProfile()

const loading = ref(true)
const tab = ref<'conta' | 'prospeccao' | 'equipe'>('conta')
const cfgTabs = [
  { id: 'conta' as const,      label: 'Conta & Marca' },
  { id: 'prospeccao' as const, label: 'Prospecção' },
  { id: 'equipe' as const,     label: 'Equipe' },
]

const toast = ref<string | null>(null)
const showToast = (msg: string) => {
  toast.value = msg
  setTimeout(() => (toast.value = null), 2500)
}

onMounted(async () => {
  await fetchProfile()
  loading.value = false
})
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

.settings-page {
  --bg:var(--bg-subtle); --surface:#ffffff; --border:var(--border); --border-soft:var(--border-soft);
  --text-1:var(--text-1); --text-2:var(--text-2); --text-3:var(--text-3);
  --danger:var(--bad); --danger-bg:var(--bad-bg); --danger-bdr:var(--bad-bd);
  --radius-sm:2px; --radius-md:2px; --radius-lg:2px;
  --transition:140ms cubic-bezier(0.16,1,0.3,1);
  font-family:var(--font-sans),-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
}
[data-theme="dark"] .settings-page {
  --bg:#1a1a1d; --surface:#222226; --border:#323239; --border-soft:#27272c;
  --text-1:#d4d3da; --text-2:#93939c; --text-3:#65656d;
  --danger-bg:rgba(224,149,149,.12); --danger-bdr:rgba(224,149,149,.25);
}
.page-header   { margin-bottom:16px }
.page-title    { font-size:22px;font-weight:600;color:var(--text-1);letter-spacing:-.025em }
.page-sub      { font-size:13px;color:var(--text-3);margin-top:2px }
.loading-state { padding:56px 0 }

.cfg-tabs { display:flex;gap:3px;background:var(--bg-subtle,var(--border-soft));border-radius:10px;padding:3px;width:fit-content;margin-bottom:18px }
.cfg-tab { padding:6px 16px;border-radius:8px;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:var(--text-2);transition:all .12s }
.cfg-tab.active { background:var(--surface);color:var(--text-1);box-shadow:0 1px 3px rgba(0,0,0,.08) }
.settings-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px }
@media(max-width:820px){ .settings-grid{grid-template-columns:1fr} }

.toast { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text-1);color:#fff;font-size:13px;font-weight:500;padding:9px 16px;border-radius:var(--radius-md);display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:9999;white-space:nowrap;pointer-events:none;letter-spacing:-.01em }
.toast-enter-active { transition:all .2s cubic-bezier(0.16,1,0.3,1) }
.toast-leave-active { transition:all .15s ease-in }
.toast-enter-from   { opacity:0;transform:translateX(-50%) translateY(8px) scale(.96) }
.toast-leave-to     { opacity:0;transform:translateX(-50%) translateY(4px) scale(.98) }
</style>
