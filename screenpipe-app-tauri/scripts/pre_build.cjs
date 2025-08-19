const fs = require("fs");
const path = require("path");
const os = require("os");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");
const destDir = path.join(root, "src-tauri", "bin");

const plat = os.platform();
const envTriple = process.env.SCREENPIPE_TARGET_TRIPLE;

const defaultTriple =
  plat === "win32" ? "x86_64-pc-windows-msvc" :
  plat === "linux" ? "x86_64-unknown-linux-gnu" :
  "aarch64-apple-darwin";

const triple = envTriple || defaultTriple;
const exeName = plat === "win32" ? "screenpipe.exe" : "screenpipe";
const candidates = [
  path.join(repoRoot, "target", triple, "release", exeName),
  path.join(repoRoot, "target", "release", exeName)
];

let src = candidates.find(p => fs.existsSync(p));

if (!src) {
  const targetDir = path.join(repoRoot, "target");
  if (fs.existsSync(targetDir)) {
    const triples = fs.readdirSync(targetDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const t of triples) {
      const p = path.join(targetDir, t, "release", exeName);
      if (fs.existsSync(p)) { src = p; break; }
    }
  }
}

if (!src) {
  console.error("screenpipe binary not found", { candidates, triple });
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

const dest = path.join(destDir, plat === "win32" ? `screenpipe-${triple}.exe` : `screenpipe-${triple}`);
fs.copyFileSync(src, dest);

if (plat !== "win32") {
  try { fs.chmodSync(dest, 0o755); } catch {}
}

console.log("screenpipe binary copied", { src, dest, triple, platform: plat });
