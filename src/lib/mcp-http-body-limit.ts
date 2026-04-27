import type { IncomingMessage } from "node:http";
import type { HttpRequest } from "@azure/functions";

export class McpHttpPayloadTooLargeError extends Error {
  readonly limitBytes: number;

  constructor(limitBytes: number) {
    super(`Request body exceeds ${limitBytes} bytes`);
    this.name = "McpHttpPayloadTooLargeError";
    this.limitBytes = limitBytes;
  }
}

function parseContentLengthHeader(value: string | undefined | null): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/**
 * Reads the Node HTTP request body with a hard byte cap; destroys the socket if the limit is exceeded.
 */
export async function readIncomingMessageBodyCapped(
  request: IncomingMessage,
  maxBytes: number
): Promise<Buffer | undefined> {
  const cl = parseContentLengthHeader(
    typeof request.headers["content-length"] === "string"
      ? request.headers["content-length"]
      : undefined
  );
  if (cl !== undefined && cl > maxBytes) {
    request.destroy();
    throw new McpHttpPayloadTooLargeError(maxBytes);
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of request) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      request.destroy();
      throw new McpHttpPayloadTooLargeError(maxBytes);
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
}

/**
 * Reads the Azure Functions request body with the same byte cap (streams when possible).
 */
export async function readAzureHttpRequestBodyCapped(
  request: HttpRequest,
  maxBytes: number
): Promise<string | undefined> {
  const cl = parseContentLengthHeader(request.headers.get("content-length"));
  if (cl !== undefined && cl > maxBytes) {
    throw new McpHttpPayloadTooLargeError(maxBytes);
  }

  const stream = request.body;
  if (!stream) {
    return undefined;
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (!value) {
        continue;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new McpHttpPayloadTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

export function parseUtf8BodyToJson(raw: string): unknown {
  if (!raw.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
