import * as vscode from "vscode";
import type { DesktopOpenThreadPayload } from "@t3tools/contracts";

import { getWebviewContent } from "../../utils/webviewHtml.js";
import { handleCommonBridgeRequest } from "./bridgeHandler.js";

export function getChatPanelTitle(title: string, projectName: string): string {
  if (title.trim().length > 0) {
    return `Orqent - ${title}`;
  }
  if (projectName.trim().length > 0) {
    return `Orqent - ${projectName}`;
  }
  return "Orqent - New Thread";
}

export class ChatPanelManager {
  private readonly panelsByThreadId = new Map<string, vscode.WebviewPanel>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly wsUrl: string,
  ) {}

  openThread(payload: DesktopOpenThreadPayload): void {
    const existingPanel = this.panelsByThreadId.get(payload.threadId);
    if (existingPanel) {
      existingPanel.reveal(vscode.ViewColumn.Active);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "orqent.chatPanel",
      getChatPanelTitle(payload.title, payload.projectName),
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist-webview")],
      },
    );

    panel.iconPath = {
      light: vscode.Uri.joinPath(this.context.extensionUri, "assets", "logo-light.svg"),
      dark: vscode.Uri.joinPath(this.context.extensionUri, "assets", "logo-dark.svg"),
    };
    panel.webview.html = getWebviewContent(panel.webview, this.context.extensionUri, {
      mode: "panel",
      threadId: payload.threadId,
      draftContext: payload.draftContext,
      wsUrl: this.wsUrl,
    });

    this.panelsByThreadId.set(payload.threadId, panel);

    panel.webview.onDidReceiveMessage(
      (message: { requestId: string; type: string; payload?: unknown }) => {
        if (message.type === "updatePanelTitle") {
          const payload = message.payload as { title: string; projectName: string };
          panel.title = getChatPanelTitle(payload.title, payload.projectName);
          void panel.webview.postMessage({
            requestId: message.requestId,
            result: undefined,
          });
          return;
        }

        void handleCommonBridgeRequest(panel.webview, message);
      },
      undefined,
      this.context.subscriptions,
    );

    panel.onDidDispose(
      () => {
        this.panelsByThreadId.delete(payload.threadId);
      },
      undefined,
      this.context.subscriptions,
    );
  }

  openSettingsPanel(): void {
    const existing = this.panelsByThreadId.get("__settings__");
    if (existing) {
      existing.reveal(vscode.ViewColumn.Active);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "orqent.settingsPanel",
      "Orqent - Settings",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist-webview")],
      },
    );

    panel.iconPath = {
      light: vscode.Uri.joinPath(this.context.extensionUri, "assets", "logo-light.svg"),
      dark: vscode.Uri.joinPath(this.context.extensionUri, "assets", "logo-dark.svg"),
    };
    panel.webview.html = getWebviewContent(panel.webview, this.context.extensionUri, {
      mode: "panel",
      threadId: null,
      draftContext: null,
      initialPath: "/settings",
      wsUrl: this.wsUrl,
    });

    this.panelsByThreadId.set("__settings__", panel);

    panel.webview.onDidReceiveMessage(
      (message: { requestId: string; type: string; payload?: unknown }) => {
        void handleCommonBridgeRequest(panel.webview, message);
      },
      undefined,
      this.context.subscriptions,
    );

    panel.onDidDispose(
      () => {
        this.panelsByThreadId.delete("__settings__");
      },
      undefined,
      this.context.subscriptions,
    );
  }

  dispose(): void {
    for (const panel of this.panelsByThreadId.values()) {
      panel.dispose();
    }
    this.panelsByThreadId.clear();
  }
}
