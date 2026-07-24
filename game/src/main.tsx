import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerDebugConsoleCommand } from "./game/debug/DebugTools";
import "./app/app.css";

const unregisterDebugConsoleCommand = registerDebugConsoleCommand();
if (import.meta.hot) {
  import.meta.hot.dispose(unregisterDebugConsoleCommand);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
