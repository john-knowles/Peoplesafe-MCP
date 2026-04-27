import { ZodError, type ZodIssue, type ZodTypeAny } from "zod";
import type { OperationDefinition } from "../generated/operations.js";
import type { PeoplesafeApiContext } from "./auth.js";
import { getRequestTimeoutMs, isDebugMode } from "./config.js";

/** Response header names safe to expose in MCP tool error JSON (no Set-Cookie, WWW-Authenticate, trace secrets, etc.). */
const API_ERROR_RESPONSE_HEADER_ALLOWLIST = new Set([
  "cache-control",
  "content-type",
  "retry-after",
  "x-correlation-id",
  "x-ms-request-id",
  "x-request-id"
]);

function collectAllowlistedResponseHeaders(source: Headers): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  source.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (API_ERROR_RESPONSE_HEADER_ALLOWLIST.has(lower)) {
      out[lower] = value;
    }
  });
  return Object.keys(out).length > 0 ? out : undefined;
}

export interface ApiErrorDetails {
  operation: string;
  method: string;
  path: string;
  status: number;
  statusText: string;
  response: unknown;
  headers?: Record<string, string>;
}

export class PeoplesafeApiError extends Error {
  constructor(
    message: string,
    readonly details: ApiErrorDetails
  ) {
    super(message);
    this.name = "PeoplesafeApiError";
  }
}

export class PeoplesafeValidationError extends Error {
  constructor(
    message: string,
    readonly issues: ZodIssue[]
  ) {
    super(message);
    this.name = "PeoplesafeValidationError";
  }
}

export interface ExecuteOperationArgs {
  operation: OperationDefinition;
  input: {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    body?: unknown;
  };
  apiContext: PeoplesafeApiContext;
}

export async function executeOperation({
  operation,
  input,
  apiContext
}: ExecuteOperationArgs): Promise<unknown> {
  const url = buildUrl(operation, input.path ?? {}, input.query ?? {}, apiContext.baseUrl);
  const headers = new Headers({
    Accept: operation.responseContentType || "application/json",
    "x-auth-token": apiContext.authToken,
    "X-Subscription-Key": apiContext.subscriptionKey
  });

  if (isDebugMode()) {
    process.stderr.write(`[peoplesafe] ${operation.method} ${url}\n`);
  }

  const requestInit: RequestInit = {
    method: operation.method,
    headers,
    signal: AbortSignal.timeout(getRequestTimeoutMs())
  };

  if (input.body !== undefined) {
    headers.set("Content-Type", operation.requestContentType || "application/json");
    requestInit.body = JSON.stringify(input.body);
  }

  const response = await fetch(url, requestInit);

  if (isDebugMode()) {
    process.stderr.write(`[peoplesafe] ${response.status} ${response.statusText}\n`);
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new PeoplesafeApiError(
      `Peoplesafe API request failed with status ${response.status} ${response.statusText}.`,
      {
        operation: operation.toolName,
        method: operation.method,
        path: operation.path,
        status: response.status,
        statusText: response.statusText,
        headers: collectAllowlistedResponseHeaders(response.headers),
        response: parsePayloadWithSchema(operation.errorSchema, payload, { strict: false })
      }
    );
  }

  return parseSuccessfulPayload(operation, response.status, payload);
}

export async function executeOperationWithRetry(
  args: ExecuteOperationArgs & { maxRetries?: number }
): Promise<unknown> {
  const { maxRetries = 3 } = args;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeOperation(args);
    } catch (error) {
      lastError = error;

      if (!(error instanceof PeoplesafeApiError)) {
        throw error;
      }

      if (error.details.status !== 429) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      const retryAfter = getRetryAfterMs(error, attempt);
      const jitter = Math.random() * 1000;
      const totalDelay = retryAfter + jitter;

      process.stderr.write(
        `Rate limit hit for ${args.operation.toolName} (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(totalDelay)}ms...\n`
      );

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

function getRetryAfterMs(error: PeoplesafeApiError, attempt: number): number {
  const retryAfterHeader = error.details.headers?.["retry-after"];
  if (retryAfterHeader) {
    const parsedSeconds = Number.parseInt(retryAfterHeader, 10);
    if (Number.isFinite(parsedSeconds)) {
      return parsedSeconds * 1000;
    }
  }

  // Exponential backoff: 1s, 2s, 4s...
  return 1000 * Math.pow(2, attempt);
}

function buildUrl(
  operation: OperationDefinition,
  pathValues: Record<string, unknown>,
  queryValues: Record<string, unknown>,
  baseUrl: string
): URL {
  let pathname = operation.path;

  for (const parameter of operation.parameters) {
    if (parameter.location !== "path") {
      continue;
    }

    const value = pathValues[parameter.name];
    pathname = pathname.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
  }

  const url = new URL(pathname.startsWith("/") ? pathname.slice(1) : pathname, ensureTrailingSlash(baseUrl));

  for (const parameter of operation.parameters) {
    if (parameter.location !== "query") {
      continue;
    }

    const value = queryValues[parameter.name];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(parameter.name, String(value));
  }

  return url;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseSuccessfulPayload(
  operation: OperationDefinition,
  status: number,
  payload: unknown
): unknown {
  if (payload === null || payload === undefined || payload === "") {
    return {
      ok: true,
      status
    };
  }

  return {
    ok: true,
    status,
    data: parsePayloadWithSchema(operation.responseSchema, payload, {
      strict: false,
      context: `success response for ${operation.toolName}`
    })
  };
}

function parsePayloadWithSchema(
  schema: ZodTypeAny | undefined,
  payload: unknown,
  options: { strict?: boolean; context?: string } = {}
): unknown {
  const { strict = true, context = "payload" } = options;
  if (!schema) {
    return payload;
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      if (strict) {
        throw new PeoplesafeValidationError("API response validation failed", error.issues);
      }

      const message = error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");
      process.stderr.write(
        `Warning: Peoplesafe ${context} validation failed, returning raw payload. ${message}\n`
      );
    }

    return payload;
  }
}
