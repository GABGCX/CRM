// middleware/tenant.global.ts
// Middleware global do Nuxt — roda em cada navegação.
// Resolve o tenant, injeta no useState e protege rotas por role.

import { resolveTenant } from '~/composables/useTenant'
import type { TenantContext } from '~/types'

const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/configuracoes': ['owner', 'admin'],
  '/dashboard/gestao':        ['owner', 'admin'],
}

// Rotas que não devem disparar redirect de onboarding
const PUBLIC_ROUTES = ['/login', '/register', '/confirm', '/onboarding']

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const supabase    = useSupabaseClient()
  const user        = useSupabaseUser()
  const tenantState = useState<TenantContext | null>('tenant', () => null)

  const host = window.location.host
  if (!tenantState.value) {
    const tenant = await resolveTenant(host, supabase)
    tenantState.value = tenant
  }

  // Usuário autenticado tentando acessar /login ou /register → dashboard
  if (user.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard')
  }

  // Usuário autenticado sem nome (pós-convite) → onboarding
  if (user.value && !PUBLIC_ROUTES.includes(to.path)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.value.id)
      .single()

    if (profile && (profile as { name: string | null }).name === null) {
      return navigateTo('/onboarding')
    }
  }

  // ── Proteção de rotas por role (match exato ou por prefixo) ───────────────
  const matchKey = Object.keys(ROLE_ROUTES).find(k => to.path === k || to.path.startsWith(k + '/'))
  const requiredRoles = matchKey ? ROLE_ROUTES[matchKey] : null
  if (requiredRoles && user.value) {
    const session = await supabase.auth.getSession()
    const orgRole = (session.data.session?.access_token
      ? JSON.parse(atob(session.data.session.access_token.split('.')[1]))?.org_role
      : null) as string | null

    if (!orgRole || !requiredRoles.includes(orgRole)) {
      return navigateTo('/dashboard')
    }
  }
})
