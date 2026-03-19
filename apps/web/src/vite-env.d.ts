/// <reference types="vite/client" />

import type { DesktopBridge, NativeApi, T3CodeWebviewConfig } from "@t3tools/contracts";

interface ImportMetaEnv {
  readonly APP_VERSION: string;
  readonly VITE_IS_VSCODE_WEBVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    nativeApi?: NativeApi;
    desktopBridge?: DesktopBridge;
    __ORQENT_WEBVIEW_CONFIG__?: T3CodeWebviewConfig;
  }
}
