// server/middleware/tenant.ts
// Roda no servidor para cada request SSR.
// Resolve o tenant e injeta nos headers de resposta
// para que as pages possam acessar via useRequestHeaders().

import { createClient } from '@supabase/supabase-js'

const cache = new Map<string, { org: any; exp: number }>()
const CACHE_TTL = 60_000

async function resolveOrg(host: string, supabase: any) {
  const hostname = host.split(':')[0]
  const appDomain = process.env.NUXT_PUBLIC_APP_DOMAIN || 'crm.io'

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const cacheHit = cache.get('__dev__')
    if (cacheHit && Date.now() < cacheHit.exp) return cacheHit.org
    const { data } = await supabase.from('organizations').select('*').limit(1).single()
    if (data) cache.set('__dev__', { org: data, exp: Date.now() + CACHE_TTL })
    return data
  }

  if (hostname.endsWith(`.${appDomain}`)) {
    const slug = hostname.replace(`.${appDomain}`, '')
    const cacheHit = cache.get(`slug:${slug}`)
    if (cacheHit && Date.now() < cacheHit.exp) return cacheHit.org
    const { data } = await supabase.from('organizations').select('*').eq('slug', slug).single()
    if (data) cache.set(`slug:${slug}`, { org: data, exp: Date.now() + CACHE_TTL })
    return data
  }

  const cacheHit = cache.get(`domain:${hostname}`)
  if (cacheHit && Date.now() < cacheHit.exp) return cacheHit.org
  const { data } = await supabase.from('organizations').select('*').eq('custom_domain', hostname).single()
  if (data) cache.set(`domain:${hostname}`, { org: data, exp: Date.now() + CACHE_TTL })
  return data
}

export default defineEventHandler(async (event) => {
  const host = getHeader(event, 'host') || ''

  // Supabase admin client para buscar org sem RLS
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const org = await resolveOrg(host, supabase)
  if (!org) return // localhost dev sem org criada ainda — não bloqueia

  // Injetar dados do tenant como headers internos
  // Acessíveis nas pages via useRequestHeaders()
  setHeader(event, 'x-tenant-id', org.id)
  setHeader(event, 'x-tenant-slug', org.slug)
  setHeader(event, 'x-tenant-name', org.name)
  setHeader(event, 'x-tenant-theme', JSON.stringify(org.theme))
  setHeader(event, 'x-tenant-settings', JSON.stringify(org.settings))
})
