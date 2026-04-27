import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ZodError } from "zod";
import type { OperationDefinition } from "../generated/operations.js";
import { buildMissingCredentialsMessage, resolveApiContext } from "../lib/auth.js";
import { getMaxRetries } from "../lib/config.js";
import { executeOperationWithRetry, PeoplesafeApiError, PeoplesafeValidationError } from "../lib/peoplesafe-api.js";
import { jsonToolResult, textToolResult } from "../lib/results.js";

export function registerOperations(server: McpServer, operations: OperationDefinition[]): void {
  for (const operation of operations) {
    server.registerTool(
      operation.toolName,
      {
        title: operation.title,
        description: operation.description,
        inputSchema: operation.inputSchema
      },
      async (input): Promise<CallToolResult> => {
        const apiContext = resolveApiContext(input);

        if (!apiContext) {
          return textToolResult(buildMissingCredentialsMessage(input), true);
        }

        try {
          const result = await executeOperationWithRetry({
            operation,
            input,
            apiContext,
            maxRetries: getMaxRetries()
          });

          return jsonToolResult({
            operation: operation.toolName,
            method: operation.method,
            path: operation.path,
            result
          });
        } catch (error) {
          if (error instanceof PeoplesafeApiError) {
            return jsonToolResult(
              {
                error: error.message,
                details: error.details
              },
              true
            );
          }

          if (error instanceof PeoplesafeValidationError) {
            return jsonToolResult(
              {
                error: error.message,
                issues: error.issues
              },
              true
            );
          }

          if (error instanceof ZodError) {
            return jsonToolResult(
              {
                error: "Peoplesafe API payload validation failed.",
                issues: error.issues
              },
              true
            );
          }

          if (error instanceof Error) {
            return textToolResult(error.message, true);
          }

          return textToolResult("An unknown error occurred while calling the Peoplesafe API.", true);
        }
      }
    );
  }
}
