import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditParams {
  org_id:        string
  user_id:       string | null
  action:        string
  resource_type?: string
  resource_id?:  string
  payload?:      Record<string, unknown>
  ip?:           string
}

export async function logAudit(admin: SupabaseClient, params: AuditParams): Promise<void> {
  await admin.from('audit_log').insert({
    org_id:        params.org_id,
    user_id:       params.user_id ?? null,
    action:        params.action,
    resource_type: params.resource_type ?? null,
    resource_id:   params.resource_id ?? null,
    payload:       params.payload ?? null,
    ip:            params.ip ?? null,
  })
  // Fire-and-forget — failures must not block the primary operation
}
