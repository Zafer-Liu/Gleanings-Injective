import { describe, expect, it } from "vitest";
import { act1Content } from "../../content/act1/content";
import {
  canBeginJarOpening,
  findInteractionTarget,
  resolveInteraction,
  shouldShowContextHint
} from "./InteractionSystem";
import { createInitialAct1State } from "../domain/act1State";

describe("InteractionSystem", () => {
  it.each([
    [{ x: 7, y: 12 }, "left"],
    [{ x: 8, y: 12 }, "left"],
    [{ x: 7, y: 11 }, "left"],
    [{ x: 7, y: 13 }, "left"]
  ] as const)(
    "selects the box inside its widened interaction area at %o",
    (playerTile, facing) => {
      const target = findInteractionTarget(
        playerTile,
        facing,
        act1Content.interactables,
        "EXPLORE"
      );

      expect(target?.id).toBe("obj_cardboard_box");
    }
  );

  it("does not select an object behind the player or outside its range", () => {
    expect(
      findInteractionTarget(
        { x: 7, y: 12 },
        "right",
        act1Content.interactables,
        "EXPLORE"
      )
    ).toBeNull();
    expect(
      findInteractionTarget(
        { x: 9, y: 12 },
        "left",
        act1Content.interactables,
        "EXPLORE"
      )
    ).toBeNull();
  });

  it("selects the jar from the open floor tile directly left of its visible body", () => {
    const target = findInteractionTarget(
      { x: 25, y: 9 },
      "right",
      act1Content.interactables,
      "MIA_ENTERED"
    );

    expect(target?.id).toBe("obj_laojiu_jar");
  });

  it("does not select the box after its note has been acquired", () => {
    const target = findInteractionTarget(
      { x: 7, y: 12 },
      "left",
      act1Content.interactables,
      "NOTE_ACQUIRED"
    );

    expect(target).toBeNull();
  });

  it("awards the note only after inspecting the box during exploration", () => {
    const state = {
      ...createInitialAct1State(),
      phase: "EXPLORE" as const,
      questId: "act1_find_box"
    };
    const box = act1Content.interactables.find(
      (item) => item.id === "obj_cardboard_box"
    )!;

    expect(resolveInteraction(state, box)).toEqual({
      kind: "box",
      dialogueGroup: "box",
      completionEvents: [{ type: "ACQUIRE_NOTE" }],
      openChoice: false
    });
  });

  it("does not award a duplicate note from the box", () => {
    const state = {
      ...createInitialAct1State(),
      phase: "NOTE_ACQUIRED" as const,
      questId: "act1_read_note",
      inventory: ["item_taipo_note"]
    };
    const box = act1Content.interactables.find(
      (item) => item.id === "obj_cardboard_box"
    )!;

    expect(resolveInteraction(state, box).completionEvents).toEqual([]);
  });

  it("keeps an early jar inspection from advancing the story", () => {
    const jar = act1Content.interactables.find(
      (item) => item.id === "obj_laojiu_jar"
    )!;

    expect(resolveInteraction(createInitialAct1State(), jar)).toEqual({
      kind: "jar-early",
      dialogueGroup: "jarEarly",
      completionEvents: [],
      openChoice: false
    });
  });

  it("opens the sensory choice only after the jar-ready line", () => {
    const jar = act1Content.interactables.find(
      (item) => item.id === "obj_laojiu_jar"
    )!;
    const state = {
      ...createInitialAct1State(),
      phase: "MIA_ENTERED" as const,
      questId: "act1_find_jar"
    };

    expect(resolveInteraction(state, jar)).toEqual({
      kind: "jar-ready",
      dialogueGroup: "jarReady",
      completionEvents: [{ type: "INSPECT_JAR" }],
      openChoice: true
    });
  });

  it("allows the hold interaction only for a chosen sense at the jar", () => {
    const jar = act1Content.interactables.find(
      (item) => item.id === "obj_laojiu_jar"
    )!;
    const state = {
      ...createInitialAct1State(),
      phase: "SENSE_CHOSEN" as const,
      questId: "act1_open_jar",
      senseChoice: "aroma" as const
    };

    expect(canBeginJarOpening(state, jar)).toBe(true);
    expect(
      canBeginJarOpening({ ...state, movementLocked: true }, jar)
    ).toBe(false);
    expect(
      canBeginJarOpening(state, act1Content.interactables[0])
    ).toBe(false);
  });

  it("reveals a stronger hint after inactivity or repeated invalid input", () => {
    expect(
      shouldShowContextHint({
        now: 9_001,
        lastProgressAt: 1_000,
        invalidInteractions: 0
      })
    ).toBe(true);
    expect(
      shouldShowContextHint({
        now: 2_000,
        lastProgressAt: 1_000,
        invalidInteractions: 2
      })
    ).toBe(true);
    expect(
      shouldShowContextHint({
        now: 2_000,
        lastProgressAt: 1_000,
        invalidInteractions: 1
      })
    ).toBe(false);
  });
});
