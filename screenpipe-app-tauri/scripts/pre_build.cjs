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
const ext = plat === "win32" ? ".exe" : "";

function copy(src, base) {
  const dest = path.join(destDir, `${base}-${triple}${ext}`);
  if (!fs.existsSync(src)) {
    console.error(`${base} binary not found`, { src, triple });
    process.exit(1);
  }
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  if (plat !== "win32") {
    try { fs.chmodSync(dest, 0o755); } catch {}
  }
  console.log(`${base} binary copied`, { src, dest, triple });
}

const screenpipeSrc = path.join(repoRoot, "target", triple, "release", `screenpipe${ext}`);
copy(screenpipeSrc, "screenpipe");

const bunHome = process.env.BUN_INSTALL || path.join(os.homedir(), ".bun");
const bunSrc = path.join(bunHome, "bin", `bun${ext}`);
copy(bunSrc, "bun");
