const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

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

function copy(src, base, plain) {
  const dest = path.join(destDir, plain ? `${base}${ext}` : `${base}-${triple}${ext}`);
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
let bunSrc;
try {
  bunSrc = execSync(plat === "win32" ? "where bun" : "which bun").toString().trim();
} catch {}
if (!bunSrc) {
  const bunHome = process.env.BUN_INSTALL || path.join(os.homedir(), ".bun");
  bunSrc = path.join(bunHome, "bin", `bun${ext}`);
}
copy(bunSrc, "bun");
if (plat !== "win32") {
  try {
    const ffmpegSrc = execSync("which ffmpeg").toString().trim();
    copy(ffmpegSrc, "ffmpeg", true);
    const ffprobeSrc = execSync("which ffprobe").toString().trim();
    copy(ffprobeSrc, "ffprobe", true);
    const tesseractSrc = execSync("which tesseract").toString().trim();
    copy(tesseractSrc, "tesseract", true);
  } catch {}
}
if (plat === "win32") {
  const libs = [
    "onnxruntime.dll",
    "onnxruntime_providers_cuda.dll",
    "onnxruntime_providers_shared.dll"
  ];
  const srcDir = path.join(repoRoot, "target", triple, "release");
  const baseDest = path.join(root, "src-tauri", "onnxruntime-win-x64-gpu-1.22.0");
  const libDir = path.join(baseDest, "lib");
  fs.mkdirSync(srcDir, { recursive: true });
  const checkDll = path.join(libDir, "onnxruntime.dll");
  if (!fs.existsSync(checkDll)) {
    const url = "https://github.com/microsoft/onnxruntime/releases/download/v1.22.0/onnxruntime-win-x64-gpu-1.22.0.zip";
    const zip = path.join(repoRoot, "onnxruntime.zip");
    execSync(`curl -L ${url} -o "${zip}"`);

    fs.rmSync(baseDest, { recursive: true, force: true });
    fs.mkdirSync(baseDest, { recursive: true });
    execSync(`tar -xf "${zip}" -C "${baseDest}" --strip-components=1`);
    fs.unlinkSync(zip);
  }
  for (const lib of libs) {
    const srcLib = path.join(libDir, lib);
    if (!fs.existsSync(srcLib)) {
      console.error(`${lib} not found`, { srcLib });
      process.exit(1);
    }
    fs.copyFileSync(srcLib, path.join(srcDir, lib));
  }
}
