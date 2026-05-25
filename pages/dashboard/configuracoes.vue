<template>
  <div class="settings-page">

    <div class="page-header">
      <div class="page-title">Configurações</div>
      <div class="page-sub">{{ localOrg?.name || org?.name }} · {{ org?.slug }}.{{ appDomain }}</div>
    </div>

    <div v-if="loading" class="loading-state">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div v-for="i in 3" :key="i"
          style="height:200px;background:#fff;border:1px solid #e5e5e5;border-radius:10px;animation:pulse 1.5s infinite" />
      </div>
    </div>

    <div v-else class="settings-grid">

      <!-- ── Metas ─────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">Metas e financeiro</div>
        <form @submit.prevent="saveSettings" class="form">
          <div v-if="settingsError" class="alert alert-error">{{ settingsError }}</div>

          <div class="field">
            <label class="label">Nome da organização</label>
            <input v-model="sf.name" required class="input" />
          </div>
          <div class="field">
            <label class="label">Meta de faturamento mensal (R$)</label>
            <input v-model.number="sf.meta_mensal" type="number" min="0" step="500" class="input mono" />
          </div>
          <div class="field">
            <label class="label">Ticket médio (R$)</label>
            <input v-model.number="sf.ticket_medio" type="number" min="0" step="100" class="input mono" />
          </div>

          <!-- Projeções via useOutboundMath (fix #9) -->
          <div class="projections">
            <div class="projections-title">Números de ouro calculados</div>
            <div v-for="p in projections" :key="p.label" class="projection-row">
              <span class="projection-label">{{ p.label }}</span>
              <span class="projection-value">{{ p.value.toLocaleString('pt-BR') }}</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingSettings">
            <span v-if="savingSettings" class="spinner"></span>
            {{ savingSettings ? 'Salvando...' : 'Salvar metas' }}
          </button>
        </form>
      </div>

      <!-- ── Identidade visual ──────────────────────────── -->
      <div class="card">
        <div class="card-header">Identidade visual <span class="badge">white-label</span></div>
        <form @submit.prevent="saveTheme" class="form">
          <div v-if="themeError" class="alert alert-error">{{ themeError }}</div>

          <div class="field">
            <label class="label">Nome do produto</label>
            <input v-model="tf.product_name" required class="input" />
          </div>

          <div class="field">
            <label class="label">Cor primária</label>
            <div class="color-row">
              <div class="color-swatch-wrap">
                <input type="color" v-model="tf.primary_color" class="color-native" />
              </div>
              <input type="text" v-model="tf.primary_color" class="input mono"
                style="width:96px;flex-shrink:0" maxlength="7" />
              <div class="presets">
                <button v-for="c in PRESETS" :key="c" type="button"
                  class="preset" :class="{ 'preset-active': tf.primary_color === c }"
                  :style="{ background: c }" @click="tf.primary_color = c" :title="c" />
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">URL do logo</label>
            <input v-model="tf.logo_url" type="url" placeholder="https://..." class="input" />
          </div>
          <div class="field">
            <label class="label">URL do favicon</label>
            <input v-model="tf.favicon_url" type="url" placeholder="https://..." class="input" />
          </div>

          <div class="preview-block">
            <div class="preview-title">Preview</div>
            <div class="preview-card">
              <div class="preview-logo" :style="{ background: tf.primary_color }">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="preview-info">
                <div class="preview-name">{{ tf.product_name }}</div>
                <div class="preview-url" :style="{ color: tf.primary_color }">{{ org?.slug }}.{{ appDomain }}</div>
              </div>
              <button type="button" class="preview-cta" :style="{ background: tf.primary_color }">
                Entrar
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingTheme">
            <span v-if="savingTheme" class="spinner"></span>
            {{ savingTheme ? 'Salvando...' : 'Salvar tema' }}
          </button>
        </form>
      </div>

      <!-- ── Domínio ────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">Domínio customizado</div>
        <form @submit.prevent="saveDomain" class="form">
          <div v-if="domainError" class="alert alert-error">{{ domainError }}</div>

          <div class="field">
            <label class="label">Domínio próprio</label>
            <input v-model="domainVal" placeholder="crm.suaempresa.com.br" class="input mono" />
          </div>

          <div class="dns-guide">
            <div class="dns-guide-title">Como configurar</div>
            <ol class="dns-steps">
              <li>No painel DNS, crie um registro CNAME</li>
              <li>Nome: <code>crm</code> → Valor: <code>cname.vercel-dns.com</code></li>
              <li>Salve o domínio completo aqui</li>
              <li>Aguarde até <strong>48h</strong> para propagação</li>
            </ol>
          </div>

          <div class="domain-status">
            <span class="status-dot" :class="localOrg?.custom_domain ? 'status-on' : 'status-off'" />
            <span>
              {{ localOrg?.custom_domain
                  ? `Ativo: ${localOrg.custom_domain}`
                  : 'Nenhum domínio configurado' }}
            </span>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingDomain">
            <span v-if="savingDomain" class="spinner"></span>
            {{ savingDomain ? 'Salvando...' : 'Salvar domínio' }}
          </button>
        </form>
      </div>

      <!-- ── Equipe ─────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          Equipe
          <span v-if="members?.length" class="badge">{{ members.length }}</span>
        </div>

        <!-- Loading skeleton (fix #10) -->
        <div v-if="membersLoading" style="display:flex;flex-direction:column;gap:6px">
          <div v-for="i in 3" :key="i"
            style="height:40px;background:#f5f5f5;border-radius:8px;animation:pulse 1.5s infinite" />
        </div>

        <div v-else class="members-list">
          <div v-for="m in members" :key="m.id" class="member-row">
            <div class="avatar">{{ (m.name || 'U')[0].toUpperCase() }}</div>
            <div class="member-info">
              <div class="member-name">{{ m.name || '—' }}</div>
              <div class="member-email">{{ (m as any).email || '' }}</div>
            </div>
            <span class="role-tag" :class="m.role === 'owner' ? 'role-owner' : 'role-default'">
              {{ ROLE_LABELS[m.role] || m.role }}
            </span>
          </div>
          <div v-if="!members?.length" class="members-empty">Nenhum membro encontrado.</div>
        </div>

        <div class="invite-box">
          <div class="invite-title">Convidar membro</div>
          <div v-if="inviteError" class="alert alert-error">{{ inviteError }}</div>
          <form @submit.prevent="sendInvite" class="form">
            <div class="field">
              <label class="label">E-mail</label>
              <input v-model="inviteEmail" type="email" required
                placeholder="colega@empresa.com" class="input" />
            </div>
            <div class="field">
              <label class="label">Função</label>
              <select v-model="inviteRole" class="select">
                <option value="bdr">BDR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" class="btn" :disabled="inviting">
              <span v-if="inviting" class="spinner spinner-dark"></span>
              {{ inviting ? 'Enviando...' : '✉ Enviar convite por e-mail' }}
            </button>
          </form>
        </div>
      </div>

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
import type { Profile } from '~/types'

definePageMeta({ layout: 'dashboard' })

const config    = useRuntimeConfig()
const appDomain = config.public.appDomain
const supabase  = useSupabaseClient()
const { profile, org, fetchProfile } = useProfile()
const { applyTheme } = useTheme()

// ── UI state ──────────────────────────────────────────────────────────
const loading        = ref(true)
const membersLoading = ref(false)
const toast          = ref<string | null>(null)

const showToast = (msg: string) => {
  toast.value = msg
  setTimeout(() => (toast.value = null), 2500)
}

// ── Constantes ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = { owner:'Proprietário', admin:'Admin', bdr:'BDR' }
const PRESETS = [
  '#0a0a0a','#2563eb','#7c3aed','#db2777',
  '#dc2626','#ea580c','#d97706','#16a34a','#0891b2',
]

// ── Estado local ──────────────────────────────────────────────────────
const localOrg = ref<typeof org.value>(null)

// ── Forms ─────────────────────────────────────────────────────────────
const sf = reactive({ name:'', meta_mensal:10000, ticket_medio:2000 })
const tf = reactive({ product_name:'Outbound', primary_color:'#0a0a0a', logo_url:'', favicon_url:'' })
const domainVal   = ref('')
const inviteEmail = ref('')
const inviteRole  = ref('bdr')

// ── Loading flags ─────────────────────────────────────────────────────
const savingSettings = ref(false)
const savingTheme    = ref(false)
const savingDomain   = ref(false)
const inviting       = ref(false)

// ── Erros ─────────────────────────────────────────────────────────────
const settingsError = ref<string | null>(null)
const themeError    = ref<string | null>(null)
const domainError   = ref<string | null>(null)
const inviteError   = ref<string | null>(null)

// ── fix #9: useOutboundMath elimina lógica duplicada ──────────────────
const metaMensal  = computed(() => sf.meta_mensal  || 10000)
const ticketMedio = computed(() => sf.ticket_medio || 2000)
const { projections } = useOutboundMath(metaMensal, ticketMedio)

// ── Inicialização ─────────────────────────────────────────────────────
onMounted(async () => {
  await fetchProfile()
  loading.value = false
})

function syncFromOrg(o: NonNullable<typeof org.value>) {
  localOrg.value   = o
  sf.name          = o.name || ''
  sf.meta_mensal   = o.settings?.meta_mensal  ?? 10000
  sf.ticket_medio  = o.settings?.ticket_medio ?? 2000
  tf.product_name  = o.theme?.product_name  || 'Outbound'
  tf.primary_color = o.theme?.primary_color || '#0a0a0a'
  tf.logo_url      = o.theme?.logo_url      || ''
  tf.favicon_url   = o.theme?.favicon_url   || ''
  domainVal.value  = o.custom_domain || ''
}

watch(org, (o) => { if (o) syncFromOrg(o) }, { immediate: true, deep: true })

// ── Membros ───────────────────────────────────────────────────────────
const { data: members, refresh: refreshMembers } = await useAsyncData<Profile[]>(
  'cfg-members',
  async () => {
    if (!profile.value?.org_id) return []
    membersLoading.value = true
    try {
      const { data } = await supabase
        .from('profiles').select('*').eq('org_id', profile.value.org_id).order('created_at')
      return (data || []) as Profile[]
    } finally {
      membersLoading.value = false
    }
  },
  { watch: [profile] }
)

// ── Handlers ──────────────────────────────────────────────────────────
async function saveSettings() {
  savingSettings.value = true
  settingsError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings', {
      method: 'PATCH',
      body: { name: sf.name, meta_mensal: sf.meta_mensal, ticket_medio: sf.ticket_medio },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    showToast('Configurações salvas!')
  } catch (e: any) {
    settingsError.value = e?.data?.message || e?.message || 'Erro ao salvar.'
  } finally {
    savingSettings.value = false
  }
}

async function saveTheme() {
  savingTheme.value = true
  themeError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings/theme', {
      method: 'PATCH',
      body: {
        product_name:  tf.product_name,
        primary_color: tf.primary_color,
        accent_color:  tf.primary_color,
        logo_url:      tf.logo_url    || null,
        favicon_url:   tf.favicon_url || null,
      },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    applyTheme({
      primary_color: tf.primary_color,
      product_name:  tf.product_name,
      logo_url:      tf.logo_url    || null,
      favicon_url:   tf.favicon_url || null,
    })
    useHead({ title: tf.product_name })
    showToast('Tema aplicado!')
  } catch (e: any) {
    themeError.value = e?.data?.message || e?.message || 'Erro ao salvar.'
  } finally {
    savingTheme.value = false
  }
}

