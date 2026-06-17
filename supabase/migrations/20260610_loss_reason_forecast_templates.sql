-- Feature: motivo de perda, valor estimado, templates de mensagem

ALTER TABLE leads ADD COLUMN IF NOT EXISTS motivo_perda text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS valor_estimado numeric(12,2);

CREATE TABLE IF NOT EXISTS message_templates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  channel    text NOT NULL DEFAULT 'WhatsApp',
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON message_templates
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
