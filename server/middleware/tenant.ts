// server/middleware/tenant.ts
// Roda no servidor para cada request SSR.
// Usa o cache singleton compartilhado com os outros handlers.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database'
import type { Organization } from '../../types'
import { getCachedTenant, setCachedTenant, buildTenantKey } from '../utils/tenantCache'

async function resolveOrg(hostname: string, supabase: SupabaseClient<Database>): Promise<Organization | null> {
  const appDomain = process.env.NUXT_PUBLIC_APP_DOMAIN || 'crm.io'
  const cacheKey = buildTenantKey(hostname, appDomain)

  const cached = getCachedTenant(cacheKey)
  if (cached) return cached

  const base = supabase.from('organizations').select('*')
  const { data } =
    cacheKey === '__dev__'        ? await base.limit(1).single()
    : cacheKey.startsWith('slug:') ? await base.eq('slug', cacheKey.replace('slug:', '')).single()
    :                                await base.eq('custom_domain', hostname).single()

  const org = data ? (data as unknown as Organization) : null
  if (org) setCachedTenant(cacheKey, org)
  return org
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
