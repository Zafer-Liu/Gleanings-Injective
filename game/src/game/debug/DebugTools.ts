import type Phaser from "phaser";
import { advanceDebugStage } from "./debugProgress";
import {
  grantDebugCollectibles,
  type DebugCollectibleKind
} from "./debugCollectibles";

export const DEBUG_CONSOLE_COMMAND = "dev";
const DEBUG_ENABLED_SESSION_KEY = "gleanings.debug.enabled.v1";

type DebugActivator = () => string;
let activeDebugActivator: DebugActivator | null = null;

export const DEBUG_SHORTCUTS = Object.freeze({
  nextStage: "Alt+Shift+N",
  allBadges: "Alt+Shift+B",
  allItems: "Alt+Shift+I"
});

const DEBUG_STYLES = `
.debug-tools {
  position: fixed;
  z-index: 30000;
  top: 76px;
  right: 18px;
  width: min(268px, calc(100vw - 36px));
  padding: 12px;
  border: 1px solid #d4b46a;
  border-radius: 8px;
  background: rgba(25, 19, 17, 0.96);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.42);
  color: #f4ebdd;
  font-family: "Cascadia Mono", Consolas, monospace;
}
.debug-tools[hidden] { display: none; }
.debug-tools header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #d4b46a;
  font-size: 12px;
  letter-spacing: 0.08em;
}
.debug-tools__close {
  border: 0;
  background: transparent;
  color: #b7c2c0;
  cursor: pointer;
  font: inherit;
  font-size: 18px;
}
.debug-tools__action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 7px;
  padding: 9px 10px;
  border: 1px solid #6e4932;
  border-radius: 5px;
  background: #30231d;
  color: #f4ebdd;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  text-align: left;
}
.debug-tools__action:hover {
  border-color: #c9873f;
  background: #3b2921;
}
.debug-tools kbd {
  color: #b7c2c0;
  font-size: 9px;
}
.debug-tools__status {
  min-height: 2.4em;
  margin: 10px 2px 0;
  color: #b7c2c0;
  font-size: 10px;
  line-height: 1.4;
}`;

function button(label: string, shortcut: string): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "debug-tools__action";

  const text = document.createElement("span");
  text.textContent = label;
  const key = document.createElement("kbd");
  key.textContent = shortcut;
  element.append(text, key);
  return element;
}

function debugWasRequested(): boolean {
  try {
    return (
      window.sessionStorage.getItem(DEBUG_ENABLED_SESSION_KEY) === "true"
    );
  } catch {
    return false;
  }
}

function requestDebugMode(): string {
  try {
    window.sessionStorage.setItem(DEBUG_ENABLED_SESSION_KEY, "true");
  } catch {
    // The current game instance can still be enabled without persistence.
  }
  return activeDebugActivator?.() ??
    "Gleanings 调试模式已开启；进入游戏后自动显示";
}

export function registerDebugConsoleCommand(): () => void {
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    window,
    DEBUG_CONSOLE_COMMAND
  );
  Object.defineProperty(window, DEBUG_CONSOLE_COMMAND, {
    configurable: true,
    get: requestDebugMode
  });

  return () => {
    const currentDescriptor = Object.getOwnPropertyDescriptor(
      window,
      DEBUG_CONSOLE_COMMAND
    );
    if (currentDescriptor?.get !== requestDebugMode) return;
    if (previousDescriptor === undefined) {
      Reflect.deleteProperty(window, DEBUG_CONSOLE_COMMAND);
    } else {
      Object.defineProperty(
        window,
        DEBUG_CONSOLE_COMMAND,
        previousDescriptor
      );
    }
  };
}

export function installDebugTools(game: Phaser.Game): () => void {
  const styles = document.createElement("style");
  styles.dataset.gleaningsDebugTools = "";
  styles.textContent = DEBUG_STYLES;
  document.head.append(styles);

  const panel = document.createElement("aside");
  panel.id = "gleanings-debug-tools";
  panel.className = "debug-tools";
  panel.hidden = true;
  panel.setAttribute("aria-label", "开发调试工具");

  const header = document.createElement("header");
  const title = document.createElement("strong");
  title.textContent = "DEV / 调试工具";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "debug-tools__close";
  close.textContent = "×";
  close.setAttribute("aria-label", "关闭调试工具");
  header.append(title, close);

  const nextStage = button("跳到下一关", "Alt+Shift+N");
  const allBadges = button("解锁全部徽章", "Alt+Shift+B");
  const allItems = button("解锁全部道具", "Alt+Shift+I");
  const status = document.createElement("p");
  status.className = "debug-tools__status";
  status.setAttribute("role", "status");
  status.textContent = "操作只在开发环境生效。";

  panel.append(header, nextStage, allBadges, allItems, status);
  document.body.append(panel);

  const report = (message: string) => {
    status.textContent = message;
  };

  const activeSceneKey = () =>
    game.scene.getScenes(true).at(-1)?.scene.key ?? "";

  const advance = () => {
    const result = advanceDebugStage(
      activeSceneKey(),
      window.localStorage,
      window.sessionStorage
    );
    if (result === null) {
      report("当前已是最后一关，或场景不支持跳转。");
      return;
    }
    report(`已跳转：${result.label}`);
    game.scene.start(result.sceneKey);
  };

  const grant = (kind: DebugCollectibleKind) => {
    grantDebugCollectibles(window.localStorage, kind);
    window.dispatchEvent(new Event("gleanings:collectionchange"));
    report(
      kind === "badge"
        ? "已解锁全部徽章。"
        : "已解锁全部道具。"
    );
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;

    const hiddenAction =
      event.altKey && event.shiftKey && !event.ctrlKey;
    if (
      !(
        hiddenAction &&
        ["KeyN", "KeyB", "KeyI"].includes(event.code)
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.code === "KeyN") {
      advance();
    } else if (event.code === "KeyB") {
      grant("badge");
    } else {
      grant("item");
    }
  };

  let enabled = false;
  const enable = () => {
    if (!enabled) {
      enabled = true;
      window.addEventListener("keydown", onKeyDown, true);
    }
    panel.hidden = false;
    report("调试工具已开启。关闭面板后可再次输入 dev 唤出。");
    return "Gleanings 调试工具已开启";
  };

  activeDebugActivator = enable;
  if (debugWasRequested()) {
    enable();
  }

  close.addEventListener("click", () => {
    panel.hidden = true;
  });
  nextStage.addEventListener("click", advance);
  allBadges.addEventListener("click", () => grant("badge"));
  allItems.addEventListener("click", () => grant("item"));

  const cleanup = () => {
    window.removeEventListener("keydown", onKeyDown, true);
    if (activeDebugActivator === enable) {
      activeDebugActivator = null;
    }
    panel.remove();
    styles.remove();
  };
  game.events.once("destroy", cleanup);
  return cleanup;
}
