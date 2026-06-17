-- Notas de coaching / 1-on-1 por BDR (gestao)

CREATE TABLE IF NOT EXISTS management_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bdr_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_management_notes_bdr ON management_notes(org_id, bdr_id, created_at DESC);

ALTER TABLE management_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON management_notes
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
