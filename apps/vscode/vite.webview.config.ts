import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import pkg from "./package.json" with { type: "json" };

const sharedWebRoot = resolve(import.meta.dirname, "../web");
const webviewRoot = resolve(import.meta.dirname, "webview");

export default defineConfig({
  root: webviewRoot,
  plugins: [
    tanstackRouter({
      routesDirectory: resolve(sharedWebRoot, "src/routes"),
      generatedRouteTree: resolve(sharedWebRoot, "src/routeTree.gen.ts"),
    }),
    react(),
    babel({
      parserOpts: { plugins: ["typescript", "jsx"] },
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ["@pierre/diffs", "@pierre/diffs/react", "@pierre/diffs/worker/worker.js"],
  },
  define: {
    "import.meta.env.VITE_IS_VSCODE_WEBVIEW": JSON.stringify("true"),
    "import.meta.env.APP_VERSION": JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "~": resolve(sharedWebRoot, "src"),
    },
  },
  build: {
    outDir: resolve(import.meta.dirname, "dist-webview"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: resolve(webviewRoot, "index.vscode.html"),
      },
    },
  },
  worker: {
    format: "es",
    rollupOptions: {},
  },
});
