// composables/useTenant.ts
// Composable que resolve o tenant atual a partir do host.
// Usado tanto no middleware (server) quanto nos componentes (client).

import type { Organization, TenantContext } from '~/types'

// Cache simples em memória — TTL 60s
const cache = new Map<string, { org: Organization; exp: number }>()
const CACHE_TTL = 60_000

export async function resolveTenant(
  host: string,
  supabase: ReturnType<typeof useSupabaseClient>
): Promise<TenantContext | null> {
  const hostname = host.split(':')[0]
  const config = useRuntimeConfig()
  const appDomain = config.public.appDomain

  // ── Dev local ─────────────────────────────────────────────
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const cached = cache.get('__dev__')
    if (cached && Date.now() < cached.exp) return { org: cached.org, subdomain: cached.org.slug }

    const { data } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)
      .single()

    if (!data) return null
    cache.set('__dev__', { org: data as Organization, exp: Date.now() + CACHE_TTL })
    return { org: data as Organization, subdomain: data.slug }
  }

  // ── Subdomínio: slug.crm.io ───────────────────────────────
  if (hostname.endsWith(`.${appDomain}`)) {
    const subdomain = hostname.replace(`.${appDomain}`, '')
    if (['www','app','api','admin','mail'].includes(subdomain)) return null

    const cacheKey = `slug:${subdomain}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() < cached.exp) return { org: cached.org, subdomain }

    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', subdomain)
      .single()

    if (!data) return null
    cache.set(cacheKey, { org: data as Organization, exp: Date.now() + CACHE_TTL })
    return { org: data as Organization, subdomain }
  }

  // ── Custom domain ─────────────────────────────────────────
  const cacheKey = `domain:${hostname}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() < cached.exp) return { org: cached.org, subdomain: cached.org.slug }

  const { data } = await supabase
    .from('organizations')
    .select('*')
    .eq('custom_domain', hostname)
    .single()

  if (!data) return null
  cache.set(cacheKey, { org: data as Organization, exp: Date.now() + CACHE_TTL })
  return { org: data as Organization, subdomain: data.slug }
}

export function invalidateTenantCache(key: string) {
  cache.delete(`slug:${key}`)
  cache.delete(`domain:${key}`)
}
