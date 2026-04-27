import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGroupTools } from "../tools/group.js";
import { registerPersonTools } from "../tools/person.js";
import { registerTeamTools } from "../tools/team.js";

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "peoplesafe-user-management",
      version: "0.1.0"
    },
    {
      capabilities: {
        logging: {}
      },
      instructions:
        "Use these tools to manage Peoplesafe user-management data for people, teams, and groups. PEOPLESAFE_BASE_URL, PEOPLESAFE_AUTH_TOKEN, and PEOPLESAFE_SUBSCRIPTION_KEY are injected by the MCP host — do not ask users for these. Call tools using only operation arguments (path, query, body). Omit baseUrl on tool calls unless deliberately overriding the server environment."
    }
  );

  registerPersonTools(server);
  registerTeamTools(server);
  registerGroupTools(server);

  return server;
}
