#!/usr/bin/env node
/**
 * Entry point MCP stdio — para Cursor, CDP Agentic Wallet CLI u otros clientes MCP.
 *
 * Uso:
 *   npm run mcp -w backend
 *   npx tsx backend/src/mcp/stdio.ts
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRetiroMcpServer } from "./server.js";

async function main() {
  const server = createRetiroMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("[MCP] Error fatal:", error);
  process.exit(1);
});
