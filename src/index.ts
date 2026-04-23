import { getRuntimeTransport } from "./lib/config.js";
import { startHttpServer, startSseServer, startStdioServer } from "./lib/http-server.js";

const transportStarters = {
  stdio: startStdioServer,
  sse: startSseServer,
  http: startHttpServer
} as const;

async function main(): Promise<void> {
  const transport = getRuntimeTransport();
  const startTransport = transportStarters[transport];
  await startTransport();
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
