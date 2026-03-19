import { ThreadId } from "@t3tools/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createWebviewPanel = vi.fn();

vi.mock("vscode", () => ({
  Uri: {
    joinPath: (...parts: Array<{ fsPath?: string } | string>) => ({
      fsPath: parts
        .map((part) => (typeof part === "string" ? part : (part.fsPath ?? "")))
        .join("/"),
    }),
  },
  ViewColumn: {
    Active: 1,
  },
  window: {
    createWebviewPanel,
  },
}));

vi.mock("../../utils/webviewHtml.js", () => ({
  getWebviewContent: () => "<html></html>",
}));

describe("chatPanelManager", () => {
  beforeEach(() => {
    createWebviewPanel.mockReset();
  });

  function createPanel() {
    let disposeListener: (() => void) | undefined;
    let messageListener: ((message: unknown) => void) | undefined;
    return {
      title: "",
      reveal: vi.fn(),
      dispose: vi.fn(() => {
        disposeListener?.();
      }),
      onDidDispose: vi.fn((listener: () => void) => {
        disposeListener = listener;
      }),
      webview: {
        html: "",
        postMessage: vi.fn(),
        onDidReceiveMessage: vi.fn((listener: (message: unknown) => void) => {
          messageListener = listener;
        }),
      },
      triggerMessage(message: unknown) {
        messageListener?.(message);
      },
    };
  }

  it("keeps one panel per thread and focuses existing panels", async () => {
    const panel = createPanel();
    createWebviewPanel.mockReturnValue(panel);
    const { ChatPanelManager } = await import("./chatPanelManager");

    const manager = new ChatPanelManager(
      {
        extensionUri: { fsPath: "/extension" },
        subscriptions: [],
      } as never,
      "ws://127.0.0.1:3773",
    );

    manager.openThread({
      threadId: ThreadId.makeUnsafe("thread-1"),
      title: "Thread",
      projectName: "Repo",
      draftContext: null,
    });
    manager.openThread({
      threadId: ThreadId.makeUnsafe("thread-1"),
      title: "Thread",
      projectName: "Repo",
      draftContext: null,
    });

    expect(createWebviewPanel).toHaveBeenCalledTimes(1);
    expect(panel.reveal).toHaveBeenCalledWith(1);
  });

  it("updates panel titles from webview messages", async () => {
    const panel = createPanel();
    createWebviewPanel.mockReturnValue(panel);
    const { ChatPanelManager } = await import("./chatPanelManager");

    const manager = new ChatPanelManager(
      {
        extensionUri: { fsPath: "/extension" },
        subscriptions: [],
      } as never,
      "ws://127.0.0.1:3773",
    );

    manager.openThread({
      threadId: ThreadId.makeUnsafe("thread-1"),
      title: "Thread",
      projectName: "Repo",
      draftContext: null,
    });

    panel.triggerMessage({
      requestId: "1",
      type: "updatePanelTitle",
      payload: {
        title: "Renamed Thread",
        projectName: "Repo",
      },
    });

    expect(panel.title).toBe("Orqent - Renamed Thread");
    expect(panel.webview.postMessage).toHaveBeenCalledWith({
      requestId: "1",
      result: undefined,
    });
  });
});
