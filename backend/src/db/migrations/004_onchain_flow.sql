-- Fase on-chain: estados de inversión CETES + planes de ahorro persistentes

ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'investing';
ALTER TYPE deposit_status ADD VALUE IF NOT EXISTS 'invested';

CREATE TABLE IF NOT EXISTS savings_plans (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL UNIQUE,
  clabe                 TEXT NOT NULL UNIQUE,
  wallet_address        TEXT,
  contribution_amount   NUMERIC(18, 2) NOT NULL DEFAULT 50,
  contribution_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (contribution_frequency IN ('daily', 'weekly')),
  target_years          INT NOT NULL DEFAULT 20,
  auto_invest_cetes     BOOLEAN NOT NULL DEFAULT true,
  metadata              JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_plans_clabe ON savings_plans(clabe);

DROP TRIGGER IF EXISTS savings_plans_updated_at ON savings_plans;
CREATE TRIGGER savings_plans_updated_at
  BEFORE UPDATE ON savings_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;
