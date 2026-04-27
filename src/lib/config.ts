import { resolvePeoplesafeBaseUrlFromEnv } from "./auth.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
export const DEFAULT_HTTP_HOST = "127.0.0.1";
export const DEFAULT_CLOUD_HTTP_HOST = "0.0.0.0";
export const DEFAULT_HTTP_PORT = 3000;
export const DEFAULT_MCP_PATH = "/mcp";
export const DEFAULT_SSE_PATH = "/sse";
export const DEFAULT_SSE_MESSAGE_PATH = "/messages";
export const DEFAULT_MAX_RETRIES = 3;
/** Default cap for MCP HTTP/SSE POST bodies (1 MiB). Override with MCP_HTTP_MAX_BODY_BYTES. */
export const DEFAULT_MCP_HTTP_MAX_BODY_BYTES = 1024 * 1024;
/** Default max concurrent MCP sessions per map (streamable HTTP + SSE); oldest evicted when exceeded. */
export const DEFAULT_MCP_HTTP_MAX_SESSIONS = 512;

export type RuntimeTransport = "stdio" | "sse" | "http";

export function getBaseUrl(): string | undefined {
  return resolvePeoplesafeBaseUrlFromEnv();
}

export function getRequestTimeoutMs(): number {
  const rawValue = process.env.PEOPLESAFE_REQUEST_TIMEOUT_MS;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_REQUEST_TIMEOUT_MS;
}

export function getRuntimeTransport(): RuntimeTransport {
  const rawValue = process.env.MCP_TRANSPORT?.trim().toLowerCase();
  if (rawValue === "http" || rawValue === "streamable-http") {
    return "http";
  }

  if (rawValue === "sse") {
    return "sse";
  }

  return "stdio";
}

export function getHttpHost(): string {
  const configuredHost = process.env.MCP_HTTP_HOST?.trim();
  if (configuredHost) {
    return configuredHost;
  }

  if (process.env.WEBSITE_SITE_NAME?.trim()) {
    return DEFAULT_CLOUD_HTTP_HOST;
  }

  return DEFAULT_HTTP_HOST;
}

export function getHttpPort(): number {
  const rawValue = process.env.MCP_HTTP_PORT ?? process.env.PORT;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_HTTP_PORT;
}

export function getMcpPath(): string {
  return process.env.MCP_HTTP_PATH?.trim() || DEFAULT_MCP_PATH;
}

export function getLegacySsePath(): string {
  return process.env.MCP_SSE_PATH?.trim() || DEFAULT_SSE_PATH;
}

export function getLegacySseMessagesPath(): string {
  return process.env.MCP_SSE_MESSAGES_PATH?.trim() || DEFAULT_SSE_MESSAGE_PATH;
}

export function getMaxRetries(): number {
  const rawValue = process.env.PEOPLESAFE_MAX_RETRIES;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : DEFAULT_MAX_RETRIES;
}

export function getMcpHttpMaxBodyBytes(): number {
  const rawValue = process.env.MCP_HTTP_MAX_BODY_BYTES;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_MCP_HTTP_MAX_BODY_BYTES;
}

export function getMcpHttpMaxSessions(): number {
  const rawValue = process.env.MCP_HTTP_MAX_SESSIONS;
  const parsedValue = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_MCP_HTTP_MAX_SESSIONS;
}

export function isDebugMode(): boolean {
  return (
    process.env.PEOPLESAFE_DEBUG?.trim().toLowerCase() === "true" ||
    process.env.DEBUG?.includes("peoplesafe") === true
  );
}
