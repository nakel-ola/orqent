# Orqent

Orqent is a minimal web GUI for coding agents. Currently Codex and Claude Code, with more coming soon.

## Installation

> [!WARNING]
> Orqent currently supports Codex and Claude.
> Install and authenticate at least one provider before use:
>
> - Codex: install [Codex CLI](https://github.com/openai/codex) and run `codex login`
> - Claude: install Claude Code and run `claude auth login`

### Run without installing

```bash
npx t3
```

### Desktop app

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

Install the latest version of the desktop app from [GitHub Releases](https://github.com/pingdotgg/t3code/releases), or from your favorite package registry:

#### Windows (`winget`)

```bash
winget install T3Tools.T3Code
```

#### macOS (Homebrew)

```bash
brew install --cask t3-code
```

#### Arch Linux (AUR)

```bash
yay -S t3code-bin
```

## Some notes

We are very very early in this project. Expect bugs.

We are not accepting contributions yet.

## If you REALLY want to contribute still.... read this first

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or PR.

Need support? Join the [Discord](https://discord.gg/jn4EGJjrvv).
