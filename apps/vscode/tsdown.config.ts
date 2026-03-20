import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: "cjs",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  outExtensions: () => ({ js: ".cjs" }),
  external: ["vscode"],
  noExternal: (id) => id.startsWith("@t3tools/"),
});
