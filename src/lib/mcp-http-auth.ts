import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * When `MCP_HTTP_BEARER_TOKEN` is set, HTTP/SSE transports require
 * `Authorization: Bearer <token>` on every MCP-related request (including session follow-ups).
 * When unset, behavior matches older releases (no transport-level gate).
 */
export function getMcpHttpBearerSecret(): string | undefined {
  const raw = process.env.MCP_HTTP_BEARER_TOKEN?.trim();
  return raw ? raw : undefined;
}

export function isMcpHttpBearerAuthConfigured(): boolean {
  return getMcpHttpBearerSecret() !== undefined;
}

export function verifyMcpHttpBearerAuth(authorizationHeader: string | undefined | null): boolean {
  const secret = getMcpHttpBearerSecret();
  if (!secret) {
    return true;
  }

  const prefix = "Bearer ";
  if (
    typeof authorizationHeader !== "string" ||
    !authorizationHeader.startsWith(prefix) ||
    authorizationHeader.length <= prefix.length
  ) {
    return false;
  }

  const token = authorizationHeader.slice(prefix.length).trim();
  return timingSafeEqualUtf8(secret, token);
}

function timingSafeEqualUtf8(expected: string, provided: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function assertMcpHttpBearerOr401(
  request: IncomingMessage,
  response: ServerResponse
): boolean {
  if (verifyMcpHttpBearerAuth(request.headers.authorization)) {
    return true;
  }
  sendUnauthorized(response);
  return false;
}

export function sendUnauthorized(response: ServerResponse): void {
  response.statusCode = 401;
  response.setHeader("WWW-Authenticate", 'Bearer realm="mcp"');
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ error: "Unauthorized" }));
}
