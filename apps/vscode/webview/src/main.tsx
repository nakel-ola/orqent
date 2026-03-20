import "~/vscodeBridge";

import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashHistory } from "@tanstack/react-router";

import "@xterm/xterm/css/xterm.css";
import "~/index.css";

import { APP_DISPLAY_NAME } from "~/branding";
import { appMode, webviewConfig } from "~/env";
import { getRouter } from "~/router";
import { getInitialPanelPath, seedPanelDraftContext } from "./bootstrap";
import { SidebarApp } from "./SidebarApp";

seedPanelDraftContext(webviewConfig);

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

if (appMode === "sidebar") {
  root.render(
    <React.StrictMode>
      <SidebarApp />
    </React.StrictMode>,
  );
} else {
  const history = createHashHistory();
  const initialPanelPath = getInitialPanelPath(webviewConfig);
  if (initialPanelPath) {
    history.push(initialPanelPath);
  }

  const router = getRouter(history);
  document.title = APP_DISPLAY_NAME;

  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
