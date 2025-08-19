import { existsSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";
import os from "os";

const root = process.cwd();
const destDir = join(root, "src-tauri", "bin");

const isWin = process.platform === "win32";
const isLinux = process.platform === "linux";
const isMac = process.platform === "darwin";

const exe = isWin ? "screenpipe.exe" : "screenpipe";

const candidates = [
  join(root, "..", "target", isWin ? "x86_64-pc-windows-msvc" : isLinux ? "x86_64-unknown-linux-gnu" : "aarch64-apple-darwin", "release", exe),
  join(root, "..", "target", "release", exe)
];

const src = candidates.find(p => existsSync(p));
if (!src) {
  console.error("screenpipe binary not found", { candidates });
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

const dest = join(destDir, isWin ? "screenpipe-x86_64-pc-windows-msvc.exe" : isLinux ? "screenpipe-x86_64-unknown-linux-gnu" : "screenpipe-aarch64-apple-darwin");
copyFileSync(src, dest);

if (isWin) {
  const ortCandidates = [
    join(root, "..", "target", "x86_64-pc-windows-msvc", "release", "onnxruntime.dll"),
    join(root, "src-tauri", "onnxruntime-win-x64-gpu-1.19.2", "lib", "onnxruntime.dll")
  ];
  const ortSrc = ortCandidates.find(p => existsSync(p));
  if (ortSrc) {
    const ortDest = join(destDir, "onnxruntime.dll");
    copyFileSync(ortSrc, ortDest);
    console.log("onnxruntime dll copied", { src: ortSrc, dest: ortDest });
  }
}

console.log("screenpipe binary copied", { src, dest, platform: os.platform() });
