<template>
  <div class="min-h-screen bg-surface-0 flex items-center justify-center p-4">
    <div class="w-full max-w-md">

      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-12 h-12 brand-bg rounded-xl mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold text-ink tracking-tight">Criar sua organização</h1>
        <p class="text-sm text-ink-subtle mt-1">Configure seu CRM em menos de 2 minutos</p>
      </div>

      <form @submit.prevent="handleRegister" class="card flex flex-col gap-4">
        <div v-if="error" class="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 animate-fade-in">
          {{ error }}
        </div>

        <p class="card-title mb-0">Sua conta</p>

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

        <div class="divider mb-0" />
        <p class="card-title mb-0">Sua organização</p>

        <div class="form-field">
          <label class="input-label">Nome da empresa</label>
          <input v-model="form.orgName" type="text" required placeholder="Agência XYZ" @input="generateSlug" />
        </div>

        <div class="form-field">
          <label class="input-label">
            Subdomínio
            <span class="text-ink-ghost ml-1 font-normal text-xs">(seu endereço único)</span>
          </label>
          <div class="flex">
            <input
              v-model="form.slug"
              type="text" required
              placeholder="agencia-xyz"
              class="rounded-r-none border-r-0"
              style="border-radius:.5rem 0 0 .5rem"
              @input="form.slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
            <span
              class="flex items-center px-3 bg-surface-3 border border-[#334155] text-ink-subtle text-sm whitespace-nowrap"
              style="border-radius:0 .5rem .5rem 0; height:38px"
            >
              .{{ appDomain }}
            </span>
          </div>
          <p v-if="form.slug" class="text-xs brand-text mt-1">
            ✓ Acesso em: <strong>{{ form.slug }}.{{ appDomain }}</strong>
          </p>
        </div>

        <button type="submit" :disabled="loading" class="btn-primary w-full justify-center mt-1 disabled:opacity-60">
          <span v-if="loading" class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Criando organização...
          </span>
          <span v-else>Criar e entrar</span>
        </button>
      </form>

      <p class="text-center text-sm text-ink-subtle mt-6">
        Já tem conta?
        <NuxtLink to="/login" class="brand-text hover:brightness-125 transition-all ml-1">Entrar</NuxtLink>
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
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
    // Login automático
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
