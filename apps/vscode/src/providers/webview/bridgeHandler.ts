import * as vscode from "vscode";

type BridgeRequest = {
  requestId: string;
  type: string;
  payload?: unknown;
};

export function parseOpenInEditorPath(pathWithLocation: string) {
  const locationMatch = /:(\d+)(?::(\d+))?$/.exec(pathWithLocation);
  if (!locationMatch) {
    return {
      path: pathWithLocation,
      line: 0,
      column: 0,
    };
  }

  const rawPath = pathWithLocation.slice(0, locationMatch.index);
  return {
    path: rawPath,
    line: Math.max(0, Number.parseInt(locationMatch[1] ?? "1", 10) - 1),
    column: Math.max(0, Number.parseInt(locationMatch[2] ?? "1", 10) - 1),
  };
}

export async function handleCommonBridgeRequest(
  webview: { postMessage: (message: unknown) => Thenable<boolean> | boolean },
  message: BridgeRequest,
): Promise<void> {
  const reply = (result: unknown, error?: string) => {
    void webview.postMessage({
      requestId: message.requestId,
      result,
      error,
    });
  };

  try {
    switch (message.type) {
      case "pickFolder": {
        const uris = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          openLabel: "Select Folder",
        });
        reply(uris?.[0]?.fsPath ?? null);
        return;
      }

      case "confirm": {
        const payload = message.payload as { message: string };
        const choice = await vscode.window.showInformationMessage(
          payload.message,
          { modal: true },
          "OK",
        );
        reply(choice === "OK");
        return;
      }

      case "setTheme": {
        reply(undefined);
        return;
      }

      case "openExternal": {
        const payload = message.payload as { url: string };
        await vscode.env.openExternal(vscode.Uri.parse(payload.url));
        reply(true);
        return;
      }

      case "showContextMenu": {
        reply(undefined);
        return;
      }

      case "openInEditor": {
        const payload = message.payload as { path: string };
        const { column, line, path } = parseOpenInEditorPath(payload.path);
        const uri = vscode.Uri.file(path);
        let stat: vscode.FileStat | null = null;

        try {
          stat = await vscode.workspace.fs.stat(uri);
        } catch {
          stat = null;
        }

        if (stat && (stat.type & vscode.FileType.Directory) !== 0) {
          await vscode.commands.executeCommand("revealInExplorer", uri);
          reply(undefined);
          return;
        }

        const document = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(document, {
          selection: new vscode.Range(line, column, line, column),
          viewColumn: vscode.ViewColumn.Active,
        });
        reply(undefined);
        return;
      }

      default: {
        reply(undefined, `Unknown bridge request type: ${message.type}`);
      }
    }
  } catch (error) {
    reply(undefined, error instanceof Error ? error.message : "Unknown bridge error");
  }
}
