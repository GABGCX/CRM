-- A CHECK de lead_events.type nao incluia 'activity', que foi adicionado depois
-- no endpoint POST /api/leads/:id/events (registro manual de atividade).
-- Sem isto o INSERT viola a constraint e falha em silencio (insertLeadEvent
-- engole o erro), entao a atividade nunca aparece na timeline.

ALTER TABLE lead_events DROP CONSTRAINT IF EXISTS lead_events_type_check;
ALTER TABLE lead_events ADD CONSTRAINT lead_events_type_check
  CHECK (type IN ('created','status_change','field_update','followup','note','activity'));
