import * as vscode from "vscode";

import type { MainViewProvider } from "../providers/webview/mainViewProvider.js";

export function registerCommands(mainViewProvider: MainViewProvider): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand("orqent.openPanel", () => {
      void vscode.commands.executeCommand("orqent.mainView.focus");
    }),
    vscode.commands.registerCommand("orqent.newThread", () => {
      mainViewProvider.postMessage({
        type: "menuAction",
        action: "new-thread",
      });
    }),
  ];
}
