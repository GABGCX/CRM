<template>
  <div style="min-height:100vh;background:var(--bg-subtle);display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="width:100%;max-width:420px">

      <!-- Brand -->
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#0f62fe;border-radius:12px;margin-bottom:16px;box-shadow:0 4px 14px rgba(15,98,254,.18)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="white"/>
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 style="font-size:23px;font-weight:600;color:var(--text-1);letter-spacing:-.03em;margin:0 0 7px">Criar conta no Prospecta</h1>
        <p style="font-size:14px;color:var(--text-2);margin:0">Configure sua prospecção em minutos</p>
      </div>

      <form @submit.prevent="handleRegister"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:14px">

        <div v-if="error"
          style="background:var(--bad-bg);border:1px solid var(--bad-bd);color:#dc2626;font-size:13px;border-radius:8px;padding:10px 14px">
          {{ error }}
        </div>

        <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em">Sua conta</div>

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
        <div style="font-size:12px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em">Sua organização</div>

        <div class="form-field">
          <label class="input-label">Nome da empresa</label>
          <input v-model="form.orgName" type="text" required placeholder="Agência XYZ" @input="generateSlug" />
        </div>

        <div class="form-field">
          <label class="input-label">
            Subdomínio
            <span style="font-size:11px;color:var(--text-3);font-weight:400;margin-left:4px">(seu endereço único)</span>
          </label>
          <div style="display:flex">
            <input
              v-model="form.slug"
              type="text" required
              placeholder="agência-xyz"
              style="border-radius:8px 0 0 8px;border-right:none"
              @input="form.slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
            <span
              style="display:flex;align-items:center;padding:0 12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:0 8px 8px 0;font-size:13px;color:var(--text-2);white-space:nowrap;height:auto">
              .{{ appDomain }}
            </span>
          </div>
          <p v-if="form.slug" style="font-size:12px;color:#0f62fe;margin:4px 0 0;font-weight:500">
            Acesso em: <strong>{{ form.slug }}.{{ appDomain }}</strong>
          </p>
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary"
          style="justify-content:center;width:100%;padding:10px 14px;font-size:14px;margin-top:4px">
          <span v-if="loading" style="display:flex;align-items:center;gap:8px">
            <span style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin .6s linear infinite" />
            Criando organização...
          </span>
          <span v-else>Criar e entrar</span>
        </button>
      </form>

      <p style="text-align:center;font-size:13px;color:var(--text-2);margin-top:20px">
        Já tem conta?
        <NuxtLink to="/login" style="color:#0f62fe;font-weight:500;text-decoration:none;margin-left:3px">Entrar</NuxtLink>
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
</style>
