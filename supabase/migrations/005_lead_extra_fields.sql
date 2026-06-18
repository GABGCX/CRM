-- Campos adicionais para qualificação de ICP (Ideal Customer Profile).
-- Todos nullable para não quebrar dados existentes.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS fonte  TEXT CHECK (fonte  IN ('cold_call','linkedin','indicacao','evento','outro')),
  ADD COLUMN IF NOT EXISTS segmento TEXT,
  ADD COLUMN IF NOT EXISTS cidade   TEXT,
  ADD COLUMN IF NOT EXISTS estado   CHAR(2),
  ADD COLUMN IF NOT EXISTS porte    TEXT CHECK (porte IN ('micro','pequena','media','grande'));
