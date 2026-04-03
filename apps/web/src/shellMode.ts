import type { AppMode } from "./env";

export function isPanelMode(appMode: AppMode): boolean {
  return appMode === "panel";
}

export function shouldRenderThreadSidebar(appMode: AppMode): boolean {
  return appMode === "full";
}

export function shouldRenderThreadSidebarTrigger(input: {
  appMode: AppMode;
  isElectron: boolean;
}): boolean {
  return !input.isElectron && !isPanelMode(input.appMode);
}

export function getThreadPanelEmptyStateCopy(appMode: AppMode): {
  title: string;
  description: string;
} {
  if (isPanelMode(appMode)) {
    return {
      title: "No active thread",
      description: "Open a thread from the Orqent sidebar to get started.",
    };
  }

  return {
    title: "No active thread",
    description: "Select a thread or create a new one to get started.",
  };
}
