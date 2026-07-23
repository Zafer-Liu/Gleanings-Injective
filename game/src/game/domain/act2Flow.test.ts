import { describe, expect, it } from "vitest";
import {
  act2QuestId,
  act2TargetId,
  act2RelicView
} from "./act2Flow";

describe("act two presentation flow", () => {
  it.each([
    ["ARRIVE", "act2_talk_master", "master"],
    ["INSPECT_TRAY", "act2_inspect_tray", "hongqu_tray"],
    ["INSPECT_JAR", "act2_inspect_jar", "clay_jar"],
    ["TAKE_SAMPLE", "act2_take_sample", "hongqu_sample"],
    ["MIX", "act2_mix", "mix_station"],
    ["VAT", "act2_vat", "vat_station"],
    ["SEAL", "act2_seal", "seal_station"],
    ["QUESTION", "act2_question", "master"]
  ] as const)(
    "maps %s to its quest and only active target",
    (phase, quest, target) => {
      expect(act2QuestId(phase)).toBe(quest);
      expect(act2TargetId(phase)).toBe(target);
    }
  );

  it("hides the mission arrow after completion", () => {
    expect(act2TargetId("COMPLETE")).toBeNull();
    expect(act2QuestId("COMPLETE")).toBe("act2_complete");
  });

  it("returns the legendary blank seal for the cold future path", () => {
    expect(act2RelicView("cold_clay", "ask_future")).toMatchObject({
      name: "留白印",
      rarity: "传世",
      texture: "item-dongniang-relic"
    });
  });

  it.each([
    ["aroma", "ask_hongqu", "冬酿曲印", "寻常"],
    ["hongqu_red", "ask_winter", "冬酿曲印", "稀有"],
    ["aroma", "ask_future", "冬酿曲印", "稀有"]
  ] as const)(
    "describes the %s / %s relic branch",
    (sense, question, name, rarity) => {
      expect(act2RelicView(sense, question)).toMatchObject({
        name,
        rarity
      });
    }
  );
});
