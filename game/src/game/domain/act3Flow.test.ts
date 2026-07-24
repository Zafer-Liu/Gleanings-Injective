import { describe, expect, it } from "vitest";
import {
  act3Progress,
  act3QuestId,
  act3RelicView,
  act3TargetId
} from "./act3Flow";

describe("act three presentation flow", () => {
  it("points to one missing material while allowing any collection order", () => {
    expect(act3TargetId("COLLECT", [])).toBe("bowl");
    expect(act3TargetId("COLLECT", ["bowl"])).toBe("noodles");
    expect(act3TargetId("COLLECT", ["noodles", "bowl"])).toBe(
      "laojiu"
    );
    expect(
      act3TargetId("COLLECT", ["laojiu", "bowl", "noodles"])
    ).toBe("stove");
  });

  it.each([
    ["ARRIVE", "act3_talk_family", "family"],
    ["READY_TO_COOK", "act3_cook", "stove"],
    ["COOKED", "act3_serve", "azhen"],
    ["INSCRIPTION", "act3_inscription", null],
    ["COMPLETE", "act3_complete", null]
  ] as const)(
    "maps %s to its quest and target",
    (phase, quest, target) => {
      expect(act3QuestId(phase)).toBe(quest);
      expect(act3TargetId(phase, [])).toBe(target);
    }
  );

  it("formats the preparation counter", () => {
    expect(act3Progress([])).toBe("备料 0/3");
    expect(act3Progress(["laojiu", "bowl"])).toBe("备料 2/3");
  });

  it.each([
    ["warm", "暖", "温暖"],
    ["inherit", "承", "敬意"],
    ["remember", "念", "怅惘"]
  ] as const)(
    "builds the %s blue-and-white cup",
    (choice, mark, tone) => {
      expect(act3RelicView(choice)).toMatchObject({
        name: `青花酒盏 · ${mark}`,
        rarity: tone,
        texture: "item-blue-white-cup"
      });
    }
  );

  it("breaks the warm relic description after its first comma", () => {
    expect(act3RelicView("warm").description).toBe(
      "这只酒盏记得灶火与面线的热气，\n也记得有人在最疲惫的时候被好好照顾。"
    );
  });
});
