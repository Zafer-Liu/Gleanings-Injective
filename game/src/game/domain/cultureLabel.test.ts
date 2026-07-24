import { describe, expect, it } from "vitest";
import { reduceChapter } from "./chapterReducer";
import { createChapterFromActOne } from "./chapterState";
import { generateCultureLabel } from "./cultureLabel";

function completedChoices() {
  let state = createChapterFromActOne("hongqu_red");
  for (const event of [
    { type: "ACT2_TALK_MASTER" },
    { type: "ACT2_INSPECT_TRAY" },
    { type: "ACT2_INSPECT_JAR" },
    { type: "ACT2_TAKE_SAMPLE" },
    { type: "ACT2_COMPLETE_STEP", step: "mix" },
    { type: "ACT2_COMPLETE_STEP", step: "vat" },
    { type: "ACT2_COMPLETE_STEP", step: "seal" },
    { type: "ACT2_CHOOSE_QUESTION", choice: "ask_winter" },
    { type: "ACT3_TALK_FAMILY" },
    { type: "ACT3_COLLECT_MATERIAL", material: "bowl" },
    { type: "ACT3_COLLECT_MATERIAL", material: "noodles" },
    { type: "ACT3_COLLECT_MATERIAL", material: "laojiu" },
    { type: "ACT3_COOK" },
    { type: "ACT3_SERVE" },
    { type: "ACT3_CHOOSE_INSCRIPTION", choice: "warm" },
    { type: "ACT4_TALK_MIA" },
    {
      type: "ACT4_CHOOSE_EXPLANATION",
      choice: "three_generations"
    }
  ] as const) {
    state = reduceChapter(state, event);
  }
  return state;
}

describe("local culture label", () => {
  it("generates the same bilingual label for the same path", () => {
    const state = completedChoices();

    expect(generateCultureLabel(state)).toEqual(
      generateCultureLabel(state)
    );
    expect(generateCultureLabel(state)).toMatchObject({
      chineseName: "红曲家书",
      englishName: "A Letter in Red Yeast",
      templateSource: "LOCAL_TEMPLATE_V1"
    });
  });

  it("changes only creative expression when the player retries", () => {
    const original = generateCultureLabel(completedChoices());
    const retriedState = {
      ...completedChoices(),
      labelTemplate: 1 as const,
      labelRetryUsed: true
    };
    const retried = generateCultureLabel(retriedState);

    expect(retried.creativeText).not.toBe(original.creativeText);
    expect(retried.culturalFact).toBe(original.culturalFact);
    expect(retried.englishIntro).toBe(original.englishIntro);
    expect(retried.pathHash).toBe(original.pathHash);
  });

  it("keeps cultural facts separate from creative copy", () => {
    const label = generateCultureLabel(completedChoices());

    expect(label.culturalFact).toContain("福建红曲黄酒");
    expect(label.culturalFact).not.toMatch(
      /最早的黄酒|世界三大古酒|唯一源自中国/
    );
    expect(label.creativeText).toContain("太婆");
  });

});
