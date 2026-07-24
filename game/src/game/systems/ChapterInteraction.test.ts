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
        objects,
        "ARRIVE"
      )?.id
    ).toBe("decoration");
  });

  it("does not select a sideways or behind object", () => {
    expect(
      findChapterTarget(
        { x: 8, y: 10 },
        "down",
        objects,
        "INSPECT_TRAY"
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
});
