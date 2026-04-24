import type { ZodTypeAny } from "zod";
import type { OperationDefinition } from "../generated/operations.js";
import type { PeoplesafeApiContext } from "./auth.js";
import { getRequestTimeoutMs } from "./config.js";

export interface ApiErrorDetails {
  operation: string;
  method: string;
  path: string;
  status: number;
  statusText: string;
  response: unknown;
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
        response: parsePayloadWithSchema(operation.errorSchema, payload)
      }
    );
  }

  return parseSuccessfulPayload(operation, response.status, payload);
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
    data: parsePayloadWithSchema(operation.responseSchema, payload)
  };
}

function parsePayloadWithSchema(schema: ZodTypeAny | undefined, payload: unknown): unknown {
  if (!schema) {
    return payload;
  }

  try {
    return schema.parse(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Warning: Peoplesafe API response validation failed, returning raw payload. Error: ${message}\n`);
    return payload;
  }
}
