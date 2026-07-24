import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEBUG_COLLECTIBLES_STORAGE_KEY } from "./debugCollectibles";
import {
  DEBUG_CONSOLE_COMMAND,
  installDebugTools,
  registerDebugConsoleCommand
} from "./DebugTools";

function press(
  code: string,
  modifiers: Pick<
    KeyboardEventInit,
    "altKey" | "ctrlKey" | "shiftKey"
  >
): void {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      code,
      bubbles: true,
      cancelable: true,
      ...modifiers
    })
  );
}

describe("debug tools", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    document.getElementById("gleanings-debug-tools")?.remove();
    document
      .querySelector("style[data-gleanings-debug-tools]")
      ?.remove();
    Reflect.deleteProperty(window, DEBUG_CONSOLE_COMMAND);
  });

  it("游戏尚未挂载时也可以在 Console 输入 dev", () => {
    const unregister = registerDebugConsoleCommand();

    expect(DEBUG_CONSOLE_COMMAND in window).toBe(true);
    expect(Reflect.get(window, DEBUG_CONSOLE_COMMAND)).toBe(
      "Gleanings 调试模式已开启；进入游戏后自动显示"
    );

    const game = {
      scene: {
        getScenes: () => [{ scene: { key: "Apartment" } }],
        start: vi.fn()
      },
      events: { once: vi.fn() }
    } as unknown as Phaser.Game;
    const cleanup = installDebugTools(game);
    expect(
      (document.getElementById(
        "gleanings-debug-tools"
      ) as HTMLElement).hidden
    ).toBe(false);

    cleanup();
    unregister();
    expect(DEBUG_CONSOLE_COMMAND in window).toBe(false);
  });

  it("控制台输入 dev 后才启用面板和隐藏快捷键", () => {
    const start = vi.fn();
    const once = vi.fn();
    const game = {
      scene: {
        getScenes: () => [{ scene: { key: "Apartment" } }],
        start
      },
      events: { once }
    } as unknown as Phaser.Game;
    const unregister = registerDebugConsoleCommand();
    const cleanup = installDebugTools(game);
    const panel = document.getElementById("gleanings-debug-tools");

    expect(panel).not.toBeNull();
    expect((panel as HTMLElement).hidden).toBe(true);
    press("KeyN", { altKey: true, shiftKey: true });
    expect(start).not.toHaveBeenCalled();

    expect(Reflect.get(window, DEBUG_CONSOLE_COMMAND)).toBe(
      "Gleanings 调试工具已开启"
    );
    expect((panel as HTMLElement).hidden).toBe(false);

    press("KeyN", { altKey: true, shiftKey: true });
    expect(start).toHaveBeenCalledWith("ActTwo");
    expect(
      window.sessionStorage.getItem("gleanings.active-chapter.v1")
    ).toBe("one");

    press("KeyB", { altKey: true, shiftKey: true });
    press("KeyI", { altKey: true, shiftKey: true });
    expect(
      JSON.parse(
        window.localStorage.getItem(
          DEBUG_COLLECTIBLES_STORAGE_KEY
        ) ?? "null"
      )
    ).toEqual(["badge", "item"]);

    expect(once).toHaveBeenCalledWith("destroy", cleanup);
    cleanup();
    unregister();
    expect(document.getElementById("gleanings-debug-tools")).toBeNull();
    expect(DEBUG_CONSOLE_COMMAND in window).toBe(false);
  });
});
