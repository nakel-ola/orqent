import { describe, expect, it } from "vitest";

import {
  getThreadPanelEmptyStateCopy,
  isPanelMode,
  shouldRenderThreadSidebar,
  shouldRenderThreadSidebarTrigger,
} from "./shellMode";

describe("vscode shell mode helpers", () => {
  it("treats panel mode as a focused panel surface", () => {
    expect(isPanelMode("panel")).toBe(true);
    expect(shouldRenderThreadSidebar("panel")).toBe(false);
    expect(
      shouldRenderThreadSidebarTrigger({
        appMode: "panel",
        isElectron: false,
      }),
    ).toBe(false);
  });

  it("preserves the thread sidebar in the full app shell", () => {
    expect(isPanelMode("full")).toBe(false);
    expect(shouldRenderThreadSidebar("full")).toBe(true);
    expect(
      shouldRenderThreadSidebarTrigger({
        appMode: "full",
        isElectron: false,
      }),
    ).toBe(true);
  });

  it("suppresses the thread sidebar trigger in electron", () => {
    expect(
      shouldRenderThreadSidebarTrigger({
        appMode: "full",
        isElectron: true,
      }),
    ).toBe(false);
  });

  it("returns panel-specific empty-state guidance", () => {
    expect(getThreadPanelEmptyStateCopy("panel")).toEqual({
      title: "No active thread",
      description: "Open a thread from the T3 Code sidebar to get started.",
    });
  });
});
