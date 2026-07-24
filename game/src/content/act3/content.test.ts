import { describe, expect, it } from "vitest";
import { act3Content, act3Dialogue, act3Quest } from "./content";

describe("act three content", () => {
  it("uses the approved 36 by 26 kitchen map", () => {
    expect(act3Content.map.size).toEqual({ width: 36, height: 26 });
    expect(act3Content.map.tileSize).toBe(32);
  });

  it("contains the three independent ingredients", () => {
    expect(
      act3Content.interactables
        .filter((item) => item.material !== undefined)
        .map((item) => item.material)
    ).toEqual(["bowl", "noodles", "laojiu"]);
  });

  it("aligns interaction targets and collisions with the generated kitchen furniture", () => {
    const targetTiles = Object.fromEntries(
      act3Content.interactables.map((item) => [item.id, item.tile])
    );
    expect(targetTiles).toMatchObject({
      family: { x: 11, y: 11 },
      bowl: { x: 5, y: 7 },
      noodles: { x: 18, y: 8 },
      laojiu: { x: 30, y: 7 },
      stove: { x: 6, y: 15 },
      azhen: { x: 26, y: 18 }
    });

    const collisionById = Object.fromEntries(
      act3Content.map.collisions.map((area) => [area.id, area])
    );
    expect(collisionById).toMatchObject({
      bowl_shelf_base: { x: 3, y: 6.25, width: 5, height: 0.75 },
      noodle_table_base: { x: 15.5, y: 7, width: 7, height: 0.75 },
      wine_rack_base: { x: 27.5, y: 6.25, width: 5.5, height: 0.75 },
      stove_base: { x: 2.5, y: 14.5, width: 6, height: 0.75 },
      dining_table_base: { x: 14.5, y: 14.5, width: 6.5, height: 0.75 },
      rest_bed_base: { x: 27, y: 10.5, width: 7, height: 10 }
    });

    const bed = collisionById.rest_bed_base;
    expect(targetTiles.azhen.x).toBeLessThan(bed.x);
    expect(targetTiles.azhen.y).toBeGreaterThanOrEqual(bed.y);
    expect(targetTiles.azhen.y).toBeLessThan(bed.y + bed.height);
  });

  it("names every person in Chinese", () => {
    const lines = Object.values(act3Content.dialogue.groups).flat();
    expect(lines.some((line) => line.speakerName === "阿珍")).toBe(true);
    expect(lines.some((line) => line.speakerName === "太婆")).toBe(true);
  });

  it("provides the required quest content", () => {
    for (const id of [
      "act3_talk_family",
      "act3_collect",
      "act3_cook",
      "act3_serve",
      "act3_inscription",
      "act3_complete"
    ]) {
      expect(act3Quest(id).id).toBe(id);
    }
  });

  it("keeps the serving dialogue before the inscription choice", () => {
    expect(act3Dialogue("serve").at(-1)?.text).toContain(
      "这碗面线"
    );
  });
});
