-- Cadencias de prospeccao: sequencias de passos configuradas por canal e dia

CREATE TABLE IF NOT EXISTS cadences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cadence_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id   uuid NOT NULL REFERENCES cadences(id) ON DELETE CASCADE,
  step_order   integer NOT NULL,
  day_offset   integer NOT NULL CHECK (day_offset >= 0),
  channel      text NOT NULL CHECK (channel IN ('Ligacao','Email','LinkedIn','WhatsApp','Outro')),
  instruction  text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cadences_org_idx       ON cadences(org_id);
CREATE INDEX IF NOT EXISTS cadence_steps_cad_idx  ON cadence_steps(cadence_id);

-- Adiciona referencia de cadencia nos leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cadence_id uuid REFERENCES cadences(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cadence_started_at date;

-- RLS cadences
ALTER TABLE cadences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage cadences"
  ON cadences FOR ALL
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org members can manage cadence steps"
  ON cadence_steps FOR ALL
  USING (cadence_id IN (
    SELECT id FROM cadences
    WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  ))
  WITH CHECK (cadence_id IN (
    SELECT id FROM cadences
    WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));
