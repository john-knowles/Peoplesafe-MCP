import { createServer, type IncomingMessage, type Server as NodeHttpServer, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server.js";
import { assertMcpHttpBearerOr401 } from "./mcp-http-auth.js";
import {
  McpHttpPayloadTooLargeError,
  parseUtf8BodyToJson,
  readIncomingMessageBodyCapped
} from "./mcp-http-body-limit.js";
import {
  getHttpHost,
  getHttpPort,
  getLegacySseMessagesPath,
  getLegacySsePath,
  getMcpHttpMaxBodyBytes,
  getMcpHttpMaxSessions,
  getMcpPath
} from "./config.js";
import { evictOldestSessionIfMapAtCapacity } from "./mcp-session-cap.js";

interface StreamableSession {
  server: ReturnType<typeof createMcpServer>;
  transport: StreamableHTTPServerTransport;
}

interface SseSession {
  server: ReturnType<typeof createMcpServer>;
  transport: SSEServerTransport;
}

export async function startStdioServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export async function startHttpServer(): Promise<NodeHttpServer> {
  const mcpPath = getMcpPath();
  const ssePath = getLegacySsePath();
  const sseMessagesPath = getLegacySseMessagesPath();
  const maxSessions = getMcpHttpMaxSessions();
  const streamableSessions = new Map<string, StreamableSession>();
  const sseSessions = new Map<string, SseSession>();

  const httpServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

      if (requestUrl.pathname === mcpPath) {
        if (!assertMcpHttpBearerOr401(request, response)) {
          return;
        }
        const body = await readParsedBody(request);
        await handleMcpRequest(request, response, body, streamableSessions, maxSessions);
        return;
      }

      if (requestUrl.pathname === ssePath && request.method === "GET") {
        if (!assertMcpHttpBearerOr401(request, response)) {
          return;
        }
        await handleLegacySseConnect(response, sseMessagesPath, sseSessions, maxSessions);
        return;
      }

      if (requestUrl.pathname === sseMessagesPath && request.method === "POST") {
        if (!assertMcpHttpBearerOr401(request, response)) {
          return;
        }
        const body = await readParsedBody(request);
        await handleLegacySseMessage(requestUrl, request, response, body, sseSessions);
        return;
      }

      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      if (error instanceof McpHttpPayloadTooLargeError) {
        if (!response.headersSent) {
          sendPayloadTooLarge(response, error.limitBytes);
        }
        return;
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
      }
      response.end(JSON.stringify({ error: message }));
    }
  });

  httpServer.on("close", () => {
    Promise.all([
      ...Array.from(streamableSessions.values()).map((session) => closeStreamableSession(session)),
      ...Array.from(sseSessions.values()).map((session) => closeSseSession(session))
    ]).catch((reason) => {
      const detail = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
      process.stderr.write(`[peoplesafe-mcp] HTTP server session cleanup failed: ${detail}\n`);
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(getHttpPort(), getHttpHost(), () => resolve());
    httpServer.once("error", reject);
  });

  process.stderr.write(
    `Peoplesafe MCP HTTP server listening on http://${getHttpHost()}:${getHttpPort()}${mcpPath}\n`
  );
  process.stderr.write(
    `Legacy SSE compatibility available on http://${getHttpHost()}:${getHttpPort()}${ssePath}\n`
  );

  return httpServer;
}

export async function startSseServer(): Promise<NodeHttpServer> {
  const ssePath = getLegacySsePath();
  const sseMessagesPath = getLegacySseMessagesPath();
  const maxSessions = getMcpHttpMaxSessions();
  const sseSessions = new Map<string, SseSession>();

  const httpServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

      if (requestUrl.pathname === ssePath && request.method === "GET") {
        if (!assertMcpHttpBearerOr401(request, response)) {
          return;
        }
        await handleLegacySseConnect(response, sseMessagesPath, sseSessions, maxSessions);
        return;
      }

      if (requestUrl.pathname === sseMessagesPath && request.method === "POST") {
        if (!assertMcpHttpBearerOr401(request, response)) {
          return;
        }
        const body = await readParsedBody(request);
        await handleLegacySseMessage(requestUrl, request, response, body, sseSessions);
        return;
      }

      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      if (error instanceof McpHttpPayloadTooLargeError) {
        if (!response.headersSent) {
          sendPayloadTooLarge(response, error.limitBytes);
        }
        return;
      }
      const message = error instanceof Error ? error.message : "Internal server error";
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
      }
      response.end(JSON.stringify({ error: message }));
    }
  });

  httpServer.on("close", () => {
    Promise.all(Array.from(sseSessions.values()).map((session) => closeSseSession(session))).catch((reason) => {
      const detail = reason instanceof Error ? reason.stack ?? reason.message : String(reason);
      process.stderr.write(`[peoplesafe-mcp] SSE server session cleanup failed: ${detail}\n`);
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(getHttpPort(), getHttpHost(), () => resolve());
    httpServer.once("error", reject);
  });

  process.stderr.write(
    `Peoplesafe MCP SSE server listening on http://${getHttpHost()}:${getHttpPort()}${ssePath}\n`
  );
  process.stderr.write(
    `Peoplesafe MCP SSE message endpoint available on http://${getHttpHost()}:${getHttpPort()}${sseMessagesPath}\n`
  );

  return httpServer;
}

async function handleMcpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  parsedBody: unknown,
  sessions: Map<string, StreamableSession>,
  maxSessions: number
): Promise<void> {
  const sessionIdHeader = getSessionIdHeader(request);

  if (sessionIdHeader) {
    const existingSession = sessions.get(sessionIdHeader);
    if (!existingSession) {
      sendJsonRpcError(response, 400, "Invalid or missing session ID");
      return;
    }

    await existingSession.transport.handleRequest(request, response, parsedBody);
    return;
  }

  if (request.method !== "POST" || !isInitializeRequest(parsedBody)) {
    sendJsonRpcError(response, 400, "Bad Request: No valid session ID provided");
    return;
  }

  let session: StreamableSession | undefined;
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      if (!session) {
        return;
      }
      if (!sessions.has(sessionId)) {
        evictOldestSessionIfMapAtCapacity(
          sessions,
          maxSessions,
          (s) => closeStreamableSession(s),
          "streamable HTTP"
        );
      }
      sessions.set(sessionId, session);
    },
    onsessionclosed: async (sessionId) => {
      const existingSession = sessions.get(sessionId);
      if (existingSession) {
        sessions.delete(sessionId);
        await existingSession.server.close();
      }
    }
  });

  session = { server, transport };
  transport.onclose = () => {
    const sessionId = transport.sessionId;
    if (!sessionId) {
      return;
    }

    const existingSession = sessions.get(sessionId);
    if (existingSession) {
      sessions.delete(sessionId);
      void existingSession.server.close();
    }
  };

  await server.connect(transport);
  await transport.handleRequest(request, response, parsedBody);
}

