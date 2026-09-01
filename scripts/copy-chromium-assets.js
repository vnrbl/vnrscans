import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/@sparticuz/chromium/bin");
const functionDir = resolve(root, ".vercel/output/functions/__server.func");
const bundledTarget = resolve(functionDir, "bin");
const tracedTarget = resolve(functionDir, "node_modules/@sparticuz/chromium/bin");

if (!existsSync(functionDir) || !existsSync(source)) {
  process.exit(0);
}

await mkdir(bundledTarget, { recursive: true });
await cp(source, bundledTarget, { recursive: true });

await mkdir(tracedTarget, { recursive: true });
await cp(source, tracedTarget, { recursive: true });

console.log("Copied @sparticuz/chromium browser assets into the server function.");