async function saveDomain() {
  savingDomain.value = true
  domainError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings', {
      method: 'PATCH',
      body: { custom_domain: domainVal.value || null },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    showToast('Domínio atualizado!')
  } catch (e: any) {
    domainError.value = e?.data?.message || e?.message || 'Domínio inválido ou já em uso.'
  } finally {
    savingDomain.value = false
  }
}

async function sendInvite() {
  inviting.value    = true
  inviteError.value = null
  try {
    await $fetch('/api/settings/invite', {
      method: 'POST',
      body: { email: inviteEmail.value, role: inviteRole.value },
    })
    inviteEmail.value = ''
    inviteRole.value  = 'bdr'
    await refreshMembers()
    showToast('Convite enviado!')
  } catch (e: any) {
    inviteError.value = e?.data?.message || e?.message || 'Erro ao enviar convite.'
  } finally {
    inviting.value = false
  }
}
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

.settings-page {
  --bg:#fafafa; --surface:#ffffff; --border:#e5e5e5; --border-soft:#f0f0f0;
  --text-1:#0a0a0a; --text-2:#525252; --text-3:#a3a3a3;
  --accent:#16a34a; --danger:#dc2626; --danger-bg:#fef2f2; --danger-bdr:#fecaca;
  --radius-sm:6px; --radius-md:8px; --radius-lg:10px;
  --transition:140ms cubic-bezier(0.16,1,0.3,1);
  font-family:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.page-header   { margin-bottom:20px }
.page-title    { font-size:15px;font-weight:500;color:var(--text-1);letter-spacing:-.015em }
.page-sub      { font-size:12px;color:var(--text-3);margin-top:2px }
.loading-state { padding:56px 0 }
.settings-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px }
@media(max-width:820px){ .settings-grid{grid-template-columns:1fr} }

