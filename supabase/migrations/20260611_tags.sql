-- Etiquetas (tags) de leads
-- Tags reutilizaveis por organizacao + atribuicao via array de ids no lead.

CREATE TABLE IF NOT EXISTS tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text NOT NULL DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON tags
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Atribuicao de tags no lead (array de ids)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tag_ids uuid[] NOT NULL DEFAULT '{}';
