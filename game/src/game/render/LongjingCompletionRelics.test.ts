import { describe, expect, it } from "vitest";
import { LONGJING_COMPLETION_RELICS } from "./LongjingCompletionRelics";

describe("Longjing completion relic art", () => {
  it("uses the colored collectible images instead of text glyphs", () => {
    expect(LONGJING_COMPLETION_RELICS).toEqual([
      {
        eyebrow: "第一章",
        title: "一坛回声",
        texture: "badge-fujian-aged-rice-wine"
      },
      {
        eyebrow: "第二章",
        title: "清明芽签",
        texture: "badge-qingming-bud"
      },
      {
        eyebrow: "第二章",
        title: "一叶来处",
        texture: "badge-west-lake-longjing-tea"
      }
    ]);
  });
});
