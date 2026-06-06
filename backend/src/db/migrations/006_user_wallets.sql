-- Wallet del usuario vinculada para retiros (Fase 2)

ALTER TABLE savings_plans
  ADD COLUMN IF NOT EXISTS linked_wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS linked_wallet_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_savings_plans_linked_wallet
  ON savings_plans(linked_wallet_address)
  WHERE linked_wallet_address IS NOT NULL;
