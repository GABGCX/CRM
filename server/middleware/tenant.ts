// server/middleware/tenant.ts
// Roda no servidor para cada request SSR.
// Usa o cache singleton compartilhado com os outros handlers.

import { createClient } from '@supabase/supabase-js'
import { getCachedTenant, setCachedTenant, buildTenantKey } from '../utils/tenantCache'

async function resolveOrg(hostname: string, supabase: any): Promise<any | null> {
  const appDomain = process.env.NUXT_PUBLIC_APP_DOMAIN || 'crm.io'
  const cacheKey = buildTenantKey(hostname, appDomain)

  const cached = getCachedTenant(cacheKey)
  if (cached) return cached

  let query: any
  if (cacheKey === '__dev__') {
    const { data } = await supabase.from('organizations').select('*').limit(1).single()
    query = data
  } else if (cacheKey.startsWith('slug:')) {
    const slug = cacheKey.replace('slug:', '')
    const { data } = await supabase.from('organizations').select('*').eq('slug', slug).single()
    query = data
  } else {
    const { data } = await supabase.from('organizations').select('*').eq('custom_domain', hostname).single()
    query = data
  }

  if (query) setCachedTenant(cacheKey, query)
  return query ?? null
}

export default defineEventHandler(async (event) => {
  const host = (getHeader(event, 'host') || '').split(':')[0]

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const org = await resolveOrg(host, supabase)
  if (!org) return

  setHeader(event, 'x-tenant-id',       org.id)
  setHeader(event, 'x-tenant-slug',     org.slug)
  setHeader(event, 'x-tenant-name',     org.name)
  setHeader(event, 'x-tenant-theme',    JSON.stringify(org.theme))
  setHeader(event, 'x-tenant-settings', JSON.stringify(org.settings))
})
