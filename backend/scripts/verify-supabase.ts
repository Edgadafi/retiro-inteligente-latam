#!/usr/bin/env tsx
/**
 * Verifica conexión a Supabase, existencia de tablas e índice del reconciliador.
 *
 * Uso:
 *   npm run verify:supabase -w backend
 */
import { getSupabase, isSupabaseConfigured } from "../src/db/supabase.client.js";

async function main() {
  if (!isSupabaseConfigured()) {
    console.error("❌ Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env");
    console.error("   Copia .env.example → .env y completa las credenciales.");
    process.exit(1);
  }

  const supabase = getSupabase();

  console.log("🔌 Probando conexión…");

  const { error: depositsError } = await supabase
    .from("deposits")
    .select("fid")
    .limit(1);

  if (depositsError) {
    console.error("❌ Tabla `deposits` no accesible:", depositsError.message);
    console.error("   → Ejecuta backend/src/db/schema.sql en Supabase SQL Editor");
    process.exit(1);
  }

  const { error: logsError } = await supabase
    .from("deposit_state_logs")
    .select("id")
    .limit(1);

  if (logsError) {
    console.error("❌ Tabla `deposit_state_logs` no accesible:", logsError.message);
    process.exit(1);
  }

  const { error: plansError } = await supabase
    .from("savings_plans")
    .select("user_id")
    .limit(1);

  if (plansError) {
    console.warn("⚠️  Tabla `savings_plans` no encontrada — ejecuta migrations/004_onchain_flow.sql");
  } else {
    console.log("✅ Tabla `savings_plans` accesible");
  }

  const { data: stuck, error: queryError } = await supabase
    .from("deposits")
    .select("fid, status, updated_at")
    .in("status", ["pending", "processing"])
    .order("updated_at", { ascending: true })
    .limit(5);

  if (queryError) {
    console.error("❌ Query del reconciliador falló:", queryError.message);
    process.exit(1);
  }

  console.log("✅ Conexión OK");
  console.log("✅ Tablas `deposits` y `deposit_state_logs` accesibles");
  console.log(`✅ Query reconciliador OK (${stuck?.length ?? 0} depósito(s) activo(s))`);
  console.log("");
  console.log("📋 Verifica el índice parcial en Supabase SQL Editor:");
  console.log(`
EXPLAIN ANALYZE
SELECT * FROM deposits
WHERE status IN ('pending', 'processing')
ORDER BY updated_at ASC;
`);
  console.log("   Esperado: Index Scan using idx_deposits_status_updated");
}

main().catch((err) => {
  console.error("❌ Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
