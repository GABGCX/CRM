// server/utils/leadEvents.ts
// Utilitário para inserir eventos no histórico de atividades do lead.
// Usa service role para bypass de RLS — apenas chamado internamente.

import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

type EventType = 'created' | 'status_change' | 'field_update' | 'followup' | 'note'

export async function insertLeadEvent(
  event: H3Event,
  params: {
    lead_id: string
    org_id: string
    user_id: string | null
    type: EventType
    payload?: Record<string, unknown>
  }
) {
  const admin = serverSupabaseServiceRole(event)
  await admin.from('lead_events').insert({
    lead_id:    params.lead_id,
    org_id:     params.org_id,
    user_id:    params.user_id,
    type:       params.type,
    payload:    params.payload ?? null,
    created_at: new Date().toISOString(),
  })
  // Falhas no log de eventos não bloqueiam a operação principal
}
