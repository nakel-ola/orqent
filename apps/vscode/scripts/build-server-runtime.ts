import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveCatalogDependencies } from "../../../scripts/lib/resolve-catalog.ts";

interface RootPackageJson {
  readonly workspaces?: {
    readonly catalog?: Record<string, unknown>;
  };
}

interface ServerPackageJson {
  readonly version: string;
  readonly dependencies?: Record<string, unknown>;
}

const currentFilePath = fileURLToPath(import.meta.url);
const vscodeDir = path.resolve(path.dirname(currentFilePath), "..");
const repoRoot = path.resolve(vscodeDir, "..", "..");
const serverDir = path.join(repoRoot, "apps", "server");
const serverDistDir = path.join(serverDir, "dist");
const distServerDir = path.join(vscodeDir, "dist-server");

const rootPackageJson = JSON.parse(
  readFileSync(path.join(repoRoot, "package.json"), "utf8"),
) as RootPackageJson;
const serverPackageJson = JSON.parse(
  readFileSync(path.join(serverDir, "package.json"), "utf8"),
) as ServerPackageJson;

const catalog = rootPackageJson.workspaces?.catalog ?? {};
const dependencies = resolveCatalogDependencies(
  serverPackageJson.dependencies ?? {},
  catalog,
  "apps/server dependencies",
);

if (!existsSync(serverDistDir)) {
  throw new Error(`Missing server build output at ${serverDistDir}. Run the server build first.`);
}

rmSync(distServerDir, { recursive: true, force: true });
mkdirSync(distServerDir, { recursive: true });
cpSync(serverDistDir, distServerDir, { recursive: true });

writeFileSync(
  path.join(distServerDir, "package.json"),
  `${JSON.stringify(
    {
      name: "orqent-server-runtime",
      private: true,
      type: "module",
      version: serverPackageJson.version,
      dependencies,
    },
    null,
    2,
  )}\n`,
);

const installResult = spawnSync(process.execPath, ["install", "--production"], {
  cwd: distServerDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (installResult.status !== 0) {
  throw new Error(
    `Failed to vendor server runtime dependencies (exit code ${installResult.status ?? 1}).`,
  );
}

for (const removableFile of ["bun.lock", "bun.lockb"]) {
  rmSync(path.join(distServerDir, removableFile), { force: true });
}
