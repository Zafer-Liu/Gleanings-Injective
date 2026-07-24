import { describe, expect, it } from "vitest";
import { act2Content, act2Dialogue, act2Quest } from "./content";

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

  it("aligns task targets and collision feet with the generated brewery furniture", () => {
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

    const collisionById = Object.fromEntries(
      act2Content.map.collisions.map((area) => [area.id, area])
    );
    expect(collisionById).toMatchObject({
      tray_table_base: { x: 8, y: 7.75, width: 7, height: 0.75 },
      jar_bank_base: { x: 25.5, y: 9.25, width: 13, height: 0.75 },
      mix_station_base: { x: 6.5, y: 18.75, width: 7, height: 0.75 },
      vat_station_base: { x: 18, y: 18.75, width: 9, height: 0.75 },
      seal_station_base: { x: 29.5, y: 18.75, width: 7, height: 0.75 }
    });
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
