import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(root, "site");
const distDir = join(root, "dist");

const paths = ["index.html", "css", "js", "images", "favicon.svg", "robots.txt", ".htaccess"];

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

for (const relativePath of paths) {
  const from = join(siteDir, relativePath);
  if (!existsSync(from)) {
    console.warn(`skip missing site/${relativePath}`);
    continue;
  }
  cpSync(from, join(distDir, relativePath), { recursive: true });
}

console.log(`Static build → ${distDir}`);
