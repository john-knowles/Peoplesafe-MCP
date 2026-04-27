import { resolvePeoplesafeBaseUrlFromEnv } from "./lib/auth.js";
import { getRuntimeTransport } from "./lib/config.js";
import { startHttpServer, startSseServer, startStdioServer } from "./lib/http-server.js";
import { isMcpHttpBearerAuthConfigured } from "./lib/mcp-http-auth.js";
import { ensureCredentialDefaultsLoaded } from "./lib/json-credentials.js";

const transportStarters = {
  stdio: startStdioServer,
  sse: startSseServer,
  http: startHttpServer
} as const;

async function main(): Promise<void> {
  ensureCredentialDefaultsLoaded();

  const baseFromEnv = resolvePeoplesafeBaseUrlFromEnv();
  process.stderr.write(
    `[peoplesafe-mcp] Base URL from environment: ${baseFromEnv ? `resolved (${baseFromEnv.length} chars)` : "NOT resolved — check MCP stderr when a tool runs, or fix env key names"}\n`
  );

  const transport = getRuntimeTransport();
  if ((transport === "http" || transport === "sse") && !isMcpHttpBearerAuthConfigured()) {
    process.stderr.write(
      "[peoplesafe-mcp] Warning: MCP_HTTP_BEARER_TOKEN is not set. HTTP/SSE transports are reachable without transport-level authentication. Set MCP_HTTP_BEARER_TOKEN so clients must send Authorization: Bearer <token>.\n"
    );
  }

  const startTransport = transportStarters[transport];
  await startTransport();
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
