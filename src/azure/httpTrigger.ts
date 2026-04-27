import { randomUUID } from "node:crypto";
import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "../lib/server.js";
import {
  McpHttpPayloadTooLargeError,
  parseUtf8BodyToJson,
  readAzureHttpRequestBodyCapped
} from "../lib/mcp-http-body-limit.js";
import { verifyMcpHttpBearerAuth } from "../lib/mcp-http-auth.js";
import { getMcpHttpMaxBodyBytes, getMcpHttpMaxSessions } from "../lib/config.js";
import { evictOldestSessionIfMapAtCapacity } from "../lib/mcp-session-cap.js";

interface AzureSession {
  server: ReturnType<typeof createMcpServer>;
  transport: WebStandardStreamableHTTPServerTransport;
}

export interface AzureMcpHandlerOptions {
  enableJsonResponse?: boolean;
  statefulSessions?: boolean;
}

async function closeAzureSession(session: AzureSession): Promise<void> {
  await session.transport.close().catch(() => undefined);
  await session.server.close().catch(() => undefined);
}

export function createAzureMcpHandler(options: AzureMcpHandlerOptions = {}) {
  const sessions = new Map<string, AzureSession>();
  const maxSessions = getMcpHttpMaxSessions();
  const enableJsonResponse = options.enableJsonResponse ?? true;
  const statefulSessions = options.statefulSessions ?? false;

  return async function azureMcpHandler(
    request: HttpRequest,
    context: InvocationContext
  ): Promise<HttpResponseInit> {
    if (!verifyMcpHttpBearerAuth(request.headers.get("authorization"))) {
      return {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer realm="mcp"',
          "Content-Type": "application/json"
        },
        jsonBody: { error: "Unauthorized" }
      };
    }

    let rawBody: string | undefined;
    if (request.method !== "GET" && request.method !== "HEAD") {
      try {
        rawBody = await readAzureHttpRequestBodyCapped(request, getMcpHttpMaxBodyBytes());
      } catch (error) {
        if (error instanceof McpHttpPayloadTooLargeError) {
          return jsonResponse(413, {
            error: "Payload Too Large",
            limitBytes: error.limitBytes
          });
        }
        throw error;
      }
    }

    const parsedBody = parseUtf8BodyToJson(rawBody ?? "");
    const sessionId = request.headers.get("mcp-session-id");

    let session = sessionId ? sessions.get(sessionId) : undefined;

    if (!session) {
      if (request.method !== "POST" || !isInitializeRequest(parsedBody)) {
        return jsonResponse(400, {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided"
          },
          id: null
        });
      }

      const server = createMcpServer();
      const transport = new WebStandardStreamableHTTPServerTransport({
        enableJsonResponse,
        sessionIdGenerator: statefulSessions ? () => randomUUID() : undefined,
        onsessioninitialized: (newSessionId) => {
          if (!statefulSessions) {
            return;
          }
          if (!sessions.has(newSessionId)) {
            evictOldestSessionIfMapAtCapacity(
              sessions,
              maxSessions,
              closeAzureSession,
              "Azure MCP"
            );
          }
          sessions.set(newSessionId, session!);
        },
        onsessionclosed: async (closedSessionId) => {
          const existingSession = sessions.get(closedSessionId);
          if (!existingSession) {
            return;
          }
          sessions.delete(closedSessionId);
          await existingSession.server.close();
        }
      });

      session = { server, transport };
      await server.connect(transport);
    }

    const webRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawBody
    });

    const webResponse = await session.transport.handleRequest(webRequest, {
      parsedBody
    });

    if (statefulSessions && session.transport.sessionId) {
      const sid = session.transport.sessionId;
      if (!sessions.has(sid)) {
        evictOldestSessionIfMapAtCapacity(
          sessions,
          maxSessions,
          closeAzureSession,
          "Azure MCP"
        );
      }
      sessions.set(sid, session);
    } else if (!statefulSessions) {
      await session.server.close();
    }

    context.log(`Handled MCP ${request.method} request for ${request.url}`);
    return toAzureResponse(webResponse);
  };
}

export const azureMcpHttpHandler = createAzureMcpHandler();

function jsonResponse(status: number, payload: unknown): HttpResponseInit {
  return {
    status,
    jsonBody: payload
  };
}

async function toAzureResponse(response: Response): Promise<HttpResponseInit> {
  const body = await response.arrayBuffer();
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    status: response.status,
    headers,
    body: Buffer.from(body)
  };
}
