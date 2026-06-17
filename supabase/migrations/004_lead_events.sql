-- Histórico de atividades por lead.
-- Registra status changes, field updates, follow-ups e criação.

CREATE TABLE IF NOT EXISTS lead_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organizations(id),
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type          TEXT NOT NULL CHECK (type IN ('created','status_change','field_update','followup','note')),
  payload       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lead_events_lead ON lead_events(lead_id, created_at DESC);
CREATE INDEX idx_lead_events_org  ON lead_events(org_id, created_at DESC);

-- RLS: membros da org podem ler; inserção via service role
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read events"
  ON lead_events FOR SELECT
  USING (org_id = get_org_id());
