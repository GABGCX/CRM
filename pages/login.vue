<template>
  <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="width:100%;max-width:380px">

      <!-- Brand -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#193497;border-radius:12px;margin-bottom:16px;box-shadow:0 4px 14px rgba(25,52,151,.18)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 style="font-size:23px;font-weight:600;color:var(--text-1);letter-spacing:-.03em;margin:0 0 7px">Entrar no Prospecta</h1>
        <p style="font-size:14px;color:var(--text-2);margin:0">Bem-vindo de volta. Acesse sua conta.</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:16px">

        <div v-if="error"
          style="background:var(--bad-bg);border:1px solid var(--bad-bd);color:#dc2626;font-size:13px;border-radius:8px;padding:10px 14px">
          {{ error }}
        </div>

        <div class="form-field">
          <label class="input-label">E-mail</label>
          <input v-model="email" type="email" autocomplete="email" required placeholder="voce@empresa.com" />
        </div>

        <div class="form-field">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <label class="input-label">Senha</label>
            <button type="button"
              style="background:none;border:none;font-size:12px;color:#193497;cursor:pointer;padding:0;font-family:inherit;font-weight:500"
              @click="forgotOpen = !forgotOpen">
              Esqueci minha senha
            </button>
          </div>
          <div style="position:relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
              :required="!forgotOpen" placeholder="••••••••" style="padding-right:40px;width:100%;box-sizing:border-box" />
            <button type="button" @click="showPassword = !showPassword"
              style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-3);padding:0;display:flex;align-items:center">
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

        <!-- Forgot password inline -->
        <Transition name="slide-down">
          <div v-if="forgotOpen"
            style="background:var(--accent-soft);border:1px solid var(--accent-bd);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px">
            <div style="font-size:13px;color:#0f2480;font-weight:600">Recuperar senha</div>
            <div v-if="forgotSuccess" style="font-size:13px;color:#16a34a">
              Verifique seu e-mail para redefinir a senha.
            </div>
            <template v-else>
              <input v-model="forgotEmail" type="email" placeholder="seu@email.com"
                @keydown.enter.prevent="handleForgot" />
              <div v-if="forgotError" style="font-size:12px;color:#dc2626">{{ forgotError }}</div>
              <button type="button" class="btn btn-primary" style="justify-content:center"
                :disabled="forgotLoading" @click="handleForgot">
                {{ forgotLoading ? 'Enviando...' : 'Enviar link de recuperação' }}
              </button>
            </template>
          </div>
        </Transition>

        <button type="submit" :disabled="loading || forgotOpen" class="btn btn-primary"
          style="justify-content:center;width:100%;padding:10px 14px;font-size:14px">
          <span v-if="loading" style="display:flex;align-items:center;gap:8px">
            <span style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .6s linear infinite" />
            Entrando...
          </span>
          <span v-else>Entrar</span>
        </button>
      </form>

      <p style="text-align:center;font-size:13px;color:var(--text-2);margin-top:20px">
        Não tem conta?
        <NuxtLink to="/register" style="color:#193497;font-weight:500;text-decoration:none;margin-left:3px">
          Criar organização
        </NuxtLink>
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
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 220px;
}
</style>
