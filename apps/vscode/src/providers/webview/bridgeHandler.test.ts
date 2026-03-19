import { beforeEach, describe, expect, it, vi } from "vitest";

const showOpenDialog = vi.fn();
const showInformationMessage = vi.fn();
const openExternal = vi.fn();
const openTextDocument = vi.fn();
const showTextDocument = vi.fn();
const executeCommand = vi.fn();
const stat = vi.fn();

vi.mock("vscode", () => ({
  FileType: {
    Directory: 2,
  },
  Range: class MockRange {
    constructor(
      public startLine: number,
      public startCharacter: number,
      public endLine: number,
      public endCharacter: number,
    ) {}
  },
  Uri: {
    parse: (value: string) => ({ value }),
    file: (fsPath: string) => ({ fsPath }),
  },
  ViewColumn: {
    Active: 1,
  },
  commands: {
    executeCommand,
  },
  env: {
    openExternal,
  },
  window: {
    showOpenDialog,
    showInformationMessage,
    showTextDocument,
  },
  workspace: {
    fs: {
      stat,
    },
    openTextDocument,
  },
}));

describe("bridgeHandler", () => {
  beforeEach(() => {
    showOpenDialog.mockReset();
    showInformationMessage.mockReset();
    openExternal.mockReset();
    openTextDocument.mockReset();
    showTextDocument.mockReset();
    executeCommand.mockReset();
    stat.mockReset();
  });

  it("handles folder picking", async () => {
    showOpenDialog.mockResolvedValue([{ fsPath: "/tmp/repo" }]);
    const { handleCommonBridgeRequest } = await import("./bridgeHandler");
    const postMessage = vi.fn();

    await handleCommonBridgeRequest(
      { postMessage },
      {
        requestId: "1",
        type: "pickFolder",
      },
    );

    expect(postMessage).toHaveBeenCalledWith({
      requestId: "1",
      result: "/tmp/repo",
      error: undefined,
    });
  });

  it("handles confirm dialogs", async () => {
    showInformationMessage.mockResolvedValue("OK");
    const { handleCommonBridgeRequest } = await import("./bridgeHandler");
    const postMessage = vi.fn();

    await handleCommonBridgeRequest(
      { postMessage },
      {
        requestId: "2",
        type: "confirm",
        payload: { message: "Continue?" },
      },
    );

    expect(postMessage).toHaveBeenCalledWith({
      requestId: "2",
      result: true,
      error: undefined,
    });
  });

  it("opens external urls", async () => {
    const { handleCommonBridgeRequest } = await import("./bridgeHandler");
    const postMessage = vi.fn();

    await handleCommonBridgeRequest(
      { postMessage },
      {
        requestId: "3",
        type: "openExternal",
        payload: { url: "https://example.com" },
      },
    );

    expect(openExternal).toHaveBeenCalledWith({ value: "https://example.com" });
    expect(postMessage).toHaveBeenCalledWith({
      requestId: "3",
      result: true,
      error: undefined,
    });
  });

  it("parses file locations for openInEditor", async () => {
    stat.mockRejectedValue(new Error("missing"));
    openTextDocument.mockResolvedValue({ uri: { fsPath: "/tmp/file.ts" } });
    const { handleCommonBridgeRequest, parseOpenInEditorPath } = await import("./bridgeHandler");

    expect(parseOpenInEditorPath("/tmp/file.ts:12:4")).toEqual({
      path: "/tmp/file.ts",
      line: 11,
      column: 3,
    });

    await handleCommonBridgeRequest(
      { postMessage: vi.fn() },
      {
        requestId: "4",
        type: "openInEditor",
        payload: { path: "/tmp/file.ts:12:4", editor: "vscode" },
      },
    );

    expect(openTextDocument).toHaveBeenCalledWith({ fsPath: "/tmp/file.ts" });
    expect(showTextDocument).toHaveBeenCalled();
  });
});
