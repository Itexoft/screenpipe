# Agent Instructions

This repository contains multiple Node.js "pipes" alongside Rust projects. Dependency installation has previously failed because:

1. **`pipes/reddit-auto-posts`** – `package-lock.json` is outdated. `npm ci` refuses to install when lock file and `package.json` differ.
2. **`pipes/obsidian`** – `cmdk@1.0.0` requires React 18, but the project uses React 19, leading to a peer dependency conflict.

To install dependencies without repeated failures:

- Before running `npm ci`, ensure `package-lock.json` matches `package.json`. If dependencies change, run `npm install` once to regenerate the lock file.
- Resolve peer dependency conflicts. For the Obsidian pipe, upgrade `cmdk` to a React 19-compatible version or run `npm install --legacy-peer-deps` if upgrading is not feasible.
- After updating lock files and resolving peer conflicts, run `npm ci` in each pipe once.