.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:16px }
.card-header { font-size:13px;font-weight:500;color:var(--text-1);letter-spacing:-.01em;display:flex;align-items:center;gap:8px }
.badge { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);background:var(--bg);border:1px solid var(--border);padding:2px 6px;border-radius:4px }

.form  { display:flex;flex-direction:column;gap:12px }
.field { display:flex;flex-direction:column;gap:4px }
.label { font-size:11px;color:var(--text-3);letter-spacing:.01em }

.input,.select { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-1);font-size:13px;padding:7px 10px;width:100%;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color var(--transition),box-shadow var(--transition);-webkit-appearance:none;appearance:none }
.input::placeholder { color:var(--text-3) }
.input:focus,.select:focus { border-color:#a3a3a3;box-shadow:0 0 0 3px rgba(0,0,0,.04) }
.mono { font-family:"SF Mono","Fira Code",ui-monospace,monospace;font-size:12px;letter-spacing:.02em }
.select { cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px }

.alert { font-size:12px;padding:8px 11px;border-radius:var(--radius-sm);border:1px solid;line-height:1.5 }
.alert-error { background:var(--danger-bg);border-color:var(--danger-bdr);color:var(--danger) }

.projections { background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px }
.projections-title { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px }
.projection-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border-soft) }
.projection-row:last-child { border-bottom:none }
.projection-label { font-size:12px;color:var(--text-2) }
.projection-value { font-size:14px;font-weight:500;color:var(--text-1);font-variant-numeric:tabular-nums;letter-spacing:-.02em }

