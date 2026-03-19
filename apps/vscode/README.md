# Orqent

Use Orqent inside VS Code with a dedicated sidebar, thread panels, and the same local agent workflow used by the main app.

The extension runs a bundled local server runtime, renders the Orqent webview UI inside VS Code, and keeps thread navigation in the Activity Bar while opening conversations in focused editor panels.

---

## Features

- **Sidebar view**: browse workspace threads from the `Orqent` Activity Bar view
- **Thread panels**: open each thread in a dedicated VS Code tab without spawning a separate app window
- **New thread flow**: create threads directly from the sidebar title actions
- **In-editor file opening**: file links from chat open in the same VS Code window
- **Bundled runtime**: ships with the extension-side server runtime and webview assets
- **Local-first workflow**: designed for running against your current workspace and local tools

---

## Quick Start

1. Install the extension or load it from a local VSIX.
2. Open a workspace folder in VS Code.
3. Click the **Orqent** icon in the Activity Bar.
4. Create a new thread from the sidebar.
5. Open the thread and start chatting in the panel view.

---

## Commands

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `Orqent: Open Orqent` | Focus the main Orqent sidebar view   |
| `Orqent: New Thread`  | Create a new thread from the sidebar |

---

## Requirements

- VS Code `^1.95.0`
- A local workspace folder opened in VS Code
- Codex CLI installed and authenticated

Orqent works best when pointed at a real project folder so it can open files, inspect the workspace, and manage threads per project.
