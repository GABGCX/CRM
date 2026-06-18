// server/utils/auth.ts
// Helpers de autenticacao/autorizacao para rotas de API.
// Centraliza o boilerplate repetido: pegar user, perfil, org_id e checar role.

import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import type { UserRole } from '~/types'
import { throwApiError } from './apiError'

// Garante que ha um usuario autenticado. Retorna clients + userId.
export async function requireUser(event: H3Event) {
  const supabase = await serverSupabaseClient(event)
  const admin    = serverSupabaseServiceRole(event)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throwApiError('UNAUTHENTICATED')
  return { supabase, admin, userId: user!.id }
}

// Garante usuario + carrega perfil (org_id, role).
export async function requireOrg(event: H3Event) {
  const ctx = await requireUser(event)
  const { data: profile } = await ctx.admin
    .from('profiles').select('org_id, role').eq('id', ctx.userId).single()
  const p = profile as { org_id: string; role: UserRole } | null
  if (!p) throwApiError('FORBIDDEN', 'Perfil não encontrado')
  return { ...ctx, orgId: p!.org_id, role: p!.role }
}

// Garante que o usuario tem um dos papeis exigidos.
export async function requireRole(event: H3Event, roles: UserRole[]) {
  const ctx = await requireOrg(event)
  if (!roles.includes(ctx.role)) throwApiError('FORBIDDEN', 'Sem permissão')
  return ctx
}

// Extrai IP do cliente (para rate limit / auditoria).
export function clientIp(event: H3Event): string | undefined {
  return getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    ?? getHeader(event, 'x-real-ip')
    ?? undefined
}

export type AuthContext = Awaited<ReturnType<typeof requireUser>>
export type OrgContext  = Awaited<ReturnType<typeof requireOrg>>
