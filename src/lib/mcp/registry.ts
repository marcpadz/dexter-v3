import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { createMcpClient } from "./client";
import { McpServer } from "@/lib/shared/types";

class McpRegistry {
  // Map of userId -> Map of serverId -> Client
  private connections: Map<string, Map<string, Client>> = new Map();

  async connect(userId: string, serverConfig: McpServer): Promise<Client> {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Map());
    }

    const userConnections = this.connections.get(userId)!;

    // Disconnect existing if any
    if (userConnections.has(serverConfig.id)) {
      await this.disconnect(userId, serverConfig.id);
    }

    try {
      const client = await createMcpClient(serverConfig);
      userConnections.set(serverConfig.id, client);
      return client;
    } catch (error) {
      console.error(`Failed to connect to MCP server ${serverConfig.name}:`, error);
      throw error;
    }
  }

  async disconnect(userId: string, serverId: string): Promise<void> {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const client = userConnections.get(serverId);
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error(`Error closing MCP client ${serverId}:`, error);
      }
      userConnections.delete(serverId);
    }
  }

  async discoverTools(userId: string, serverId: string) {
    const client = this.getClient(userId, serverId);
    if (!client) {
      throw new Error(`Client not connected for server ${serverId}`);
    }

    return await client.listTools();
  }

  async executeTool(userId: string, serverId: string, toolName: string, args: any) {
    const client = this.getClient(userId, serverId);
    if (!client) {
      throw new Error(`Client not connected for server ${serverId}`);
    }

    return await client.callTool({
      name: toolName,
      arguments: args,
    });
  }

  private getClient(userId: string, serverId: string): Client | undefined {
    return this.connections.get(userId)?.get(serverId);
  }
}

export const mcpRegistry = new McpRegistry();
