<template>
  <div class="auth-wrap">
    <div class="auth-aurora" aria-hidden="true"></div>

    <div class="auth-inner">
      <!-- Brand -->
      <div class="auth-brand">
        <UiBrandMark :size="58" radius="17px" glow />
        <h1 class="auth-title text-gradient">Prospecta</h1>
        <p class="auth-sub">Configure sua prospecção em minutos.</p>
      </div>

      <form @submit.prevent="handleRegister" class="auth-card aura-border">

        <div v-if="error" class="auth-error">{{ error }}</div>

        <div class="auth-section">Sua conta</div>

        <div class="form-field">
          <label class="input-label">Seu nome</label>
          <input v-model="form.name" type="text" required placeholder="Maria Silva" />
        </div>
        <div class="form-field">
          <label class="input-label">E-mail</label>
          <input v-model="form.email" type="email" required placeholder="maria@empresa.com" />
        </div>
        <div class="form-field">
          <label class="input-label">Senha</label>
          <input v-model="form.password" type="password" required placeholder="Mínimo 8 caracteres" minlength="8" />
        </div>

        <div class="divider" style="margin:2px 0"></div>
        <div class="auth-section">Sua organização</div>

        <div class="form-field">
          <label class="input-label">Nome da empresa</label>
          <input v-model="form.orgName" type="text" required placeholder="Agência XYZ" @input="generateSlug" />
        </div>

        <div class="form-field">
          <label class="input-label">
            Subdomínio
            <span class="auth-hint">(seu endereço único)</span>
          </label>
          <div style="display:flex">
            <input
              v-model="form.slug"
              type="text" required
              placeholder="agência-xyz"
              style="border-radius:10px 0 0 10px;border-right:none"
              @input="form.slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
            <span class="auth-suffix">.{{ appDomain }}</span>
          </div>
          <p v-if="form.slug" class="auth-slug-preview">
            Acesso em: <strong>{{ form.slug }}.{{ appDomain }}</strong>
          </p>
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary auth-submit">
          <span v-if="loading" class="auth-loading">
            <span class="auth-spinner"></span>
            Criando organização...
          </span>
          <span v-else>Criar e entrar</span>
        </button>
      </form>

      <p class="auth-alt">
        Já tem conta?
        <NuxtLink to="/login" class="auth-alt-link">Entrar</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const config  = useRuntimeConfig()
const appDomain = config.public.appDomain

const loading = ref(false)
const error   = ref<string | null>(null)

const form = reactive({
  name: '', email: '', password: '',
  orgName: '', slug: '',
})

function generateSlug() {
  form.slug = form.orgName
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
}

async function handleRegister() {
  loading.value = true
  error.value   = null
  try {
    const res = await $fetch<{ error?: string }>('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        password: form.password,
        org_name: form.orgName,
        org_slug: form.slug,
      },
    })
    if (res.error) { error.value = res.error; return }
    const supabase = useSupabaseClient()
    await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    await navigateTo('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.error || 'Erro inesperado. Tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg) } }

.auth-wrap {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg);
  overflow: hidden;
}
.auth-aurora {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(38% 40% at 18% 15%, var(--aurora-1), transparent 72%),
    radial-gradient(42% 44% at 82% 22%, var(--aurora-2), transparent 72%),
    radial-gradient(46% 50% at 72% 88%, var(--aurora-3), transparent 72%),
    radial-gradient(40% 42% at 26% 84%, var(--aurora-2), transparent 72%);
  filter: blur(46px);
  animation: aurora-drift 26s var(--ease-out) infinite alternate;
}
.auth-inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  animation: auth-rise .5s var(--ease-out) both;
}
@keyframes auth-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

.auth-brand { text-align: center; margin-bottom: 26px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.auth-title { font-size: 34px; font-weight: 700; letter-spacing: -.04em; margin: 4px 0 0; line-height: 1; }
.auth-sub   { font-size: 14px; color: var(--text-2); margin: 0; }

.auth-card {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-brd);
  border-radius: var(--radius-xl);
  padding: 26px;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.auth-error { background: var(--bad-bg); border: 1px solid var(--bad-bd); color: #dc2626; font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.auth-section { font-size: 12px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: .06em; }
.auth-hint { font-size: 11px; color: var(--text-3); font-weight: 400; margin-left: 4px; }
.auth-suffix { display: flex; align-items: center; padding: 0 12px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 0 10px 10px 0; font-size: 13px; color: var(--text-2); white-space: nowrap; }
.auth-slug-preview { font-size: 12px; color: var(--accent); margin: 4px 0 0; font-weight: 500; }
.auth-submit { justify-content: center; width: 100%; padding: 11px 14px; font-size: 14px; margin-top: 4px; }
.auth-loading { display: flex; align-items: center; gap: 8px; }
.auth-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin .6s linear infinite; }
.auth-alt { text-align: center; font-size: 13px; color: var(--text-2); margin-top: 20px; }
.auth-alt-link { color: var(--accent); font-weight: 600; text-decoration: none; margin-left: 3px; }
</style>
