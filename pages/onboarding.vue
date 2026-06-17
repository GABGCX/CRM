<template>
  <div class="min-h-screen bg-surface-0 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">

      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 brand-bg rounded-xl mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-ink tracking-tight">Bem-vindo ao Prospecta!</h1>
        <p class="text-sm text-ink-subtle mt-1">Complete seu perfil para começar a prospectar</p>
      </div>

      <form @submit.prevent="handleSubmit" class="card flex flex-col gap-4">
        <div v-if="error" class="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {{ error }}
        </div>

        <div class="form-field">
          <label class="input-label">Seu nome completo <span class="text-red-400">*</span></label>
          <input
            v-model="name"
            type="text"
            autocomplete="name"
            required
            placeholder="João Silva"
            autofocus
          />
        </div>

        <div class="form-field">
          <label class="input-label">URL da foto de perfil <span class="text-ink-subtle text-xs">(opcional)</span></label>
          <input
            v-model="avatarUrl"
            type="url"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !name.trim()"
          class="btn-primary w-full justify-center mt-1 disabled:opacity-60"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Salvando...
          </span>
          <span v-else>Entrar no Prospecta</span>
        </button>
      </form>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const name = ref('')
const avatarUrl = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Se não há sessão, redirecionar para login
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) navigateTo('/login')
})

async function handleSubmit() {
  if (!name.value.trim()) return
  loading.value = true
  error.value = null

  try {
    const { error: err } = await useFetch('/api/auth/complete-profile', {
      method: 'PATCH',
      body: {
        name: name.value.trim(),
        avatar_url: avatarUrl.value.trim() || null,
      },
    })

    if (err.value) {
      error.value = err.value.data?.message ?? 'Erro ao salvar perfil.'
      return
    }

    await navigateTo('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>
