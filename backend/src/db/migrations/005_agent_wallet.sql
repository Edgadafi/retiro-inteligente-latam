-- Monedero agéntico CDP (export cifrado) + ledger TEE diario

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
