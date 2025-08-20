#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export SCREENPIPE_PLATFORM=win32
export SCREENPIPE_TARGET_TRIPLE=x86_64-pc-windows-msvc
mkdir -p ../target/x86_64-pc-windows-msvc/release
touch ../target/x86_64-pc-windows-msvc/release/screenpipe.exe
node ./scripts/pre_build.cjs
for lib in onnxruntime.dll onnxruntime_providers_cuda.dll onnxruntime_providers_shared.dll; do
  test -f "../target/x86_64-pc-windows-msvc/release/$lib"
done
