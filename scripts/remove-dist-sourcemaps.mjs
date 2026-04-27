import { existsSync, readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");

function walk(dir) {
  if (!existsSync(dir)) {
    return;
  }
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
    } else if (name.endsWith(".map")) {
      unlinkSync(full);
    }
  }
}

walk(distDir);
