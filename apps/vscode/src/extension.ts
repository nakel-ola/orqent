import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import * as path from "node:path";
import * as vscode from "vscode";

import { registerCommands } from "./commands/index.js";
import { ChatPanelManager } from "./providers/webview/chatPanelManager.js";
import { MainViewProvider } from "./providers/webview/mainViewProvider.js";

let outputChannel: vscode.OutputChannel | undefined;
let serverProcess: ChildProcess | undefined;
let chatPanelManager: ChatPanelManager | undefined;

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on("error", reject);
  });
}

function findNodeBinary(): string {
  const shell = process.env.SHELL ?? "/bin/sh";
  try {
    const result = execFileSync(shell, ["-lc", "which node"], {
      encoding: "utf8",
      timeout: 5_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (result) {
      return result;
    }
  } catch {
    // Fall through to common system locations.
  }

  for (const candidate of ["/usr/local/bin/node", "/opt/homebrew/bin/node", "/usr/bin/node"]) {
    try {
      execFileSync(candidate, ["--version"], {
        stdio: "ignore",
        timeout: 2_000,
      });
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }

  return process.execPath;
}

function killServerProcess(): void {
  serverProcess?.kill();
  serverProcess = undefined;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  outputChannel = vscode.window.createOutputChannel("T3 Code Server");
  context.subscriptions.push(outputChannel, { dispose: () => killServerProcess() });

  await vscode.workspace.fs.createDirectory(context.globalStorageUri);

  const port = await findFreePort();
  const wsUrl = `ws://127.0.0.1:${port}`;
  const nodeBinary = findNodeBinary();
  const serverEntry = path.join(context.extensionPath, "dist-server", "index.mjs");

  outputChannel.appendLine(`[t3code] node: ${nodeBinary}`);
  outputChannel.appendLine(`[t3code] server: ${serverEntry}`);
  outputChannel.appendLine(`[t3code] ws: ${wsUrl}`);

  serverProcess = spawn(nodeBinary, [serverEntry], {
    env: {
      ...process.env,
      T3CODE_PORT: String(port),
      T3CODE_MODE: "desktop",
      T3CODE_NO_BROWSER: "1",
      T3CODE_STATE_DIR: context.globalStorageUri.fsPath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (chunk: Buffer) => {
    outputChannel?.append(chunk.toString());
  });
  serverProcess.stderr?.on("data", (chunk: Buffer) => {
    outputChannel?.append(chunk.toString());
  });
  serverProcess.on("error", (error) => {
    outputChannel?.appendLine(`[t3code] server error: ${error.message}`);
  });
  serverProcess.on("exit", (code, signal) => {
    outputChannel?.appendLine(`[t3code] server exited (code=${code}, signal=${signal})`);
  });

  chatPanelManager = new ChatPanelManager(context, wsUrl);
  const mainViewProvider = new MainViewProvider(context, chatPanelManager, wsUrl);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MainViewProvider.viewId, mainViewProvider),
    ...registerCommands(mainViewProvider),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      mainViewProvider.postMessage({
        type: "workspaceFolders",
        folders: (vscode.workspace.workspaceFolders ?? []).map((folder) => ({
          path: folder.uri.fsPath,
          name: folder.name,
        })),
      });
    }),
    {
      dispose: () => {
        chatPanelManager?.dispose();
      },
    },
  );
}

export function deactivate(): void {
  killServerProcess();
  chatPanelManager?.dispose();
  chatPanelManager = undefined;
  outputChannel?.dispose();
  outputChannel = undefined;
}
