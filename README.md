# Orqent

Orqent is a minimal web GUI for coding agents. Currently Codex and Claude Code, with more coming soon.

## How to use

> [!WARNING]
> You need to have [Codex CLI](https://github.com/openai/codex) installed and authorized for Orqent to work.

```bash
npx t3
```

You can also just install the desktop app. It's cooler.

Install the [desktop app from the Releases page](https://github.com/pingdotgg/orqent/releases)

## VS Code extension

Build the extension:

```bash
bun run build:vscode
```

Run it in a VS Code Extension Development Host:

```bash
bun run dev:vscode
```

Then open the repo in VS Code and launch the extension host from the Run and Debug panel.

Package a `.vsix`:

```bash
bun run package:vscode
```

## Some notes

We are very very early in this project. Expect bugs.

We are not accepting contributions yet.

## If you REALLY want to contribute still.... read this first

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or PR.

Need support? Join the [Discord](https://discord.gg/jn4EGJjrvv).
