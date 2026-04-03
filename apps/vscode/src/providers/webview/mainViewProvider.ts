import * as vscode from "vscode";
import type { DesktopOpenThreadPayload, WorkspaceFolderEntry } from "@t3tools/contracts";

import { getWebviewContent } from "../../utils/webviewHtml.js";
import { handleCommonBridgeRequest } from "./bridgeHandler.js";
import { ChatPanelManager } from "./chatPanelManager.js";

type BridgeRequest = {
  requestId: string;
  type: string;
  payload?: unknown;
};

function getWorkspaceFolders(): WorkspaceFolderEntry[] {
  return (vscode.workspace.workspaceFolders ?? []).map((folder) => ({
    path: folder.uri.fsPath,
    name: folder.name,
  }));
}

export class MainViewProvider implements vscode.WebviewViewProvider {
  static readonly viewId = "orqent.mainView";

  private view: vscode.WebviewView | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly chatPanelManager: ChatPanelManager,
    private readonly wsUrl: string,
  ) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist-webview")],
    };
    view.webview.html = getWebviewContent(view.webview, this.context.extensionUri, {
      mode: "sidebar",
      threadId: null,
      draftContext: null,
      wsUrl: this.wsUrl,
    });

    view.onDidChangeVisibility(() => {
      if (view.visible) {
        void this.sendInit();
      }
    });
    void this.sendInit();

    view.webview.onDidReceiveMessage(
      (message: BridgeRequest) => {
        void this.handleBridgeRequest(message);
      },
      undefined,
      this.context.subscriptions,
    );
  }

  postMessage(message: unknown): void {
    void this.view?.webview.postMessage(message);
  }

  async sendInit(): Promise<void> {
    this.postMessage({
      type: "init",
      wsUrl: this.wsUrl,
      workspaceFolders: getWorkspaceFolders(),
    });
  }

  private async handleBridgeRequest(message: BridgeRequest): Promise<void> {
    if (message.type === "openThread") {
      this.chatPanelManager.openThread(message.payload as DesktopOpenThreadPayload);
      this.postMessage({
        requestId: message.requestId,
        result: undefined,
      });
      return;
    }

    if (message.type === "openSettings") {
      this.chatPanelManager.openSettingsPanel();
      this.postMessage({
        requestId: message.requestId,
        result: undefined,
      });
      return;
    }

    await handleCommonBridgeRequest(
      {
        postMessage: (payload) => this.view?.webview.postMessage(payload) ?? false,
      },
      message,
    );
  }
}
