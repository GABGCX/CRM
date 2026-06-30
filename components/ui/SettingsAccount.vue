<template>
  <!-- Aba "Conta & Marca": metas, identidade visual, dominio, campos. -->
  <div class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
      </svg>
      Metas e financeiro
    </div>
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

  <div class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
      </svg>
      Personalização da marca
      <span class="badge">white-label</span>
    </div>
    <form @submit.prevent="saveTheme" class="form">
      <div v-if="themeError" class="alert alert-error">{{ themeError }}</div>

      <div class="field">
        <label class="label">Nome do produto</label>
        <input v-model="tf.product_name" required class="input" />
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
          <div class="preview-logo" style="background:var(--accent)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="preview-info">
            <div class="preview-name">{{ tf.product_name }}</div>
            <div class="preview-url" style="color:var(--accent)">{{ org?.slug }}.{{ appDomain }}</div>
          </div>
          <button type="button" class="preview-cta" style="background:var(--accent)">
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

  <div class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
      Domínio customizado
    </div>
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

  <div class="card">
    <UiCustomFieldsManager />
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ notify: [msg: string] }>()

const config    = useRuntimeConfig()
const appDomain = config.public.appDomain
const { org, fetchProfile } = useProfile()
const { applyTheme } = useTheme()

// Marca travada em Carbon: a cor primaria nao e editavel; persiste o azul Carbon.
const BRAND_COLOR = '#0f62fe'

const localOrg = ref<typeof org.value>(null)

const sf = reactive({ name:'', meta_mensal:10000, ticket_medio:2000 })
const tf = reactive({ product_name:'Outbound', primary_color:BRAND_COLOR, logo_url:'', favicon_url:'' })
const domainVal = ref('')

const savingSettings = ref(false)
const savingTheme    = ref(false)
const savingDomain   = ref(false)

const settingsError = ref<string | null>(null)
const themeError    = ref<string | null>(null)
const domainError   = ref<string | null>(null)

// fix #9: useOutboundMath elimina logica duplicada
const metaMensal  = computed(() => sf.meta_mensal  || 10000)
const ticketMedio = computed(() => sf.ticket_medio || 2000)
const { projections } = useOutboundMath(metaMensal, ticketMedio)

function syncFromOrg(o: NonNullable<typeof org.value>) {
  localOrg.value   = o
  sf.name          = o.name || ''
  sf.meta_mensal   = o.settings?.meta_mensal  ?? 10000
  sf.ticket_medio  = o.settings?.ticket_medio ?? 2000
  tf.product_name  = o.theme?.product_name  || 'Outbound'
  tf.primary_color = BRAND_COLOR  // marca travada em Carbon; normaliza valor legado no proximo save
  tf.logo_url      = o.theme?.logo_url      || ''
  tf.favicon_url   = o.theme?.favicon_url   || ''
  domainVal.value  = o.custom_domain || ''
}

watch(org, (o) => { if (o) syncFromOrg(o) }, { immediate: true, deep: true })

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
    emit('notify', 'Configurações salvas!')
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
    emit('notify', 'Tema aplicado!')
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
    emit('notify', 'Domínio atualizado!')
  } catch (e: any) {
    domainError.value = e?.data?.message || e?.message || 'Domínio inválido ou já em uso.'
  } finally {
    savingDomain.value = false
  }
}
</script>

<style scoped>
.projections { background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px }
.projections-title { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px }
.projection-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border-soft) }
.projection-row:last-child { border-bottom:none }
.projection-label { font-size:12px;color:var(--text-2) }
.projection-value { font-size:14px;font-weight:600;color:var(--text-1);font-variant-numeric:tabular-nums;letter-spacing:-.01em;font-family:var(--font-mono) }

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
</style>
