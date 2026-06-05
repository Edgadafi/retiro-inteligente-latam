# Retiro Inteligente LATAM

MVP agéntico de ahorro previsional y resiliencia financiera para trabajadores de la Gig Economy e independientes de Latinoamérica.

**Hackathon:** Ethereum México 2026 — Track AI & Agentic Finance (Bitso Business + Arbitrum)

## Stack

| Capa | Tecnología |
|------|------------|
| Pay-In | Juno API / Bitso Business (SPEI → MXNB) |
| Yield | Etherfuse Stablebonds (CETES en Arbitrum) |
| Agente | Coinbase CDP AgentKit + MCP |
| Backend | Node.js, TypeScript, Express |
| Frontend | React, Vite, Tailwind CSS |

## Inicio rápido

```bash
cp .env.example .env
# Completar credenciales CDP, Juno, Supabase y Etherfuse
# Generar clave de cifrado: openssl rand -hex 32 → WALLET_MASTER_KEY

# Supabase: ver guía completa en docs/SUPABASE_SETUP.md
# 1. Copiar credenciales → .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
# 2. Ejecutar backend/src/db/schema.sql en SQL Editor
# 3. npm run verify:supabase -w backend

npm install
npm run dev
```

## Seguridad del monedero (TEE + cifrado en disco)

- El export CDP se persiste con **AES-256-GCM** usando `WALLET_MASTER_KEY`.
- En `NODE_ENV=production` la clave maestra es **obligatoria**; en producción real usar KMS/HSM.
- Archivo wallet con permisos `0600`; nunca commitear `data/agent-wallet.json`.

## Flujo on-chain completo

```
SPEI (CLABE) → MXNB mint (Juno) → settled
       → quote CETES (Etherfuse) → investing
       → purchase/transfer (Agente CDP) → invested
```

| Modo | Cuándo | Comportamiento |
|------|--------|----------------|
| **Sandbox** | Sin CDP o `ONCHAIN_SANDBOX_MODE=true` | Simula mint + CETES con tx hashes mock |
| **Producción** | CDP + Juno + Etherfuse configurados | Transacciones reales vía agente MCP |

**Demo hackathon (sin Bitso):**
```bash
POST /api/onboarding        { "userId": "demo-gig-worker-001" }
POST /api/demo/simulate-spei { "userId": "demo-gig-worker-001", "amountMxn": 150 }
GET  /api/deposits/:fid     # trace + state_logs con providerAudit
```

**Migración on-chain:** ejecutar `backend/src/db/migrations/004_onchain_flow.sql` en Supabase.

## Resiliencia webhook SPEI

Estados en Supabase: `pending` → `processing` → `settled` | `failed`

| Mecanismo | Descripción |
|-----------|-------------|
| Idempotencia | Dedup por `fid` |
| ACK rápido | Webhook responde 200 y procesa en background |
| Backoff exponencial | Polling Juno hasta settlement (configurable) |
| Reconciler | Job cada 60s para depósitos atascados |
| Auditoría | Tabla `deposit_state_logs` con cada transición |
| Reintento manual | `POST /api/deposits/:fid/retry` |
| Observabilidad | `deposit_state_logs.metadata.providerAudit` guarda respuesta cruda Juno/Bitso |
| Jitter | Backoff `full` por defecto — evita thundering herd tras cortes SPEI |

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

## Integración MCP del Agente

El LLM interactúa con el monedero CDP **solo vía herramientas MCP** — nunca ve la seed.

### Servidor MCP (stdio) — Cursor / CLI

```bash
npm run mcp -w backend
```

Configura en Cursor copiando `mcp.json` a `.cursor/mcp.json` o agregando el servidor manualmente.

### Herramientas expuestas

| Tool | Descripción |
|------|-------------|
| `get_wallet_details` | Dirección y red del monedero TEE |
| `get_balance` | Balance MXNB |
| `transfer` | Transferencia con whitelist + límite $500/día |
| `quote_stablebond` | Cotización CETES (Etherfuse) |
| `purchase_stablebond` | Compra CETES tokenizados |
| `project_retirement_fund` | Proyección CETES vs AFORE |
| `get_savings_plan` | Plan + CLABE SPEI |
| `update_savings_plan` | Actualizar micro-ahorro |

### Chat HTTP (frontend / testing)

```bash
POST /api/agent/chat
{ "messages": [{ "role": "user", "content": "..." }], "userId": "demo-user" }
```

## Estructura

```
├── backend/
│   └── src/mcp/      # Servidor MCP + tool handlers
├── frontend/         # Dashboard, calculadora y chat del agente
├── mcp.json          # Config Cursor MCP
└── context.md        # Especificaciones de negocio e integración
```
