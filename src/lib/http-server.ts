import { createServer, type IncomingMessage, type Server as NodeHttpServer, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMcpServer } from "./server.js";
import { getHttpHost, getHttpPort, getLegacySseMessagesPath, getLegacySsePath, getMcpPath } from "./config.js";

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
  const streamableSessions = new Map<string, StreamableSession>();
  const sseSessions = new Map<string, SseSession>();

  const httpServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

      if (requestUrl.pathname === mcpPath) {
        const body = await readParsedBody(request);
        await handleMcpRequest(request, response, body, streamableSessions);
        return;
      }

      if (requestUrl.pathname === ssePath && request.method === "GET") {
        await handleLegacySseConnect(response, sseMessagesPath, sseSessions);
        return;
      }

      if (requestUrl.pathname === sseMessagesPath && request.method === "POST") {
        const body = await readParsedBody(request);
        await handleLegacySseMessage(requestUrl, request, response, body, sseSessions);
        return;
      }

      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
      }
      response.end(JSON.stringify({ error: message }));
    }
  });

  httpServer.on("close", () => {
    void Promise.all([
      ...Array.from(streamableSessions.values()).map((session) => closeStreamableSession(session)),
      ...Array.from(sseSessions.values()).map((session) => closeSseSession(session))
    ]);
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
  const sseSessions = new Map<string, SseSession>();

  const httpServer = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

      if (requestUrl.pathname === ssePath && request.method === "GET") {
        await handleLegacySseConnect(response, sseMessagesPath, sseSessions);
        return;
      }

      if (requestUrl.pathname === sseMessagesPath && request.method === "POST") {
        const body = await readParsedBody(request);
        await handleLegacySseMessage(requestUrl, request, response, body, sseSessions);
        return;
      }

      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ error: "Not found" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "application/json");
      }
      response.end(JSON.stringify({ error: message }));
    }
  });

  httpServer.on("close", () => {
    void Promise.all(Array.from(sseSessions.values()).map((session) => closeSseSession(session)));
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
  sessions: Map<string, StreamableSession>
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
  sessions: Map<string, SseSession>
): Promise<void> {
  const server = createMcpServer();
  const transport = new SSEServerTransport(messagesPath, response);
  const sessionId = transport.sessionId;
  const session = { server, transport };
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

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
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