async function handleLegacySseConnect(
  response: ServerResponse,
  messagesPath: string,
  sessions: Map<string, SseSession>,
  maxSessions: number
): Promise<void> {
  const server = createMcpServer();
  const transport = new SSEServerTransport(messagesPath, response);
  const sessionId = transport.sessionId;
  const session = { server, transport };
  if (!sessions.has(sessionId)) {
    evictOldestSessionIfMapAtCapacity(sessions, maxSessions, (s) => closeSseSession(s), "SSE");
  }
  sessions.set(sessionId, session);

  transport.onclose = () => {
    const existingSession = sessions.get(sessionId);
    if (existingSession) {
      sessions.delete(sessionId);
      void closeSseSession(existingSession, false);
    }
  };

  await server.connect(transport);
}

async function handleLegacySseMessage(
  requestUrl: URL,
  request: IncomingMessage,
  response: ServerResponse,
  parsedBody: unknown,
  sessions: Map<string, SseSession>
): Promise<void> {
  const sessionId = requestUrl.searchParams.get("sessionId");
  if (!sessionId) {
    response.statusCode = 400;
    response.end("Missing sessionId parameter");
    return;
  }

  const session = sessions.get(sessionId);
  if (!session) {
    response.statusCode = 404;
    response.end("Session not found");
    return;
  }

  await session.transport.handlePostMessage(request, response, parsedBody);
}

async function readParsedBody(request: IncomingMessage): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const buf = await readIncomingMessageBodyCapped(request, getMcpHttpMaxBodyBytes());
  if (!buf || buf.length === 0) {
    return undefined;
  }

  return parseUtf8BodyToJson(buf.toString("utf8"));
}

function sendPayloadTooLarge(response: ServerResponse, limitBytes: number): void {
  response.statusCode = 413;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ error: "Payload Too Large", limitBytes }));
}

function getSessionIdHeader(request: IncomingMessage): string | undefined {
  const headerValue = request.headers["mcp-session-id"];
  return typeof headerValue === "string" ? headerValue : undefined;
}

function sendJsonRpcError(response: ServerResponse, statusCode: number, message: string): void {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message
      },
      id: null
    })
  );
}

async function closeStreamableSession(
  session: StreamableSession,
  closeTransport = true
): Promise<void> {
  if (closeTransport) {
    await session.transport.close().catch(() => undefined);
  }
  await session.server.close().catch(() => undefined);
}

async function closeSseSession(session: SseSession, closeTransport = true): Promise<void> {
  if (closeTransport) {
    await session.transport.close().catch(() => undefined);
  }
  await session.server.close().catch(() => undefined);
}
