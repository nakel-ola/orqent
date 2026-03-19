import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as vscode from "vscode";
import type { T3CodeWebviewConfig } from "@t3tools/contracts";

export function rewriteAssetUrls(
  html: string,
  resolveAssetUrl: (assetPath: string) => string,
): string {
  return html.replace(/(src|href)="(\/[^"]+)"/g, (_match, attribute: string, assetPath: string) => {
    return `${attribute}="${resolveAssetUrl(assetPath)}"`;
  });
}

export function injectWebviewBootstrap(
  html: string,
  input: {
    config: T3CodeWebviewConfig;
    cspSource: string;
    nonce: string;
  },
): string {
  const configJson = JSON.stringify(input.config).replace(/<\/script>/gi, "<\\/script>");
  const csp = [
    "default-src 'none'",
    "connect-src ws: wss: http: https:",
    `style-src ${input.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${input.nonce}'`,
    `img-src ${input.cspSource} data: blob: http: https:`,
    `font-src ${input.cspSource} data:`,
    "worker-src blob:",
  ].join("; ");

  const cspTag = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
  const configScript = `<script nonce="${input.nonce}">window.__ORQENT_WEBVIEW_CONFIG__=${configJson};</script>`;

  return html
    .replace(/<script /g, `<script nonce="${input.nonce}" `)
    .replace("</head>", `  ${cspTag}\n  ${configScript}\n  </head>`);
}

function fallbackHtml(config: T3CodeWebviewConfig, nonce: string): string {
  const configJson = JSON.stringify(config).replace(/<\/script>/gi, "<\\/script>");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';" />
    <title>Orqent</title>
    <script nonce="${nonce}">window.__ORQENT_WEBVIEW_CONFIG__=${configJson};</script>
  </head>
  <body>
    <p style="font-family:sans-serif;padding:1rem;color:#888">
      Orqent webview assets are missing. Run <code>bun run build:webview</code> first.
    </p>
  </body>
</html>`;
}

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  config: T3CodeWebviewConfig,
): string {
  const nonce = randomBytes(16).toString("hex");
  const distWebviewPath = join(extensionUri.fsPath, "dist-webview");
  const distWebviewUri = vscode.Uri.joinPath(extensionUri, "dist-webview");

  let html: string | null = null;
  for (const entryFile of ["index.vscode.html", "index.html"]) {
    try {
      html = readFileSync(join(distWebviewPath, entryFile), "utf8");
      break;
    } catch {
      continue;
    }
  }

  if (html === null) {
    return fallbackHtml(config, nonce);
  }

  return injectWebviewBootstrap(
    rewriteAssetUrls(html, (assetPath) =>
      webview
        .asWebviewUri(vscode.Uri.joinPath(distWebviewUri, ...assetPath.split("/").filter(Boolean)))
        .toString(),
    ),
    {
      config,
      cspSource: webview.cspSource,
      nonce,
    },
  );
}
