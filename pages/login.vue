<template>
  <div class="min-h-screen bg-surface-0 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <!-- Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 brand-bg rounded-xl mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-ink tracking-tight">Entrar no CRM</h1>
        <p class="text-sm text-ink-subtle mt-1">Acesse sua conta para continuar</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="card flex flex-col gap-4">
        <div v-if="error" class="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 animate-fade-in">
          {{ error }}
        </div>

        <div class="form-field">
          <label class="input-label">E-mail</label>
          <input v-model="email" type="email" autocomplete="email" required placeholder="voce@empresa.com" />
        </div>

        <div class="form-field">
          <label class="input-label">Senha</label>
          <input v-model="password" type="password" autocomplete="current-password" required placeholder="••••••••" />
        </div>

        <button type="submit" :disabled="loading" class="btn-primary w-full justify-center mt-1 disabled:opacity-60">
          <span v-if="loading" class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Entrando...
          </span>
          <span v-else>Entrar</span>
        </button>
      </form>

      <p class="text-center text-sm text-ink-subtle mt-6">
        Não tem conta?
        <NuxtLink to="/register" class="brand-text hover:brightness-125 transition-all ml-1">
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
