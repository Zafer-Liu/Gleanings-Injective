import { describe, expect, it } from "vitest";
import { questSystem } from "../../game/systems/QuestSystem";
import type { Act1Phase } from "../../game/domain/act1State";
import { act1Content } from "./content";

const phases: Act1Phase[] = [
  "ARRIVE",
  "EXPLORE",
  "NOTE_ACQUIRED",
  "NOTE_READ",
  "MIA_ENTERED",
  "JAR_INSPECTED",
  "SENSE_CHOSEN",
  "JAR_OPENING",
  "COMPLETE"
];

describe("act one content", () => {
  it("defines every quest referenced by progression", () => {
    const ids = new Set(act1Content.quests.map((quest) => quest.id));

    for (const phase of phases) {
      expect(ids.has(questSystem.forPhase(phase))).toBe(true);
    }
  });

  it("keeps every interactable inside the 30 by 20 map", () => {
    for (const object of act1Content.interactables) {
      expect(object.tile.x).toBeGreaterThanOrEqual(0);
      expect(object.tile.x).toBeLessThan(30);
      expect(object.tile.y).toBeGreaterThanOrEqual(0);
      expect(object.tile.y).toBeLessThan(20);
    }
  });

  it("uses Chinese display names for every dialogue line", () => {
    const lines = Object.values(act1Content.dialogue.groups).flat();

    for (const line of lines) {
      expect(line.speakerName).toMatch(/[\u3400-\u9fff]/);
      expect(line.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("defines the three approved sensory choices", () => {
    expect(act1Content.dialogue.choices.map((choice) => choice.value)).toEqual([
      "aroma",
      "hongqu_red",
      "cold_clay"
    ]);
  });

  it("defines the approved map dimensions and spawn points", () => {
    expect(act1Content.map.size).toEqual({ width: 30, height: 20 });
    expect(act1Content.map.tileSize).toBe(32);
    expect(act1Content.map.playerSpawn).toEqual({ x: 14, y: 15 });
    expect(act1Content.map.miaSpawn).toEqual({ x: 26, y: 16 });
  });

  it("keeps map rectangles aligned to the quarter-tile pixel grid", () => {
    for (const rectangle of [
      ...act1Content.map.furniture,
      ...act1Content.map.collisions
    ]) {
      for (const value of [
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height
      ]) {
        expect(Number.isInteger(value * 4)).toBe(true);
      }
    }
  });
});
