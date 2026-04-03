import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppAtomRegistryProvider } from "~/rpc/atomRegistry";
import { ServerStateBootstrap } from "~/rpc/serverStateBootstrap";
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
      <ServerStateBootstrap />
      <SidebarEventRouter />
      <VscodeSidebar />
    </>
  );
}

export function SidebarApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppAtomRegistryProvider>
        <SidebarAppInner />
      </AppAtomRegistryProvider>
    </QueryClientProvider>
  );
}
