import { describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

vi.mock("vscode", () => ({
  Uri: {
    joinPath: (...parts: Array<{ fsPath?: string } | string>) => ({
      fsPath: parts
        .map((part) => (typeof part === "string" ? part : (part.fsPath ?? "")))
        .join("/"),
    }),
  },
}));

import { readFileSync } from "node:fs";
import { getWebviewContent, injectWebviewBootstrap, rewriteAssetUrls } from "./webviewHtml";

describe("webviewHtml", () => {
  it("rewrites root-relative asset urls", () => {
    expect(
      rewriteAssetUrls(
        '<link href="/assets/app.css"><script src="/assets/app.js"></script>',
        (assetPath) => `vscode-resource:${assetPath}`,
      ),
    ).toContain('href="vscode-resource:/assets/app.css"');
  });

  it("injects CSP and bootstrap config", () => {
    const html = injectWebviewBootstrap("<html><head></head><body></body></html>", {
      nonce: "nonce-123",
      cspSource: "vscode-webview://test",
      config: {
        mode: "sidebar",
        threadId: null,
        draftContext: null,
        wsUrl: "ws://127.0.0.1:3773",
      },
    });

    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("window.__ORQENT_WEBVIEW_CONFIG__=");
    expect(html).toContain("nonce-123");
  });

  it("loads the vscode-specific html entry when present", () => {
    const mockedReadFileSync = vi.mocked(readFileSync);
    mockedReadFileSync.mockImplementation((path) => {
      if (String(path).endsWith("index.vscode.html")) {
        return '<html><head></head><body><script src="/assets/app.js"></script></body></html>';
      }
      throw new Error("missing file");
    });

    const html = getWebviewContent(
      {
        cspSource: "vscode-webview://test",
        asWebviewUri: (uri: { fsPath: string }) => ({
          toString: () => `vscode-resource:${uri.fsPath}`,
        }),
      } as never,
      { fsPath: "/extension" } as never,
      {
        mode: "sidebar",
        threadId: null,
        draftContext: null,
        wsUrl: "ws://127.0.0.1:3773",
      },
    );

    expect(mockedReadFileSync).toHaveBeenCalledWith(
      "/extension/dist-webview/index.vscode.html",
      "utf8",
    );
    expect(html).toContain("vscode-resource:/extension/dist-webview/assets/app.js");
  });
});
