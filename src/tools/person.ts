import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { personOperationDefinitions } from "../generated/operations.js";
import { registerOperations } from "./shared.js";

export function registerPersonTools(server: McpServer): void {
  registerOperations(server, personOperationDefinitions);
}
