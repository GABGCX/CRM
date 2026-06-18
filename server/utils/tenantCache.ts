// server/utils/tenantCache.ts
// Cache singleton compartilhado entre todos os handlers do servidor.
// Garante que invalidar o cache num handler invalida para todos.
//
// Trade-off: em ambientes serverless (Vercel/Netlify) cada function invocation pode ter
// um processo separado, então este Map não é compartilhado entre instâncias paralelas.
// O impacto é apenas eficiência (mais queries ao banco no cold-start), nunca
// incorreção — a query ao Supabase é a fonte de verdade. Para compartilhamento real,
// use Vercel KV ou Upstash Redis e adapte get/set para await client.get(key).

import type { Organization } from '../../types'

const _cache = new Map<string, { org: Organization; exp: number }>()
const CACHE_TTL = 60_000

export function getCachedTenant(key: string): Organization | null {
  const hit = _cache.get(key)
  if (hit && Date.now() < hit.exp) return hit.org
  _cache.delete(key)
  return null
}

export function setCachedTenant(key: string, org: Organization): void {
  _cache.set(key, { org, exp: Date.now() + CACHE_TTL })
}

export function invalidateTenantCache(slug?: string | null, domain?: string | null): void {
  _cache.delete('__dev__')
  if (slug)   _cache.delete(`slug:${slug}`)
  if (domain) _cache.delete(`domain:${domain}`)
}

export function buildTenantKey(hostname: string, appDomain: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '__dev__'
  if (hostname.endsWith(`.${appDomain}`)) return `slug:${hostname.replace(`.${appDomain}`, '')}`
  return `domain:${hostname}`
}
