-- Retiro Inteligente LATAM — Depósitos SPEI y auditoría de estados
-- Ejecutar en Supabase SQL Editor

CREATE TYPE deposit_status AS ENUM (
  'pending', 'processing', 'settled', 'investing', 'invested', 'failed'
);

CREATE TABLE IF NOT EXISTS deposits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fid           TEXT NOT NULL UNIQUE,
  user_id       TEXT NOT NULL,
  clabe         TEXT NOT NULL,
  amount_mxn    NUMERIC(18, 2) NOT NULL CHECK (amount_mxn > 0),
  status        deposit_status NOT NULL DEFAULT 'pending',
  mxnb_amount   NUMERIC(18, 6),
  tx_hash       TEXT,
  retry_count   INT NOT NULL DEFAULT 0,
  last_error    TEXT,
  webhook_event TEXT,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settled_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS deposit_state_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id  UUID NOT NULL REFERENCES deposits(id) ON DELETE CASCADE,
  fid         TEXT NOT NULL,
  from_status deposit_status,
  to_status   deposit_status NOT NULL,
  message     TEXT,
  -- JSONB de observabilidad: metadata.providerAudit contiene respuesta cruda Juno/Bitso
  -- Ej: { "providerAudit": { "provider":"juno", "operation":"getSettlementStatus",
  --       "httpStatus":200, "rawResponse":{...}, "durationMs":142 } }
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_updated_at ON deposits(updated_at);

-- Reconciliador: listByStatus(['pending','processing']) ORDER BY updated_at ASC
-- Índice parcial — solo filas activas; evita escanear settled/failed
CREATE INDEX IF NOT EXISTS idx_deposits_status_updated
  ON deposits (status, updated_at)
  WHERE status IN ('pending', 'processing');
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
CREATE INDEX IF NOT EXISTS idx_savings_plans_user_id ON savings_plans(user_id);

DROP TRIGGER IF EXISTS savings_plans_updated_at ON savings_plans;
CREATE TRIGGER savings_plans_updated_at
  BEFORE UPDATE ON savings_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE savings_plans ENABLE ROW LEVEL SECURITY;

-- Monedero agéntico CDP (export cifrado) + ledger TEE
CREATE TABLE IF NOT EXISTS agent_secrets (
  id                TEXT PRIMARY KEY,
  encrypted_export  TEXT NOT NULL,
  network_id        TEXT NOT NULL,
  wallet_address    TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_daily_spend (
  wallet_key    TEXT NOT NULL,
  spend_date    DATE NOT NULL,
  amount_mxnb   NUMERIC(18, 6) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wallet_key, spend_date)
);

CREATE INDEX IF NOT EXISTS idx_wallet_daily_spend_date ON wallet_daily_spend(spend_date);

-- Wallet usuario vinculada (retiros — Fase 2)
ALTER TABLE savings_plans
  ADD COLUMN IF NOT EXISTS linked_wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS linked_wallet_verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_deposit_state_logs_fid ON deposit_state_logs(fid);
CREATE INDEX IF NOT EXISTS idx_deposit_state_logs_metadata
  ON deposit_state_logs USING GIN (metadata);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS deposits_updated_at ON deposits;
CREATE TRIGGER deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: el backend usa service_role; habilitar según política del proyecto
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_state_logs ENABLE ROW LEVEL SECURITY;
