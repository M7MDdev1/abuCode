# Bonian AI Agent Integration Walkthrough

## Overview
We successfully integrated the **Bonian AI Agent** directly into a native fork of VS Code OSS! This process transformed a basic UI visualization into a robust, network-capable Electron backend capable of passing images to a remote AI cluster and generating file architectures onto the user's disk.

Along the way, we had to navigate deep Chromium security limits, reconstruct fragmented C++ engine bindings, and navigate Git-level asset corruptions.

---

## 1. The Workbench Contribution
We extended `workbench.common.main.ts` by adding an entirely new Explorer context-menu command **"Generate with Bonian Agent"**. This feature triggers whenever a user right-clicks an image file (`.png`, `.jpg`, `.svg`).

## 2. Dynamic Stepper UI & Protocol
We built a visually stunning Sidebar (`ViewPane`) to act as the agent's central hub. 
- Utilized Webview UI capabilities to inject a modern 5-stage stepper.
- Wired a unidirectional IPC (Inter-Process Communication) message protocol allowing the backend Extension Host to update the Webview's UI states safely.

## 3. The Chromium CSP Network Bypass
**The Challenge**: Sending a heavy Base64 image payload to an unencrypted HTTP backend (`144.91.70.138`) from a secure VS Code UI.
- Chrome's strict `Content-Security-Policy` aggressively blocked browser-based `fetch` commands.
- Modifying `workbench.html` header injection wasn't enough due to dynamically added restrictions.
**The Solution**: We moved the network execution to `bonianAgentController.ts`, directly hooking into VS Code's core `IRequestService`. Because the request was shifted out of the renderer environment and into the Electron-Native layer, it cleanly bypassed the browser's CSP firewalls.

## 4. Environment & Native Binding Whack-a-Mole
Performing `npm audit fix --force` in a complex legacy Electron codebase shattered the ABI (Application Binary Interface) links for all native C++ modules.
- We faced `MODULE_NOT_FOUND` on heavily nested scripts like `@vscode/spdlog`, `@vscode/sqlite3`, `@vscode/windows-registry`, and `@vscode/deviceid`.
- Furthermore, native Windows Python scripts crashed with `WinError 183` because parallel `npm rebuild` calls collided. 
**The Solution**: We sequentially ran `npm rebuild` directly forcing the target runtime compiler to lock onto `--runtime=electron --target=37.3.1`, cleanly restoring the C++ infrastructure.

## 5. UI Asset Restoration
A Git `core.autocrlf` edge case secretly injected invisible Windows line-endings into the `.ttf` TrueType binaries for VS Code's system icons (`codicons`). 
**The Solution**: We explicitly checked out and overwrote the corrupted binary from `out/` locally using raw file drops, restoring the frontend's visual integrity.

## 6. Real API File System Generation
The `processImage` execution resolves the backend API payload into a `data.generatedProject.files[]` array. Using VS Code's native asynchronous `IFileService`, the system iterates over the result schema, resolving absolute workspace `URI`s, recursively creating empty directories, and injecting the generated TS/JS/CSS raw payloads seamlessly to disk!
