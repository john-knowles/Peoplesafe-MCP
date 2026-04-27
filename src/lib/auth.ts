import { getCredentialDefaults } from "./json-credentials.js";

export const MISSING_CONTEXT_MESSAGE =
  "I need your Peoplesafe API Base URL, Auth Token, and Subscription Key to proceed.";

export interface ApiContextInput {
  baseUrl?: string | null | undefined;
  authToken?: string | null | undefined;
  subscriptionKey?: string | null | undefined;
}

function normalizeOptionalCredentialString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * If canonical env keys are missing, accept any PEOPLESAFE_* key whose name suggests a URL and whose value looks like http(s).
 * (Guards against typos like PEOPLESAFE_USER_MANAGEMENT_BASE that still hold the real URL.)
 */
function discoverPeoplesafeBaseUrlFromEnvKeys(): string | undefined {
  for (const key of Object.keys(process.env).sort()) {
    if (!/^PEOPLESAFE_/i.test(key)) {
      continue;
    }
    if (!/(BASE|URL)/i.test(key)) {
      continue;
    }
    const v = process.env[key]?.trim();
    if (!v || !/^https?:\/\//i.test(v)) {
      continue;
    }
    return v;
  }
  return undefined;
}

export interface PeoplesafeApiContext {
  baseUrl: string;
  authToken: string;
  subscriptionKey: string;
}

interface ResolvedCredentialParts {
  baseUrl: string | undefined;
  authToken: string | undefined;
  subscriptionKey: string | undefined;
}

/**
 * Reads env with exact key first, then case-insensitive match (some hosts rewrite env key casing).
 */
function readFirstEnvValue(allowedKeysInOrder: readonly string[]): string | undefined {
  for (const name of allowedKeysInOrder) {
    const direct = process.env[name]?.trim();
    if (direct) {
      return direct;
    }
  }

  for (const name of allowedKeysInOrder) {
    const upper = name.toUpperCase();
    for (const key of Object.keys(process.env)) {
      if (key.toUpperCase() === upper) {
        const v = process.env[key]?.trim();
        if (v) {
          return v;
        }
      }
    }
  }

  return undefined;
}

const BASE_URL_ENV_KEYS = [
  "PEOPLESAFE_BASE_URL",
  "PEOPLESAFE_URL",
  "PEOPLESAFE_API_BASE_URL",
  "PEOPLESAFE_API_URL",
  "PEOPLESAFE_USER_MANAGEMENT_URL",
  "PEOPLESAFE_USER_MANAGEMENT_BASE_URL",
  "PEOPLESAFE_BASEURL"
] as const;

const AUTH_ENV_KEYS = ["PEOPLESAFE_AUTH_TOKEN", "PEOPLESAFE_AUTH_KEY", "PEOPLESAFE_AUTH_API_KEY"] as const;

const SUBSCRIPTION_ENV_KEYS = ["PEOPLESAFE_SUBSCRIPTION_KEY", "PEOPLESAFE_SUBSCRIPTION_KEY_HEADER"] as const;

let credentialFailureDiagnosticsLogged = false;

function logCredentialEnvDiagnosticsOnce(parts: ResolvedCredentialParts): void {
  if (credentialFailureDiagnosticsLogged) {
    return;
  }
  credentialFailureDiagnosticsLogged = true;

  const peoplesafeEnvKeys = Object.keys(process.env).filter((k) => k.toUpperCase().startsWith("PEOPLESAFE_"));
  peoplesafeEnvKeys.sort();

  process.stderr.write(
    "[peoplesafe-mcp] Credential check failed. " +
      `PEOPLESAFE_* keys visible to this process: ${peoplesafeEnvKeys.join(", ") || "(none)"}. ` +
      "If PEOPLESAFE_BASE_URL is missing here, Claude Desktop did not pass it into the MCP subprocess (fix claude_desktop_config.json and fully quit + reopen Claude).\n"
  );

  const missingBits: string[] = [];
  if (!parts.baseUrl?.trim()) {
    missingBits.push("baseUrl");
  }
  if (!parts.authToken?.trim()) {
    missingBits.push("authToken");
  }
  if (!parts.subscriptionKey?.trim()) {
    missingBits.push("subscriptionKey");
  }
  if (missingBits.length > 0) {
    process.stderr.write(`[peoplesafe-mcp] Still unresolved after env + credentials file: ${missingBits.join(", ")}\n`);
  }
}

/** Base URL env vars honored by the MCP server (Docker / Claude Desktop `env`). */
export function resolvePeoplesafeBaseUrlFromEnv(): string | undefined {
  return readFirstEnvValue(BASE_URL_ENV_KEYS) || discoverPeoplesafeBaseUrlFromEnvKeys();
}

function resolvePeoplesafeAuthTokenFromEnv(): string | undefined {
  return readFirstEnvValue(AUTH_ENV_KEYS);
}

function resolvePeoplesafeSubscriptionKeyFromEnv(): string | undefined {
  return readFirstEnvValue(SUBSCRIPTION_ENV_KEYS);
}

function resolveCredentialParts(input: ApiContextInput): ResolvedCredentialParts {
  const defaults = getCredentialDefaults();

  const baseUrl =
    resolvePeoplesafeBaseUrlFromEnv() ||
    defaults?.baseUrl?.trim() ||
    normalizeOptionalCredentialString(input.baseUrl);

  const authToken =
    resolvePeoplesafeAuthTokenFromEnv() ||
    defaults?.authToken?.trim() ||
    normalizeOptionalCredentialString(input.authToken);

  const subscriptionKey =
    resolvePeoplesafeSubscriptionKeyFromEnv() ||
    defaults?.subscriptionKey?.trim() ||
    normalizeOptionalCredentialString(input.subscriptionKey);

  return { baseUrl, authToken, subscriptionKey };
}

export function resolveApiContext(input: ApiContextInput): PeoplesafeApiContext | null {
  const parts = resolveCredentialParts(input);

  if (!parts.baseUrl || !parts.authToken || !parts.subscriptionKey) {
    logCredentialEnvDiagnosticsOnce(parts);
    return null;
  }

  return {
    baseUrl: parts.baseUrl,
    authToken: parts.authToken,
    subscriptionKey: parts.subscriptionKey
  };
}

/** Explains which values are still missing (helps debug MCP env vs JSON file). */
export function buildMissingCredentialsMessage(input: ApiContextInput): string {
  const parts = resolveCredentialParts(input);
  const missing: string[] = [];

  if (!parts.baseUrl?.trim()) {
    missing.push(
      "API base URL — add PEOPLESAFE_BASE_URL (or PEOPLESAFE_URL) to the MCP server `env` in Claude Desktop, or put `baseUrl` / `url` in your credentials JSON (nested `mcpServers.*.env` is supported)"
    );
  }

  if (!parts.authToken?.trim()) {
    missing.push(
      "auth token — add PEOPLESAFE_AUTH_TOKEN to MCP `env`, or `authToken` in credentials JSON"
    );
  }

  if (!parts.subscriptionKey?.trim()) {
    missing.push(
      "subscription key — add PEOPLESAFE_SUBSCRIPTION_KEY to MCP `env`, or `subscriptionKey` in credentials JSON"
    );
  }

  if (missing.length === 0) {
    return MISSING_CONTEXT_MESSAGE;
  }

  return `Cannot call Peoplesafe API yet. Missing: ${missing.join("; ")}. If your claude_desktop_config.json already sets these, fully quit Claude Desktop (not just the window) so the MCP server restarts, and check Claude’s stderr log for [peoplesafe-mcp] lines.`;
}
