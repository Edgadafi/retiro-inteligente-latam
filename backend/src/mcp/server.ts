import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { agentConfig } from "../config/agent.config.js";
import { registerRetiroTools } from "./register-tools.js";

/**
 * Crea una instancia del servidor MCP de Retiro Inteligente LATAM.
 * Transporte configurable: stdio (CLI/Cursor) o Streamable HTTP (API).
 */
export function createRetiroMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: agentConfig.mcp.serverName,
      version: agentConfig.version,
      title: agentConfig.name,
    },
    {
      capabilities: {
        tools: {},
        prompts: {},
        logging: {},
      },
      instructions: agentConfig.systemPrompt,
    },
  );

  registerRetiroTools(server);
  return server;
}
