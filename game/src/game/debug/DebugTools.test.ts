import type Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEBUG_COLLECTIBLES_STORAGE_KEY } from "./debugCollectibles";
import { installDebugTools } from "./DebugTools";

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
  });

  it("隐藏快捷键可打开面板、跳关并解锁两类收藏", () => {
    const start = vi.fn();
    const once = vi.fn();
    const game = {
      scene: {
        getScenes: () => [{ scene: { key: "Apartment" } }],
        start
      },
      events: { once }
    } as unknown as Phaser.Game;
    const cleanup = installDebugTools(game);
    const panel = document.getElementById("gleanings-debug-tools");

    expect(panel).not.toBeNull();
    expect((panel as HTMLElement).hidden).toBe(true);
    press("KeyD", { ctrlKey: true, shiftKey: true });
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
    expect(document.getElementById("gleanings-debug-tools")).toBeNull();
  });
});
