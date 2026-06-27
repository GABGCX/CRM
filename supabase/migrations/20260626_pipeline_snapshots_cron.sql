-- OPCIONAL: agenda o snapshot diario do pipeline via pg_cron (Supabase).
-- Aplique DEPOIS de 20260626_pipeline_snapshots.sql.
-- Se a sua instancia nao permitir pg_cron, ignore este arquivo: o grafico ainda
-- funciona com o snapshot-seed do dia, so nao acumula historico automaticamente.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'pipeline-snapshot-daily',
  '0 6 * * *',
  $$
    INSERT INTO pipeline_snapshots (org_id, snap_date, resultado, count, total_value)
    SELECT org_id, current_date, resultado, count(*), coalesce(sum(valor_estimado), 0)
    FROM leads
    WHERE resultado NOT IN ('Fechado', 'Recusado', 'Sem interesse')
    GROUP BY org_id, resultado
    ON CONFLICT (org_id, snap_date, resultado)
    DO UPDATE SET count = excluded.count, total_value = excluded.total_value;
  $$
);
