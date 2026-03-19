import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { StoreProvider } from "~/store";
import { useOrchestrationEventRouter } from "~/useOrchestrationEventRouter";
import { VscodeSidebar } from "./VscodeSidebar";

const queryClient = new QueryClient();

function SidebarEventRouter() {
  useOrchestrationEventRouter();
  return null;
}

function SidebarAppInner() {
  return (
    <>
      <SidebarEventRouter />
      <VscodeSidebar />
    </>
  );
}

export function SidebarApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <SidebarAppInner />
      </StoreProvider>
    </QueryClientProvider>
  );
}
