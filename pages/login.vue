<template>
  <div class="auth-wrap">
    <div class="auth-aurora" aria-hidden="true"></div>

    <div class="auth-inner">
      <!-- Brand -->
      <div class="auth-brand">
        <UiBrandMark :size="58" radius="17px" glow />
        <h1 class="auth-title text-gradient">Prospecta</h1>
        <p class="auth-sub">Bem-vindo de volta. Acesse sua conta.</p>
      </div>

      <!-- Form (vidro + borda em gradiente animado) -->
      <form @submit.prevent="handleLogin" class="auth-card aura-border">

        <div v-if="error" class="auth-error">{{ error }}</div>

        <div class="form-field">
          <label class="input-label">E-mail</label>
          <input v-model="email" type="email" autocomplete="email" required placeholder="você@empresa.com" />
        </div>

        <div class="form-field">
          <div class="auth-pw-row">
            <label class="input-label">Senha</label>
            <button type="button" class="auth-link-btn" @click="forgotOpen = !forgotOpen">
              Esqueci minha senha
            </button>
          </div>
          <div style="position:relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
              :required="!forgotOpen" placeholder="••••••••" style="padding-right:40px" />
            <button type="button" @click="showPassword = !showPassword" class="auth-eye"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
              <svg v-if="!showPassword" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Recuperar senha (inline) -->
        <Transition name="slide-down">
          <div v-if="forgotOpen" class="auth-forgot">
            <div class="auth-forgot-title">Recuperar senha</div>
            <div v-if="forgotSuccess" class="auth-forgot-ok">
              Verifique seu e-mail para redefinir a senha.
            </div>
            <template v-else>
              <input v-model="forgotEmail" type="email" placeholder="seu@email.com"
                @keydown.enter.prevent="handleForgot" />
              <div v-if="forgotError" class="auth-forgot-err">{{ forgotError }}</div>
              <button type="button" class="btn btn-primary" style="justify-content:center"
                :disabled="forgotLoading" @click="handleForgot">
                {{ forgotLoading ? 'Enviando...' : 'Enviar link de recuperação' }}
              </button>
            </template>
          </div>
        </Transition>

        <button type="submit" :disabled="loading || forgotOpen" class="btn btn-primary auth-submit">
          <span v-if="loading" class="auth-loading">
            <span class="auth-spinner"></span>
            Entrando...
          </span>
          <span v-else>Entrar</span>
        </button>
      </form>

      <p class="auth-alt">
        Não tem conta?
        <NuxtLink to="/register" class="auth-alt-link">Criar organização</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref<string | null>(null)

const showPassword  = ref(false)
const forgotOpen    = ref(false)
const forgotEmail   = ref('')
const forgotLoading = ref(false)
const forgotError   = ref<string | null>(null)
const forgotSuccess = ref(false)

async function handleForgot() {
  if (!forgotEmail.value) { forgotError.value = 'Informe o e-mail.'; return }
  forgotLoading.value = true; forgotError.value = null
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: forgotEmail.value } })
    forgotSuccess.value = true
  } catch (e: any) {
    forgotError.value = e?.data?.message || 'Não foi possível enviar o e-mail.'
  } finally {
    forgotLoading.value = false
  }
}

async function handleLogin() {
  loading.value = true
  error.value   = null
  try {
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (err) {
      error.value = err.message.includes('Invalid login credentials')
        ? 'E-mail ou senha incorretos.'
        : err.message
      return
    }
    await navigateTo('/dashboard')
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
  max-width: 400px;
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
  gap: 16px;
}
.auth-error { background: var(--bad-bg); border: 1px solid var(--bad-bd); color: #dc2626; font-size: 13px; border-radius: 10px; padding: 10px 14px; }
.auth-pw-row { display: flex; align-items: center; justify-content: space-between; }
.auth-link-btn { background: none; border: none; font-size: 12px; color: var(--accent); cursor: pointer; padding: 0; font-family: inherit; font-weight: 500; }
.auth-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-3); padding: 0; display: flex; align-items: center; }
.auth-forgot { background: var(--accent-soft); border: 1px solid var(--accent-bd); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.auth-forgot-title { font-size: 13px; color: #0353e9; font-weight: 600; }
.auth-forgot-ok { font-size: 13px; color: #16a34a; }
.auth-forgot-err { font-size: 12px; color: #dc2626; }
.auth-submit { justify-content: center; width: 100%; padding: 11px 14px; font-size: 14px; margin-top: 2px; }
.auth-loading { display: flex; align-items: center; gap: 8px; }
.auth-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin .6s linear infinite; }
.auth-alt { text-align: center; font-size: 13px; color: var(--text-2); margin-top: 20px; }
.auth-alt-link { color: var(--accent); font-weight: 600; text-decoration: none; margin-left: 3px; }

.slide-down-enter-active, .slide-down-leave-active { transition: all .2s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.slide-down-enter-to, .slide-down-leave-from { max-height: 240px; }
</style>
