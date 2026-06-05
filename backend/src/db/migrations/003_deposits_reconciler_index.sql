-- Índice parcial para el job reconciliador (pending/processing + updated_at)
CREATE INDEX IF NOT EXISTS idx_deposits_status_updated
  ON deposits (status, updated_at)
  WHERE status IN ('pending', 'processing');
