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

function copy(src, base, plain, dir) {
  const targetDir = dir || destDir;
  const dest = path.join(targetDir, plain ? `${base}${ext}` : `${base}-${triple}${ext}`);
  if (!fs.existsSync(src)) {
    console.error(`${base} binary not found`, { src, triple });
    process.exit(1);
  }
  fs.mkdirSync(targetDir, { recursive: true });
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
    copy(ffmpegSrc, "ffmpeg");
    const ffprobeSrc = execSync("which ffprobe").toString().trim();
    copy(ffprobeSrc, "ffprobe");
    const tesseractSrc = execSync("which tesseract").toString().trim();
    copy(tesseractSrc, "tesseract", true, path.join(root, "src-tauri"));
  } catch {}
}
if (plat === "win32") {
  const libs = [
    "onnxruntime.dll",
    "onnxruntime_providers_cuda.dll",
    "onnxruntime_providers_shared.dll"
  ];
  const srcDir = path.join(repoRoot, "target", triple, "release");
  const pkgDir = path.join(root, "src-tauri", "onnxruntime-win-x64-gpu-1.22.0");
  fs.mkdirSync(srcDir, { recursive: true });
  let libDir = path.join(pkgDir, "lib");
  let checkDll = path.join(libDir, "onnxruntime.dll");
  if (!fs.existsSync(checkDll)) {
    const url = "https://github.com/microsoft/onnxruntime/releases/download/v1.22.0/onnxruntime-win-x64-gpu-1.22.0.zip";
    const zip = path.join(repoRoot, "onnxruntime.zip");
    execSync(`curl -L ${url} -o "${zip}"`);
    fs.rmSync(pkgDir, { recursive: true, force: true });
    fs.mkdirSync(pkgDir, { recursive: true });
    try {
      execSync(`tar -xf "${zip}" -C "${pkgDir}" --strip-components=1`);
    } catch {
      execSync(`tar -xf "${zip}" -C "${pkgDir}"`);
    }
    fs.unlinkSync(zip);
    checkDll = path.join(libDir, "onnxruntime.dll");
  }
  if (!fs.existsSync(checkDll)) {
    const alt = path.join(pkgDir, "onnxruntime-win-x64-gpu-1.22.0", "lib");
    if (fs.existsSync(path.join(alt, "onnxruntime.dll"))) {
      libDir = alt;
    } else {
      console.error("onnxruntime.dll not found", { libDir });
      process.exit(1);
    }
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
