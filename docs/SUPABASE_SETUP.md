# Configuración Supabase — Retiro Inteligente LATAM

## 1. Crear proyecto

1. Entra a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → nombre ej. `retiro-inteligente-latam`
3. Elige región cercana (ej. `South America` o `US East`)
4. Guarda la **database password** (solo para conexión directa Postgres; el backend usa la API REST)

## 2. Obtener credenciales para `.env`

En el dashboard: **Project Settings → API**

| Variable | Dónde copiarla |
|----------|----------------|
| `SUPABASE_URL` | **Project URL** — `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (secret) — ⚠️ solo backend, nunca en frontend |

## 3. Configurar `.env`

En la raíz del monorepo:

```bash
cp .env.example .env
```

Edita `.env`:

```env
SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Seguridad:** `service_role` omite RLS. Úsala solo en el servidor Node.js. No la expongas en Vite/React ni la subas a git (`.env` ya está en `.gitignore`).

## 4. Crear tablas e índices

**SQL Editor → New query** → pega y ejecuta:

```
backend/src/db/schema.sql
```

Si ya habías creado tablas antes, ejecuta solo las migraciones pendientes en `backend/src/db/migrations/`.

## 5. Verificar desde terminal

```bash
npm run verify:supabase -w backend
```

Salida esperada:

```
✅ Conexión OK
✅ Tablas `deposits` y `deposit_state_logs` accesibles
✅ Query reconciliador OK (0 depósito(s) activo(s))
```

## 6. Verificar índice parcial (SQL Editor)

```sql
EXPLAIN ANALYZE
SELECT * FROM deposits
WHERE status IN ('pending', 'processing')
ORDER BY updated_at ASC;
```

Busca en el plan:

```
Index Scan using idx_deposits_status_updated on deposits
```

Si aparece `Seq Scan` y tienes pocos registros, puede ser normal; con miles de filas `settled` el índice parcial marcará diferencia.

## 7. Probar el backend

```bash
npm run dev
```

El reconciliador arranca automáticamente (`SETTLEMENT_RECONCILE_INTERVAL_MS`, default 60s).

Health check: `GET http://localhost:3001/api/health`

## Troubleshooting

| Error | Solución |
|-------|----------|
| `Invalid API key` | Revisa que copiaste **service_role**, no `anon` |
| `relation "deposits" does not exist` | Ejecuta `schema.sql` |
| Backend usa memoria en dev | Faltan `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY` |
| `Supabase es obligatorio en producción` | Configura ambas variables con `NODE_ENV=production` |
