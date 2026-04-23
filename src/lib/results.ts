import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function textToolResult(text: string, isError = false): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text
      }
    ],
    isError
  };
}

export function jsonToolResult(payload: unknown, isError = false): CallToolResult {
  return textToolResult(JSON.stringify(payload, null, 2), isError);
}
