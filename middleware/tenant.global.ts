// middleware/tenant.global.ts
// Middleware global do Nuxt — roda em cada navegação.
// Resolve o tenant, injeta no useState e protege rotas por role.

import { resolveTenant } from '~/composables/useTenant'
import type { TenantContext } from '~/types'

// Rotas restritas: apenas os roles listados têm acesso
const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/configuracoes': ['owner', 'admin'],
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const supabase    = useSupabaseClient()
  const user        = useSupabaseUser()
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

  // ── Proteção de rotas por role (fix #11) ────────────────────────────────
  const requiredRoles = ROLE_ROUTES[to.path]
  if (requiredRoles && user.value) {
    // Busca role do JWT (injetado pelo custom_access_token_hook)
    const session = await supabase.auth.getSession()
    const orgRole = (session.data.session?.access_token
      ? JSON.parse(atob(session.data.session.access_token.split('.')[1]))?.org_role
      : null) as string | null

    if (!orgRole || !requiredRoles.includes(orgRole)) {
      return navigateTo('/dashboard')
    }
  }
})
