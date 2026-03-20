# Orqent

Orqent is an AI coding assistant for VS Code built for local, workspace-aware coding sessions.

It gives you a dedicated sidebar for thread navigation, thread-based chat panels inside the editor, local Codex-powered workflows, and direct file opening in the same VS Code window.

---

## Features

- **AI coding assistant in VS Code**: keep agent conversations inside your editor instead of switching to a separate app
- **Thread-based chat**: organize work by thread and open each conversation in its own focused editor panel
- **Workspace-aware sidebar**: browse project threads from the `Orqent` Activity Bar view
- **In-editor file navigation**: open file references from chat directly in the current VS Code window
- **Local Codex workflow**: connect Orqent to a real local workspace with local tools and project context
- **Bundled runtime**: ships with the required webview UI and extension-side runtime assets

---

## Quick Start

1. Install the extension.
2. Open a workspace folder in VS Code.
3. Click the **Orqent** icon in the Activity Bar.
4. Create a new thread from the sidebar.
5. Open the thread and start a coding conversation in the panel view.

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

Orqent works best with a real project folder so it can inspect the workspace, open files, and keep AI-assisted coding threads tied to the project you are working on.
