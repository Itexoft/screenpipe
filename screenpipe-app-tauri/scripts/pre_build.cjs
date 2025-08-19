const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");
const destDir = path.join(root, "src-tauri", "binaries");

const plat = os.platform();
const envTriple = process.env.SCREENPIPE_TARGET_TRIPLE;

const arch = os.arch();
const defaultTriple =
  plat === "win32" ? "x86_64-pc-windows-msvc" :
  plat === "linux" ? "x86_64-unknown-linux-gnu" :
  arch === "arm64" ? "aarch64-apple-darwin" :
  "x86_64-apple-darwin";

const triple = envTriple || defaultTriple;
const base = "screenpipe";
const ext = plat === "win32" ? ".exe" : "";
const src = path.join(repoRoot, "target", triple, "release", base + ext);
const dest = path.join(destDir, `${base}-${triple}${ext}`);

if (!fs.existsSync(src)) {
  console.error("screenpipe binary not found", { src, triple });
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);

if (plat !== "win32") {
  try { fs.chmodSync(dest, 0o755); } catch {}
}

console.log("screenpipe binary copied", { src, dest, triple });
