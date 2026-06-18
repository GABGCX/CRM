-- Metas individuais por BDR (gestao)
-- Quando ausente, o painel usa a meta da organizacao como fallback.

CREATE TABLE IF NOT EXISTS bdr_goals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meta_mensal  numeric(12,2) NOT NULL DEFAULT 0,
  ticket_medio numeric(12,2) NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

ALTER TABLE bdr_goals ENABLE ROW LEVEL SECURITY;

-- Owner/admin gerenciam; cada um enxerga as metas da sua org
CREATE POLICY "tenant_isolation" ON bdr_goals
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
