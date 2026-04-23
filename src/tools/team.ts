import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { teamOperationDefinitions } from "../generated/operations.js";
import { registerOperations } from "./shared.js";

export function registerTeamTools(server: McpServer): void {
  registerOperations(server, teamOperationDefinitions);
}
