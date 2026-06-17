-- Notas por lead: historico de anotacoes do vendedor com timestamp e autor

CREATE TABLE IF NOT EXISTS lead_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content    text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_notes_lead_id_idx ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS lead_notes_org_id_idx  ON lead_notes(org_id);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Membros da org podem ler notas dos seus leads
CREATE POLICY "org members can read lead notes"
  ON lead_notes FOR SELECT
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

-- Qualquer membro pode inserir nota em lead da org
CREATE POLICY "org members can insert lead notes"
  ON lead_notes FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- Autor pode deletar propria nota; owner/admin pode deletar qualquer nota da org
CREATE POLICY "author or admin can delete lead notes"
  ON lead_notes FOR DELETE
  USING (
    user_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'admin')
  );
