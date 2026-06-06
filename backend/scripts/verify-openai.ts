/**
 * Verifica conectividad con OpenAI para el chat de Rito.
 * Uso: npm run verify:openai -w backend
 */
import OpenAI from "openai";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env") });

const apiKey = process.env.OPENAI_API_KEY?.trim();
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const sandbox = process.env.AGENT_CHAT_SANDBOX_MODE === "true" || process.env.AGENT_CHAT_SANDBOX_MODE === "1";

function explainOpenAIError(error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("401") || msg.includes("Incorrect API key")) {
    console.error("\n🔑 API key inválida o revocada.");
    console.error("   → Genera una nueva en https://platform.openai.com/api-keys");
    return;
  }

  if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
    console.error("\n💳 Cuota agotada o sin billing activo (error 429).");
    console.error("   La key es válida, pero la cuenta no tiene créditos.");
    console.error("\n   Pasos para resolver:");
    console.error("   1. https://platform.openai.com/settings/organization/billing");
    console.error("   2. Agrega método de pago o compra créditos prepago");
    console.error("   3. Verifica límites en https://platform.openai.com/settings/organization/limits");
    console.error("\n   Mientras tanto, el chat funciona en modo sandbox:");
    console.error("   AGENT_CHAT_SANDBOX_MODE=true  (en .env)");
    console.error("   npm run dev  →  Rito responde con reglas + tools MCP sin OpenAI");
    return;
  }

  if (msg.includes("model")) {
    console.error("\n🤖 Modelo no disponible para tu cuenta.");
    console.error(`   Prueba OPENAI_MODEL=gpt-4o-mini en .env (actual: ${model})`);
    return;
  }

  console.error(`\n   Detalle: ${msg}`);
}

async function main() {
  if (sandbox) {
    console.log("ℹ️  AGENT_CHAT_SANDBOX_MODE=true — OpenAI no es obligatorio.");
    console.log("   El chat usa Rito sandbox (reglas + MCP).");
    if (!apiKey) {
      console.log("✅ Config OK para demo sin OpenAI");
      return;
    }
    console.log("   (Verificando key de todos modos…)\n");
  }

  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY vacía en .env");
    console.error("   Opción A: https://platform.openai.com/api-keys");
    console.error("   Opción B: AGENT_CHAT_SANDBOX_MODE=true para demo sin OpenAI");
    process.exit(1);
  }

  if (!apiKey.startsWith("sk-")) {
    console.warn("⚠️  La key no empieza con sk- — revisa que copiaste bien.");
  }

  const client = new OpenAI({ apiKey });

  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 40,
      messages: [{ role: "user", content: "Responde solo: Rito online" }],
    });

    const text = res.choices[0]?.message?.content?.trim();
    console.log("✅ OpenAI conectado — cuota y billing OK");
    console.log(`   Modelo: ${model}`);
    console.log(`   Respuesta: ${text ?? "(vacía)"}`);
    console.log("\n   Puedes desactivar sandbox si lo tenías activo:");
    console.log("   AGENT_CHAT_SANDBOX_MODE=false");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isQuota = msg.includes("429") || msg.toLowerCase().includes("quota");

    if (sandbox && isQuota) {
      console.warn("⚠️  OpenAI sin cuota (429) — billing pendiente.");
      explainOpenAIError(error);
      console.log("\n✅ Demo OK: AGENT_CHAT_SANDBOX_MODE=true — el chat de Rito funciona sin OpenAI.");
      return;
    }

    console.error("❌ Error OpenAI");
    explainOpenAIError(error);
    process.exit(1);
  }
}

main();
