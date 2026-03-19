import * as vscode from "vscode";

import type { MainViewProvider } from "../providers/webview/mainViewProvider.js";

export function registerCommands(mainViewProvider: MainViewProvider): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand("t3code.openPanel", () => {
      void vscode.commands.executeCommand("t3code.mainView.focus");
    }),
    vscode.commands.registerCommand("t3code.newThread", () => {
      mainViewProvider.postMessage({
        type: "menuAction",
        action: "new-thread",
      });
    }),
  ];
}
