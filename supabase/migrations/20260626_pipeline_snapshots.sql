-- Snapshot diario do estado do pipeline, para o grafico "pipeline ao longo do tempo".
-- A tabela e segura de aplicar; o agendamento diario fica no arquivo _cron (opcional).

CREATE TABLE IF NOT EXISTS pipeline_snapshots (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snap_date   date NOT NULL,
  resultado   text NOT NULL,
  count       int  NOT NULL DEFAULT 0,
  total_value numeric NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, snap_date, resultado)
);

CREATE INDEX IF NOT EXISTS idx_pipesnap_org_date ON pipeline_snapshots(org_id, snap_date);

ALTER TABLE pipeline_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pipesnap: select" ON pipeline_snapshots FOR SELECT USING (org_id = public.get_org_id());

-- Captura o snapshot de HOJE imediatamente (seed), pra o grafico nao comecar vazio.
INSERT INTO pipeline_snapshots (org_id, snap_date, resultado, count, total_value)
SELECT org_id, current_date, resultado, count(*), coalesce(sum(valor_estimado), 0)
FROM leads
WHERE resultado NOT IN ('Fechado', 'Recusado', 'Sem interesse')
GROUP BY org_id, resultado
ON CONFLICT (org_id, snap_date, resultado)
DO UPDATE SET count = excluded.count, total_value = excluded.total_value;
