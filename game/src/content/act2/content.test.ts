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
