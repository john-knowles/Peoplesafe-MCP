import { spawnSync } from "node:child_process";

const functionAppName = process.env.FUNCTIONAPP_NAME?.trim();

if (!functionAppName) {
  console.error("FUNCTIONAPP_NAME must be set before running npm run deploy.");
  process.exit(1);
}

const buildResult = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const deployResult = spawnSync("npx", ["func", "azure", "functionapp", "publish", functionAppName], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

process.exit(deployResult.status ?? 1);
