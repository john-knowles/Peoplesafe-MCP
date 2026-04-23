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
        "Use these tools to manage Peoplesafe staging user-management data for people, teams, and groups. Provide authToken and subscriptionKey directly on tool calls or set PEOPLESAFE_AUTH_TOKEN and PEOPLESAFE_SUBSCRIPTION_KEY in the environment."
    }
  );

  registerPersonTools(server);
  registerTeamTools(server);
  registerGroupTools(server);

  return server;
}
