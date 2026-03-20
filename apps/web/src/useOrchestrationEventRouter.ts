import type { NativeApi, ServerConfigUpdatedPayload, WsWelcomePayload } from "@t3tools/contracts";
import { ThreadId } from "@t3tools/contracts";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Throttler } from "@tanstack/react-pacer";
import { useEffect } from "react";

import { clearPromotedDraftThreads, useComposerDraftStore } from "./composerDraftStore";
import { projectQueryKeys } from "./lib/projectReactQuery";
import { providerQueryKeys } from "./lib/providerReactQuery";
import { serverQueryKeys } from "./lib/serverReactQuery";
import { collectActiveTerminalThreadIds } from "./lib/terminalStateCleanup";
import { readNativeApi } from "./nativeApi";
import { useStore } from "./store";
import { terminalRunningSubprocessFromEvent } from "./terminalActivity";
import { useTerminalStateStore } from "./terminalStateStore";
import { onServerConfigUpdated, onServerWelcome } from "./wsNativeApi";

interface ServerConfigUpdatedContext {
  payload: ServerConfigUpdatedPayload;
  api: NativeApi;
  queryClient: QueryClient;
  subscribed: boolean;
}

export interface UseOrchestrationEventRouterOptions {
  onWelcome?: (payload: WsWelcomePayload) => Promise<void> | void;
  onServerConfigUpdated?: (context: ServerConfigUpdatedContext) => Promise<void> | void;
}

export function useOrchestrationEventRouter(options: UseOrchestrationEventRouterOptions = {}) {
  const { onServerConfigUpdated: onServerConfigUpdatedCallback, onWelcome } = options;
  const syncServerReadModel = useStore((store) => store.syncServerReadModel);
  const removeOrphanedTerminalStates = useTerminalStateStore(
    (store) => store.removeOrphanedTerminalStates,
  );
  const queryClient = useQueryClient();

  useEffect(() => {
    const api = readNativeApi();
    if (!api) {
      return;
    }

    let disposed = false;
    let latestSequence = 0;
    let syncing = false;
    let pending = false;
    let needsProviderInvalidation = false;

    const flushSnapshotSync = async (): Promise<void> => {
      const snapshot = await api.orchestration.getSnapshot();
      if (disposed) {
        return;
      }

      latestSequence = Math.max(latestSequence, snapshot.snapshotSequence);
      syncServerReadModel(snapshot);
      clearPromotedDraftThreads(new Set(snapshot.threads.map((thread) => thread.id)));

      const draftThreadIds = Object.keys(
        useComposerDraftStore.getState().draftThreadsByThreadId,
      ) as ThreadId[];
      const activeThreadIds = collectActiveTerminalThreadIds({
        snapshotThreads: snapshot.threads,
        draftThreadIds,
      });
      removeOrphanedTerminalStates(activeThreadIds);

      if (pending) {
        pending = false;
        await flushSnapshotSync();
      }
    };

    const syncSnapshot = async () => {
      if (syncing) {
        pending = true;
        return;
      }

      syncing = true;
      pending = false;

      try {
        await flushSnapshotSync();
      } catch {
        // Keep prior state and wait for the next event-driven sync.
      }

      syncing = false;
    };

    const domainEventFlushThrottler = new Throttler(
      () => {
        if (needsProviderInvalidation) {
          needsProviderInvalidation = false;
          void queryClient.invalidateQueries({ queryKey: providerQueryKeys.all });
          void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
        }

        void syncSnapshot();
      },
      {
        wait: 100,
        leading: false,
        trailing: true,
      },
    );

    const unsubDomainEvent = api.orchestration.onDomainEvent((event) => {
      if (event.sequence <= latestSequence) {
        return;
      }

      latestSequence = event.sequence;
      if (event.type === "thread.turn-diff-completed" || event.type === "thread.reverted") {
        needsProviderInvalidation = true;
      }
      domainEventFlushThrottler.maybeExecute();
    });

    const unsubTerminalEvent = api.terminal.onEvent((event) => {
      const hasRunningSubprocess = terminalRunningSubprocessFromEvent(event);
      if (hasRunningSubprocess === null) {
        return;
      }

      useTerminalStateStore
        .getState()
        .setTerminalActivity(
          ThreadId.makeUnsafe(event.threadId),
          event.terminalId,
          hasRunningSubprocess,
        );
    });

    const unsubWelcome = onServerWelcome((payload) => {
      void (async () => {
        await syncSnapshot();
        if (disposed) {
          return;
        }

        await onWelcome?.(payload);
      })().catch(() => undefined);
    });

    let subscribed = false;
    const unsubServerConfigUpdated = onServerConfigUpdated((payload) => {
      void queryClient.invalidateQueries({ queryKey: serverQueryKeys.config() });
      void Promise.resolve(
        onServerConfigUpdatedCallback?.({
          payload,
          api,
          queryClient,
          subscribed,
        }),
      ).catch(() => undefined);
    });
    subscribed = true;

    return () => {
      disposed = true;
      needsProviderInvalidation = false;
      domainEventFlushThrottler.cancel();
      unsubDomainEvent();
      unsubTerminalEvent();
      unsubWelcome();
      unsubServerConfigUpdated();
    };
  }, [
    onServerConfigUpdatedCallback,
    onWelcome,
    queryClient,
    removeOrphanedTerminalStates,
    syncServerReadModel,
  ]);
}
