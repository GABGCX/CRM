// middleware/tenant.global.ts
// Middleware global do Nuxt — roda em cada navegação.
// O @nuxtjs/supabase já cuida do redirect para /login.
// Aqui só resolvemos o tenant e injetamos no useState.

import { resolveTenant } from '~/composables/useTenant'
import type { TenantContext } from '~/types'

export default defineNuxtRouteMiddleware(async (to) => {
  // Não rodar no servidor durante generate estático
  if (import.meta.server) return

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const tenantState = useState<TenantContext | null>('tenant', () => null)

  // Resolver tenant a partir do host atual
  const host = window.location.host
  if (!tenantState.value) {
    const tenant = await resolveTenant(host, supabase)
    tenantState.value = tenant
  }

  // Usuário autenticado tentando acessar /login ou /register → dashboard
  if (user.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard')
  }
})
