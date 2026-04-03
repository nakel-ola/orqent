import { createFileRoute } from "@tanstack/react-router";

import { appMode, isElectron } from "../env";
import { SidebarTrigger } from "../components/ui/sidebar";
import {
  getThreadPanelEmptyStateCopy,
  isPanelMode,
  shouldRenderThreadSidebarTrigger,
} from "../shellMode";

function ChatIndexRouteView() {
  const emptyStateCopy = getThreadPanelEmptyStateCopy(appMode);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background text-muted-foreground/40">
      {shouldRenderThreadSidebarTrigger({ appMode, isElectron }) && (
        <header className="border-b border-border px-3 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-7 shrink-0" />
            <span className="text-sm font-medium text-foreground">Threads</span>
          </div>
        </header>
      )}

      {isElectron && (
        <div className="drag-region flex h-[52px] shrink-0 items-center border-b border-border px-5">
          <span className="text-xs text-muted-foreground/50">No active thread</span>
        </div>
      )}

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          {isPanelMode(appMode) && (
            <p className="text-sm font-medium text-foreground">{emptyStateCopy.title}</p>
          )}
          <p className="mt-1 text-sm">{emptyStateCopy.description}</p>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_chat/")({
  component: ChatIndexRouteView,
});
