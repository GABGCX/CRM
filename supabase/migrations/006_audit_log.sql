CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT        NOT NULL,
  resource_type TEXT,
  resource_id   TEXT,
  payload       JSONB,
  ip            TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_org
  ON audit_log (org_id, created_at DESC);

-- Only org members can read their own audit log; inserts go through service role
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_read_own_org" ON audit_log
  FOR SELECT USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );
