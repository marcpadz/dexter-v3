import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { McpServer } from "@/lib/shared/types";

export async function createMcpClient(serverConfig: McpServer): Promise<Client> {
  const client = new Client(
    {
      name: `dexter-mcp-client-${serverConfig.id}`,
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  let transport;

  if (serverConfig.transportType === "stdio") {
    if (!serverConfig.command) {
      throw new Error(`Command is required for stdio transport (Server: ${serverConfig.name})`);
    }

    const args = serverConfig.args ? (Array.isArray(serverConfig.args) ? serverConfig.args : []) : [];

    // Parse env strings into Record<string, string> if needed, or pass as is
    let env: Record<string, string> = {};
    if (serverConfig.env && typeof serverConfig.env === 'object') {
        env = serverConfig.env as Record<string, string>;
    }

    transport = new StdioClientTransport({
      command: serverConfig.command,
      args: args,
      env: env,
    });
  } else if (serverConfig.transportType === "sse") {
    if (!serverConfig.url) {
      throw new Error(`URL is required for SSE transport (Server: ${serverConfig.name})`);
    }

    // Create SSE URL and instantiate transport
    const url = new URL(serverConfig.url);
    transport = new SSEClientTransport(url);
  } else {
    throw new Error(`Unsupported transport type: ${serverConfig.transportType}`);
  }

  await client.connect(transport);
  return client;
}
