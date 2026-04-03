import type {
  DesktopBridge,
  DesktopUpdateState,
  T3CodeWebviewConfig,
  WorkspaceFolderEntry,
} from "@t3tools/contracts";

declare function acquireVsCodeApi():
  | {
      postMessage(message: unknown): void;
      getState<T>(): T | undefined;
      setState<T>(state: T): void;
    }
  | undefined;

type BridgeReply = {
  requestId: string;
  result: unknown;
  error?: string;
};

type BridgeRequest = {
  requestId: string;
  type: string;
  payload?: unknown;
};

type BridgeHostMessage =
  | {
      type: "init";
      wsUrl: string;
      workspaceFolders: WorkspaceFolderEntry[];
    }
  | {
      type: "workspaceFolders";
      folders: WorkspaceFolderEntry[];
    }
  | {
      type: "menuAction";
      action: string;
    };

const disabledUpdateState: DesktopUpdateState = {
  enabled: false,
  status: "disabled",
  currentVersion: "0.0.0",
  hostArch: "other",
  appArch: "other",
  runningUnderArm64Translation: false,
  availableVersion: null,
  downloadedVersion: null,
  downloadPercent: null,
  checkedAt: null,
  message: null,
  errorContext: null,
  canRetry: false,
};

const webviewConfig =
  typeof window === "undefined"
    ? null
    : ((window as Window & { __ORQENT_WEBVIEW_CONFIG__?: T3CodeWebviewConfig })
        .__ORQENT_WEBVIEW_CONFIG__ ?? null);

let workspaceFolders: WorkspaceFolderEntry[] = [];
const workspaceFolderListeners = new Set<(folders: WorkspaceFolderEntry[]) => void>();
let bridgeCallRef: ((type: string, payload?: unknown) => Promise<unknown>) | null = null;

function setWorkspaceFolders(nextFolders: WorkspaceFolderEntry[]): void {
  workspaceFolders = nextFolders;
  for (const listener of workspaceFolderListeners) {
    listener(nextFolders);
  }
}

export function getWorkspaceFolders(): WorkspaceFolderEntry[] {
  return workspaceFolders;
}

export function onWorkspaceFolders(
  listener: (folders: WorkspaceFolderEntry[]) => void,
): () => void {
  workspaceFolderListeners.add(listener);
  listener(workspaceFolders);
  return () => {
    workspaceFolderListeners.delete(listener);
  };
}

function createFallbackBridge(): DesktopBridge {
  return {
    getWsUrl: () => webviewConfig?.wsUrl ?? import.meta.env.VITE_WS_URL ?? null,
    pickFolder: async () => null,
    confirm: async (message) => window.confirm(message),
    setTheme: async () => {},
    showContextMenu: async () => null,
    openExternal: async (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
      return true;
    },
    onMenuAction: () => () => {},
    getUpdateState: async () => disabledUpdateState,
    checkForUpdate: async () => ({ checked: false, state: disabledUpdateState }),
    downloadUpdate: async () => ({
      accepted: false,
      completed: false,
      state: disabledUpdateState,
    }),
    installUpdate: async () => ({
      accepted: false,
      completed: false,
      state: disabledUpdateState,
    }),
    onUpdateState: () => () => {},
    openThread: async () => {},
    updatePanelTitle: async () => {},
    openInEditor: async () => {},
  };
}

function createVsCodeBridge(): DesktopBridge {
  const vscodeApi = acquireVsCodeApi();
  if (!vscodeApi) {
    return createFallbackBridge();
  }

  const pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  const menuActionListeners = new Set<(action: string) => void>();
  let requestCounter = 0;
  let wsUrl = webviewConfig?.wsUrl ?? null;

  window.addEventListener("message", (event) => {
    const data = event.data as BridgeReply | BridgeHostMessage | undefined;
    if (!data || typeof data !== "object") {
      return;
    }

    if ("requestId" in data) {
      const pendingRequest = pendingRequests.get(data.requestId);
      if (!pendingRequest) {
        return;
      }

      pendingRequests.delete(data.requestId);
      if (data.error) {
        pendingRequest.reject(new Error(data.error));
        return;
      }

      pendingRequest.resolve(data.result);
      return;
    }

    if (data.type === "menuAction") {
      for (const listener of menuActionListeners) {
        listener(data.action);
      }
      return;
    }

    if (data.type === "init") {
      wsUrl = data.wsUrl;
      setWorkspaceFolders(data.workspaceFolders);
      return;
    }

    if (data.type === "workspaceFolders") {
      setWorkspaceFolders(data.folders);
    }
  });

  const call = <T>(type: string, payload?: unknown): Promise<T> => {
    const requestId = `bridge-${++requestCounter}`;
    return new Promise<T>((resolve, reject) => {
      pendingRequests.set(requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      const request: BridgeRequest = { requestId, type, payload };
      vscodeApi.postMessage(request);
    });
  };

  bridgeCallRef = call as (type: string, payload?: unknown) => Promise<unknown>;

  return {
    getWsUrl: () => wsUrl,
    pickFolder: () => call<string | null>("pickFolder"),
    confirm: (message) => call<boolean>("confirm", { message }),
    setTheme: (theme) => call<void>("setTheme", { theme }),
    showContextMenu: (items, position) => call("showContextMenu", { items, position }),
    openExternal: (url) => call<boolean>("openExternal", { url }),
    onMenuAction: (listener) => {
      menuActionListeners.add(listener);
      return () => {
        menuActionListeners.delete(listener);
      };
    },
    getUpdateState: async () => disabledUpdateState,
    checkForUpdate: async () => ({ checked: false, state: disabledUpdateState }),
    downloadUpdate: async () => ({
      accepted: false,
      completed: false,
      state: disabledUpdateState,
    }),
    installUpdate: async () => ({
      accepted: false,
      completed: false,
      state: disabledUpdateState,
    }),
    onUpdateState: () => () => {},
    openThread: (payload) => call<void>("openThread", payload),
    updatePanelTitle: (title, projectName) =>
      call<void>("updatePanelTitle", { title, projectName }),
    openInEditor: (path, editor) => call<void>("openInEditor", { path, editor }),
  };
}

export function reloadWindow(): Promise<void> {
  if (bridgeCallRef) {
    return bridgeCallRef("reloadWindow") as Promise<void>;
  }
  window.location.reload();
  return Promise.resolve();
}

export function openSettings(): Promise<void> {
  if (bridgeCallRef) {
    return bridgeCallRef("openSettings") as Promise<void>;
  }
  return Promise.resolve();
}

if (typeof window !== "undefined") {
  window.desktopBridge = createVsCodeBridge();
}
