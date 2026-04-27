import { readFileSync } from "node:fs";

interface CredentialDefaults {
  baseUrl?: string | undefined;
  authToken?: string | undefined;
  subscriptionKey?: string | undefined;
}

let cachedDefaults: CredentialDefaults | null = null;
let loadAttempted = false;

const BASE_URL_KEYS = [
  "baseUrl",
  "baseURL",
  "base_url",
  "BASE_URL",
  "PEOPLESAFE_BASE_URL",
  "url",
  "apiUrl",
  "api_url",
  "PEOPLESAFE_URL",
  "PEOPLESAFE_API_BASE_URL",
  "PEOPLESAFE_API_URL",
  "PEOPLESAFE_USER_MANAGEMENT_URL",
  "PEOPLESAFE_USER_MANAGEMENT_BASE_URL",
  "PEOPLESAFE_BASEURL"
];

const AUTH_TOKEN_KEYS = [
  "authToken",
  "auth_token",
  "PEOPLESAFE_AUTH_TOKEN",
  "PEOPLESAFE_AUTH_KEY",
  "PEOPLESAFE_AUTH_API_KEY"
];

const SUBSCRIPTION_KEY_KEYS = [
  "subscriptionKey",
  "subscription_key",
  "PEOPLESAFE_SUBSCRIPTION_KEY",
  "subscription-key"
];

/** First matching string value for an allowed key, at any object depth (matches nested `env` blocks). */
function deepFindStringByKeys(root: unknown, keys: readonly string[]): string | undefined {
  const keySet = new Set(keys);

  function walk(node: unknown): string | undefined {
    if (node === null || typeof node !== "object") {
      return undefined;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item);
        if (found) {
          return found;
        }
      }
      return undefined;
    }

    const record = node as Record<string, unknown>;

    for (const k of Object.keys(record)) {
      if (keySet.has(k)) {
        const v = record[k];
        if (typeof v === "string" && v.trim()) {
          return v.trim();
        }
      }
    }

    for (const k of Object.keys(record)) {
      const found = walk(record[k]);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  return walk(root);
}

function normalizeRecord(raw: Record<string, unknown>): CredentialDefaults {
  return {
    baseUrl: deepFindStringByKeys(raw, BASE_URL_KEYS),
    authToken: deepFindStringByKeys(raw, AUTH_TOKEN_KEYS),
    subscriptionKey: deepFindStringByKeys(raw, SUBSCRIPTION_KEY_KEYS)
  };
}

function parseJsonObject(raw: string, label: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${label}: invalid JSON`);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label}: root value must be a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

function loadJsonFile(path: string): CredentialDefaults {
  const raw = readFileSync(path, "utf8");
  return normalizeRecord(parseJsonObject(raw, path));
}

function parseConfigPathFromArgv(): string | undefined {
  const argv = process.argv;
  const flagIdx = argv.indexOf("--config");
  if (flagIdx !== -1 && argv[flagIdx + 1]) {
    return argv[flagIdx + 1];
  }

  for (const arg of argv) {
    if (arg.startsWith("--config=")) {
      const rest = arg.slice("--config=".length);
      if (rest.trim()) {
        return rest;
      }
    }
  }

  return undefined;
}

function mergeCredentialLayers(lowestFirst: CredentialDefaults[]): CredentialDefaults {
  const merged: CredentialDefaults = {};
  for (const layer of lowestFirst) {
    if (layer.baseUrl?.trim()) {
      merged.baseUrl = layer.baseUrl.trim();
    }
    if (layer.authToken?.trim()) {
      merged.authToken = layer.authToken.trim();
    }
    if (layer.subscriptionKey?.trim()) {
      merged.subscriptionKey = layer.subscriptionKey.trim();
    }
  }
  return merged;
}

function loadCredentialDefaultsFromSources(): CredentialDefaults | null {
  const layers: CredentialDefaults[] = [];

  const inlineJson = process.env.PEOPLESAFE_CONFIG_JSON?.trim();
  if (inlineJson) {
    layers.push(normalizeRecord(parseJsonObject(inlineJson, "PEOPLESAFE_CONFIG_JSON")));
  }

  const envFilePath = process.env.PEOPLESAFE_CONFIG_FILE?.trim();
  if (envFilePath) {
    layers.push(loadJsonFile(envFilePath));
  }

  const argvPath = parseConfigPathFromArgv();
  if (argvPath) {
    layers.push(loadJsonFile(argvPath));
  }

  if (layers.length === 0) {
    return null;
  }

  const merged = mergeCredentialLayers(layers);
  const hasAny =
    Boolean(merged.baseUrl?.trim()) ||
    Boolean(merged.authToken?.trim()) ||
    Boolean(merged.subscriptionKey?.trim());

  return hasAny ? merged : null;
}

/** Loads optional JSON/file credentials once; safe to call from any entrypoint. */
export function ensureCredentialDefaultsLoaded(): void {
  if (loadAttempted) {
    return;
  }

  loadAttempted = true;

  try {
    cachedDefaults = loadCredentialDefaultsFromSources();
  } catch (error) {
    cachedDefaults = null;
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Peoplesafe MCP: failed to load JSON credentials (${message})\n`);
  }
}

export function getCredentialDefaults(): CredentialDefaults | null {
  ensureCredentialDefaultsLoaded();
  return cachedDefaults ?? null;
}
