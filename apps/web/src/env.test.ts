import { describe, expect, it } from "vitest";

import { resolveAppMode } from "./env";

describe("env", () => {
  it("defaults to full mode outside VS Code", () => {
    expect(
      resolveAppMode({
        isVSCodeWebview: false,
        webviewConfig: null,
      }),
    ).toBe("full");
  });

  it("uses the injected VS Code mode when available", () => {
    expect(
      resolveAppMode({
        isVSCodeWebview: true,
        webviewConfig: {
          mode: "sidebar",
          threadId: null,
          draftContext: null,
          wsUrl: "ws://127.0.0.1:3773",
        },
      }),
    ).toBe("sidebar");
  });
});
