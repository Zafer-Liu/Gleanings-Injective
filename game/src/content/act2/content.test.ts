import { describe, expect, it } from "vitest";
import { act2Content, act2Dialogue, act2Quest } from "./content";

function collisionAt(x: number, y: number): string | null {
  const collision = act2Content.map.collisions.find(
    (area) =>
      x >= area.x &&
      x < area.x + area.width &&
      y >= area.y &&
      y < area.y + area.height
  );
  return collision?.id ?? null;
}

describe("act two content", () => {
  it("uses the approved 44 by 30 winter brewery", () => {
    expect(act2Content.map.size).toEqual({ width: 44, height: 30 });
    expect(act2Content.map.tileSize).toBe(32);
  });

  it("contains every required mission target exactly once per phase", () => {
    const targetIds = act2Content.interactables
      .filter((item) => !item.optional)
      .map((item) => item.id);

    expect(targetIds).toEqual([
      "master",
      "hongqu_tray",
      "clay_jar",
      "hongqu_sample",
      "mix_station",
      "vat_station",
      "seal_station"
    ]);
  });

  it("wraps every furniture region with a collision wall matching its visible footprint", () => {
    const targetTiles = Object.fromEntries(
      act2Content.interactables.map((item) => [item.id, item.tile])
    );
    expect(targetTiles).toMatchObject({
      hongqu_tray: { x: 12, y: 9 },
      clay_jar: { x: 34, y: 10 },
      hongqu_sample: { x: 12, y: 9 },
      mix_station: { x: 10, y: 20 },
      vat_station: { x: 22, y: 20 },
      seal_station: { x: 33, y: 20 }
    });

    const furnitureWalls = Object.fromEntries(
      act2Content.map.collisions
        .filter((area) => !area.id.startsWith("wall_"))
        .map((area) => [area.id, area])
    );
    expect(furnitureWalls).toEqual({
      tray_table_base: {
        id: "tray_table_base",
        x: 8,
        y: 5.1,
        width: 7,
        height: 3.4
      },
      jar_bank_base: {
        id: "jar_bank_base",
        x: 25.5,
        y: 4.2,
        width: 13,
        height: 5.8
      },
      mix_station_base: {
        id: "mix_station_base",
        x: 6.5,
        y: 15.4,
        width: 7,
        height: 4.1
      },
      vat_station_base: {
        id: "vat_station_base",
        x: 18,
        y: 15,
        width: 7,
        height: 4.5
      },
      seal_station_base: {
        id: "seal_station_base",
        x: 29.5,
        y: 15.7,
        width: 7,
        height: 3.8
      },
      left_sacks_base: {
        id: "left_sacks_base",
        x: 2,
        y: 24,
        width: 12.5,
        height: 4
      },
      right_shelves_base: {
        id: "right_shelves_base",
        x: 30,
        y: 23.75,
        width: 12,
        height: 4.25
      }
    });
  });

  it("keeps every interaction tile outside the furniture walls", () => {
    for (const target of act2Content.interactables) {
      expect(
        collisionAt(target.tile.x + 0.5, target.tile.y + 0.5)
      ).toBeNull();
    }
  });

  it("keeps the visible vat base solid without blocking the clear floor to its east", () => {
    expect(collisionAt(22, 19)).toBe("vat_station_base");

    for (const x of [25.25, 25.75, 26.25, 26.75]) {
      expect(collisionAt(x, 19)).toBeNull();
    }
  });

  it("walls the full lower-left sack platform while leaving its upper and right paths open", () => {
    for (const x of [2.25, 6, 10, 14.25]) {
      expect(collisionAt(x, 26)).toBe("left_sacks_base");
    }

    expect(collisionAt(8, 23.75)).toBeNull();
    expect(collisionAt(14.75, 26)).toBeNull();
  });

  it("walls the full lower-right shelf platform while leaving its upper and left paths open", () => {
    for (const x of [30.25, 34, 38, 41.75]) {
      expect(collisionAt(x, 26)).toBe("right_shelves_base");
    }

    expect(collisionAt(36, 23.5)).toBeNull();
    expect(collisionAt(29.75, 26)).toBeNull();
  });

  it("keeps the approved Fujian red-yeast bridge in dialogue", () => {
    expect(
      act2Dialogue("masterIntro").some((line) =>
        line.text.includes("我们福建这坛酒，认的是红曲")
      )
    ).toBe(true);
  });

  it("provides content for every quest id", () => {
    for (const id of [
      "act2_talk_master",
      "act2_inspect_tray",
      "act2_inspect_jar",
      "act2_take_sample",
      "act2_mix",
      "act2_vat",
      "act2_seal",
      "act2_question",
      "act2_complete"
    ]) {
      expect(act2Quest(id).id).toBe(id);
    }
  });
});
