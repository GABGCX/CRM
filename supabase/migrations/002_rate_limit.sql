-- Rate limit persistente via tabela do Supabase.
-- Substitui o Map em memória que não funciona em multi-instância / serverless.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key          TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sem RLS: acessível apenas via service role (chave de admin)
ALTER TABLE rate_limit_buckets DISABLE ROW LEVEL SECURITY;
