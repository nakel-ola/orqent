import type { T3CodeWebviewConfig, T3CodeWebviewMode } from "@t3tools/contracts";

export type AppMode = T3CodeWebviewMode;

export function readWebviewConfig(): T3CodeWebviewConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.__ORQENT_WEBVIEW_CONFIG__ ?? null;
}

export function resolveAppMode(input: {
  isVSCodeWebview: boolean;
  webviewConfig: T3CodeWebviewConfig | null;
}): AppMode {
  if (!input.isVSCodeWebview) {
    return "full";
  }

  return input.webviewConfig?.mode ?? "full";
}

export const isVSCodeWebview = import.meta.env.VITE_IS_VSCODE_WEBVIEW === "true";
export const webviewConfig = readWebviewConfig();
export const appMode = resolveAppMode({
  isVSCodeWebview,
  webviewConfig,
});

/**
 * True when running inside the Electron preload bridge. VS Code also injects
 * `window.desktopBridge`, so it must be excluded explicitly.
 */
export const isElectron =
  typeof window !== "undefined" && !isVSCodeWebview && window.desktopBridge !== undefined;
