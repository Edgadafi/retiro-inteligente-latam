#!/usr/bin/env tsx
/**
 * Aplica schema.sql vía conexión Postgres directa.
 * Requiere SUPABASE_DB_PASSWORD en .env (contraseña de Database Settings).
 *
 * Uso: npm run db:apply-schema -w backend
 */
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "dotenv";

dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../.env") });

const url = process.env.SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url || !dbPassword) {
  console.error("❌ Requiere SUPABASE_URL y SUPABASE_DB_PASSWORD en .env");
  console.error("   DB password: Dashboard → Settings → Database");
  process.exit(1);
}

const projectRef = url.replace("https://", "").replace(".supabase.co", "");
const schemaPath = path.resolve(__dirname, "../src/db/schema.sql");
const sql = fs.readFileSync(schemaPath, "utf8");

const connectionCandidates = [
  `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
];

async function main() {
  let lastError: Error | undefined;

  for (const connectionString of connectionCandidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      console.log("🔌 Conectado a Postgres…");
      await client.query(sql);
      console.log("✅ schema.sql aplicado correctamente");
      await client.end();
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await client.end().catch(() => undefined);
      console.warn(`⚠️  Intento fallido: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error("No se pudo conectar a Postgres");
}

main().catch((err) => {
  console.error("❌ Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
