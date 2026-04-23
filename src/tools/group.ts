import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { groupOperationDefinitions } from "../generated/operations.js";
import { registerOperations } from "./shared.js";

export function registerGroupTools(server: McpServer): void {
  registerOperations(server, groupOperationDefinitions);
}
