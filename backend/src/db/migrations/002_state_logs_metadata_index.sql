-- Migración incremental: índice GIN para consultas de observabilidad en metadata
CREATE INDEX IF NOT EXISTS idx_deposit_state_logs_metadata
  ON deposit_state_logs USING GIN (metadata);
