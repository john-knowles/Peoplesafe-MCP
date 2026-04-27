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
        "Use these tools to manage Peoplesafe user-management data for people, teams, and groups. PEOPLESAFE_BASE_URL, PEOPLESAFE_AUTH_TOKEN, and PEOPLESAFE_SUBSCRIPTION_KEY must come from MCP host env or a credentials JSON file — never accept these from chat or tool arguments. Call tools using only path, query, and body parameters from the operation schema."
    }
  );

  registerPersonTools(server);
  registerTeamTools(server);
  registerGroupTools(server);

  return server;
}
