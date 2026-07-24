import { describe, expect, it } from "vitest";
import type { ChapterInteractable } from "../../content/chapter/types";
import { findChapterTarget } from "./ChapterInteraction";

const objects: ChapterInteractable[] = [
  {
    id: "hongqu_tray",
    tile: { x: 9, y: 10 },
    range: 1,
    prompt: "查看红曲盘",
    dialogueGroup: "tray",
    enabledPhases: ["INSPECT_TRAY"]
  },
  {
    id: "master",
    tile: { x: 8, y: 9 },
    range: 1,
    prompt: "与阿凤师交谈",
    dialogueGroup: "master",
    enabledPhases: ["ARRIVE", "QUESTION"]
  },
  {
    id: "decoration",
    tile: { x: 10, y: 10 },
    range: 2,
    prompt: "查看",
    dialogueGroup: "decoration"
  }
];

describe("ChapterInteraction", () => {
  it("selects the nearest enabled object directly ahead", () => {
    expect(
      findChapterTarget(
        { x: 8, y: 10 },
        "right",
        objects,
        "INSPECT_TRAY"
      )?.id
    ).toBe("hongqu_tray");
  });

  it("ignores objects that are disabled for the current phase", () => {
    expect(
      findChapterTarget(
        { x: 8, y: 10 },
        "right",
        objects.filter((item) => item.id !== "master"),
        "ARRIVE"
      )?.id
    ).toBe("decoration");
  });

  it("does not select a phase-free optional object behind the player", () => {
    expect(
      findChapterTarget(
        { x: 11, y: 10 },
        "right",
        objects,
        "ANY_PHASE"
      )
    ).toBeNull();
  });

  it("lets phase-free optional objects remain available", () => {
    expect(
      findChapterTarget(
        { x: 8, y: 10 },
        "right",
        objects,
        "ANY_PHASE"
      )?.id
    ).toBe("decoration");
  });

  it("does not widen phase-free optional object interaction areas", () => {
    expect(
      findChapterTarget(
        { x: 9, y: 11 },
        "up",
        objects,
        "ANY_PHASE"
      )
    ).toBeNull();
  });

  it("allows an explicitly widened optional object one tile sideways", () => {
    const sideCounter = {
      id: "side_counter",
      tile: { x: 6, y: 15 },
      range: 2,
      sidewaysRange: 1,
      prompt: "查看侧边柜台",
      dialogueGroup: "sideCounter",
      optional: true
    } as ChapterInteractable & { sidewaysRange: number };

    expect(
      findChapterTarget(
        { x: 5, y: 16 },
        "up",
        [sideCounter],
        "ANY_PHASE"
      )?.id
    ).toBe("side_counter");
  });

  it.each(["up", "down", "left", "right"] as const)(
    "finds the nearby active task objective while facing %s",
    (facing) => {
      expect(
        findChapterTarget(
          { x: 8, y: 11 },
          facing,
          objects,
          "INSPECT_TRAY"
        )?.id
      ).toBe("hongqu_tray");
    }
  );

  it("keeps an active task objective to an exact 3x3 area", () => {
    const wideObjective: ChapterInteractable = {
      id: "wide_objective",
      tile: { x: 6, y: 15 },
      range: 2,
      prompt: "查看任务物件",
      dialogueGroup: "wideObjective",
      enabledPhases: ["ACTIVE"]
    };

    expect(
      findChapterTarget(
        { x: 4, y: 15 },
        "right",
        [wideObjective],
        "ACTIVE"
      )
    ).toBeNull();
  });
});