.color-row { display:flex;align-items:center;gap:8px;flex-wrap:wrap }
.color-swatch-wrap { width:34px;height:34px;border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden;flex-shrink:0;cursor:pointer }
.color-native { width:200%;height:200%;margin:-50%;border:none;padding:0;cursor:pointer;outline:none }
.presets { display:flex;gap:5px;align-items:center;flex-wrap:wrap }
.preset { width:17px;height:17px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;flex-shrink:0;transition:transform var(--transition),border-color var(--transition) }
.preset:hover { transform:scale(1.2) }
.preset-active { border-color:var(--text-1)!important;transform:scale(1.15) }

.preview-block { border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px;background:var(--bg) }
.preview-title { font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px }
.preview-card { display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px }
.preview-logo { width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background var(--transition) }
.preview-name { font-size:12px;font-weight:500;color:var(--text-1) }
.preview-url  { font-size:11px;margin-top:1px;transition:color var(--transition) }
.preview-cta  { margin-left:auto;padding:4px 12px;border-radius:var(--radius-sm);border:none;font-size:11px;font-weight:500;cursor:pointer;color:#fff;flex-shrink:0;transition:opacity var(--transition) }
.preview-cta:hover { opacity:.85 }

.dns-guide { background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px 14px }
.dns-guide-title { font-size:11px;font-weight:500;color:var(--text-2);margin-bottom:7px }
.dns-steps { font-size:12px;color:var(--text-2);line-height:1.85;padding-left:16px;margin:0 }
.dns-steps code { font-family:"SF Mono","Fira Code",ui-monospace,monospace;font-size:11px;background:var(--border-soft);border:1px solid var(--border);padding:1px 5px;border-radius:3px;color:var(--text-1) }

.domain-status { display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text-2) }
.status-dot  { width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background var(--transition) }
.status-on   { background:var(--accent) }
.status-off  { background:var(--border) }

.members-list  { display:flex;flex-direction:column;gap:2px }
.member-row    { display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:var(--radius-md);transition:background var(--transition);cursor:default }
.member-row:hover { background:var(--bg) }
.avatar        { width:28px;height:28px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-2);flex-shrink:0 }
.member-info   { flex:1;min-width:0 }
.member-name   { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.member-email  { font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.members-empty { font-size:12px;color:var(--text-3);padding:6px 10px }
.role-tag      { font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px;letter-spacing:.03em;flex-shrink:0 }
.role-owner    { background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe }
.role-default  { background:var(--bg);color:var(--text-3);border:1px solid var(--border) }

.invite-box   { border-top:1px solid var(--border-soft);padding-top:16px;display:flex;flex-direction:column;gap:10px }
.invite-title { font-size:12px;font-weight:500;color:var(--text-1) }

.btn { display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px;border-radius:var(--radius-md);font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text-1);width:100%;font-family:inherit;letter-spacing:-.01em;transition:background var(--transition),border-color var(--transition),transform var(--transition) }
.btn:hover:not(:disabled) { background:var(--bg);border-color:#d4d4d4 }
.btn:active:not(:disabled) { transform:scale(.99) }
.btn:disabled { opacity:.45;cursor:not-allowed }
.btn-primary  { background:var(--text-1);color:#fff;border-color:transparent }
.btn-primary:hover:not(:disabled) { background:#262626;border-color:transparent }

@keyframes spin { to{transform:rotate(360deg)} }
.spinner { width:12px;height:12px;border:1.5px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0 }
.spinner-dark { border-color:rgba(0,0,0,.1);border-top-color:var(--text-2) }

.toast { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text-1);color:#fff;font-size:13px;font-weight:500;padding:9px 16px;border-radius:var(--radius-md);display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:9999;white-space:nowrap;pointer-events:none;letter-spacing:-.01em }
.toast-enter-active { transition:all .2s cubic-bezier(0.16,1,0.3,1) }
.toast-leave-active { transition:all .15s ease-in }
.toast-enter-from   { opacity:0;transform:translateX(-50%) translateY(8px) scale(.96) }
.toast-leave-to     { opacity:0;transform:translateX(-50%) translateY(4px) scale(.98) }
</style>
