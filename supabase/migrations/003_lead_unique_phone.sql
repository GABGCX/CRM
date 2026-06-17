-- Impede leads duplicados com o mesmo telefone na mesma organização.
-- Constraint parcial: apenas quando telefone não é NULL.

CREATE UNIQUE INDEX IF NOT EXISTS leads_org_phone_unique
  ON leads (org_id, telefone)
  WHERE telefone IS NOT NULL AND telefone <> '';
