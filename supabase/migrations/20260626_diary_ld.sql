-- Ligações Discadas (LD) no registro diário.
-- Permite quantificar o funil externo (quantas ligações por dia), pedido no review.

ALTER TABLE daily_diary
  ADD COLUMN IF NOT EXISTS ld int NOT NULL DEFAULT 0;

-- Recria o resumo mensal incluindo o total de ligações.
CREATE OR REPLACE VIEW monthly_summary WITH (security_invoker = true) AS
SELECT
  org_id, user_id,
  date_trunc('month', date)::date AS month,
  SUM(ce) AS total_ce, SUM(rm) AS total_rm,
  SUM(rr) AS total_rr, SUM(fr) AS total_fr,
  SUM(ld) AS total_ld,
  COUNT(*) AS days_recorded
FROM daily_diary
GROUP BY org_id, user_id, date_trunc('month', date);
