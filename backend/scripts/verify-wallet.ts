/**
 * Verifica monedero agéntico CDP + persistencia + sandbox.
 * Uso: npm run verify:wallet -w backend
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

async function main(): Promise<void> {
  const { getIntegrationStatus } = await import("../src/config/env.js");
  const { resolveAgentWalletAddress } = await import("../src/services/wallet.service.js");
  const { useSupabaseWalletPersistence } = await import("../src/lib/wallet-persistence.js");

  const status = getIntegrationStatus();
  const sandbox = status.onchainSandbox;

  console.log("🔍 Verificación wallet — Retiro Inteligente LATAM\n");
  console.log(`   cdpAgent:        ${status.cdpAgent}`);
  console.log(`   onchainSandbox:  ${status.onchainSandbox}`);
  console.log(`   supabase:        ${status.supabase}`);
  console.log(`   persistencia:    ${useSupabaseWalletPersistence() ? "Supabase (Vercel)" : "filesystem (dev)"}`);
  console.log(`   WALLET_MASTER_KEY: ${process.env.WALLET_MASTER_KEY ? "presente" : "ausente"}`);

  if (sandbox) {
    console.log("\nℹ️  ONCHAIN_SANDBOX_MODE — resolviendo dirección demo…");
    const wallet = await resolveAgentWalletAddress();
    console.log(`✅ Sandbox OK — address: ${wallet.address}`);
    console.log(`   network: ${wallet.networkId} · mode: ${wallet.mode}`);
    return;
  }

  if (!status.cdpAgent) {
    console.error("\n❌ CDP no configurado. Define CDP_API_KEY_NAME y CDP_API_KEY_PRIVATE_KEY.");
    console.error("   O activa ONCHAIN_SANDBOX_MODE=true para demo sin CDP.");
    process.exit(1);
  }

  if (!process.env.WALLET_MASTER_KEY && process.env.NODE_ENV === "production") {
    console.error("\n❌ WALLET_MASTER_KEY obligatoria en producción.");
    console.error("   Generar: openssl rand -hex 32");
    process.exit(1);
  }

  try {
    const { initializeAgentWallet } = await import("../src/agent.js");
    const result = await initializeAgentWallet();
    console.log("\n✅ CDP AgentKit inicializado");
    console.log(`   address: ${result.walletAddress ?? "(no resuelta)"}`);
    console.log(`   network: ${result.networkId}`);

    const again = await initializeAgentWallet();
    if (again.walletAddress !== result.walletAddress) {
      console.warn("⚠️  Dirección cambió entre inits — revisa persistencia.");
    } else {
      console.log("✅ Persistencia estable (misma dirección en segundo init)");
    }
  } catch (error) {
    console.error("\n❌ Error CDP:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
