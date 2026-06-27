-- Campos personalizados por organizacao.
-- Definicoes ficam em custom_field_defs; os valores por lead em leads.custom_fields (jsonb).

CREATE TABLE IF NOT EXISTS custom_field_defs (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key        text NOT NULL,
  label      text NOT NULL,
  field_type text NOT NULL DEFAULT 'text'
    CHECK (field_type IN ('text','number','date','select')),
  options    jsonb,            -- lista de opcoes (para field_type = 'select')
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

CREATE INDEX IF NOT EXISTS idx_cfd_org ON custom_field_defs(org_id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

-- RLS por organizacao (mesmo padrao das demais tabelas).
ALTER TABLE custom_field_defs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cfd: select" ON custom_field_defs FOR SELECT USING (org_id = public.get_org_id());
CREATE POLICY "cfd: insert" ON custom_field_defs FOR INSERT WITH CHECK (org_id = public.get_org_id());
CREATE POLICY "cfd: update" ON custom_field_defs FOR UPDATE USING (org_id = public.get_org_id());
CREATE POLICY "cfd: delete" ON custom_field_defs FOR DELETE USING (org_id = public.get_org_id());
