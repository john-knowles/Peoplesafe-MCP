import { getCredentialDefaults } from "./json-credentials.js";

export const MISSING_CONTEXT_MESSAGE =
  "I need your Peoplesafe API Base URL, Auth Token, and Subscription Key to proceed.";

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

function isPeoplesafeAllowHttp(): boolean {
  const v = process.env.PEOPLESAFE_ALLOW_HTTP?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

let insecureHttpRejectedLogged = false;
let nonHttpsSchemeRejectedLogged = false;

/**
 * Only `https://` is accepted by default. `http://` is allowed only when
 * `PEOPLESAFE_ALLOW_HTTP` is true (local dev). Any other value (missing scheme,
 * `ftp://`, host-only, etc.) is rejected.
 */
export function acceptPeoplesafeBaseUrl(candidate: string | undefined): string | undefined {
  if (!candidate?.trim()) {
    return undefined;
  }

  const trimmed = candidate.trim();

  if (/^https:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^http:\/\//i.test(trimmed)) {
    if (isPeoplesafeAllowHttp()) {
      return trimmed;
    }
    if (!insecureHttpRejectedLogged) {
      insecureHttpRejectedLogged = true;
      process.stderr.write(
        "[peoplesafe-mcp] Rejecting http:// API base URL (credentials would be sent in plaintext). Use https:// or set PEOPLESAFE_ALLOW_HTTP=true for local development only.\n"
      );
    }
    return undefined;
  }

  if (!nonHttpsSchemeRejectedLogged) {
    nonHttpsSchemeRejectedLogged = true;
    process.stderr.write(
      "[peoplesafe-mcp] Rejecting API base URL: must start with https:// (or http:// only when PEOPLESAFE_ALLOW_HTTP=true).\n"
    );
  }
  return undefined;
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

/**
 * First base URL from ordered PEOPLESAFE_* env keys that passes {@link acceptPeoplesafeBaseUrl}
 * (so an invalid `http://` in an early key does not hide a valid `https://` in a later one).
 */
function resolveFirstAcceptedCanonicalBaseUrlFromEnv(): string | undefined {
  for (const name of BASE_URL_ENV_KEYS) {
    const direct = process.env[name]?.trim();
    const ok = acceptPeoplesafeBaseUrl(direct);
    if (ok) {
      return ok;
    }
  }

  for (const name of BASE_URL_ENV_KEYS) {
    const upper = name.toUpperCase();
    for (const key of Object.keys(process.env)) {
      if (key.toUpperCase() !== upper) {
        continue;
      }
      const v = process.env[key]?.trim();
      const accepted = acceptPeoplesafeBaseUrl(v);
      if (accepted) {
        return accepted;
      }
    }
  }

  return undefined;
}

/**
 * If canonical env keys are missing or all rejected, accept any PEOPLESAFE_* key whose name suggests a URL and whose value looks like a URL (https, or http when allowed).
 * (Guards against typos like PEOPLESAFE_USER_MANAGEMENT_BASE that still hold the real URL.)
 */
function resolveFirstAcceptedDiscoveredBaseUrlFromEnv(): string | undefined {
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
    const accepted = acceptPeoplesafeBaseUrl(v);
    if (accepted) {
      return accepted;
    }
  }
  return undefined;
}

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
  return resolveFirstAcceptedCanonicalBaseUrlFromEnv() || resolveFirstAcceptedDiscoveredBaseUrlFromEnv();
}

function resolvePeoplesafeAuthTokenFromEnv(): string | undefined {
  return readFirstEnvValue(AUTH_ENV_KEYS);
}

function resolvePeoplesafeSubscriptionKeyFromEnv(): string | undefined {
  return readFirstEnvValue(SUBSCRIPTION_ENV_KEYS);
}

function resolveCredentialParts(): ResolvedCredentialParts {
  const defaults = getCredentialDefaults();

  const baseUrl =
    resolvePeoplesafeBaseUrlFromEnv() || acceptPeoplesafeBaseUrl(defaults?.baseUrl?.trim());

  const authToken = resolvePeoplesafeAuthTokenFromEnv() || defaults?.authToken?.trim();

  const subscriptionKey = resolvePeoplesafeSubscriptionKeyFromEnv() || defaults?.subscriptionKey?.trim();

  return { baseUrl, authToken, subscriptionKey };
}

export function resolveApiContext(): PeoplesafeApiContext | null {
  const parts = resolveCredentialParts();

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
export function buildMissingCredentialsMessage(): string {
  const parts = resolveCredentialParts();
  const missing: string[] = [];

  if (!parts.baseUrl?.trim()) {
    missing.push(
      "API base URL — use a full URL starting with https:// (PEOPLESAFE_BASE_URL or PEOPLESAFE_URL in MCP `env`, or baseUrl/url in credentials JSON)"
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
