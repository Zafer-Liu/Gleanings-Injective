import { describe, expect, it } from "vitest";
import {
  ACT2_SPAWN_TILE,
  ACT3_SPAWN_TILE,
  ACT4_SPAWN_TILE,
  createChapterFromActOne
} from "./chapterState";
import { reduceChapter } from "./chapterReducer";

function reachActTwoQuestion(
  sense: "aroma" | "hongqu_red" | "cold_clay" = "aroma"
) {
  let state = createChapterFromActOne(sense);
  state = reduceChapter(state, { type: "ACT2_TALK_MASTER" });
  state = reduceChapter(state, { type: "ACT2_INSPECT_TRAY" });
  state = reduceChapter(state, { type: "ACT2_INSPECT_JAR" });
  state = reduceChapter(state, { type: "ACT2_TAKE_SAMPLE" });
  state = reduceChapter(state, {
    type: "ACT2_COMPLETE_STEP",
    step: "mix"
  });
  state = reduceChapter(state, {
    type: "ACT2_COMPLETE_STEP",
    step: "vat"
  });
  state = reduceChapter(state, {
    type: "ACT2_COMPLETE_STEP",
    step: "seal"
  });
  return state;
}

function reachActThreeCollecting() {
  let state = reachActTwoQuestion();
  state = reduceChapter(state, {
    type: "ACT2_CHOOSE_QUESTION",
    choice: "ask_hongqu"
  });
  return reduceChapter(state, { type: "ACT3_TALK_FAMILY" });
}

function reachActFour() {
  let state = reachActThreeCollecting();
  for (const material of ["bowl", "noodles", "laojiu"] as const) {
    state = reduceChapter(state, {
      type: "ACT3_COLLECT_MATERIAL",
      material
    });
  }
  state = reduceChapter(state, { type: "ACT3_COOK" });
  state = reduceChapter(state, { type: "ACT3_SERVE" });
  return reduceChapter(state, {
    type: "ACT3_CHOOSE_INSCRIPTION",
    choice: "warm"
  });
}

describe("chapter one v2 progression", () => {
  it("creates act two from a completed act one choice", () => {
    const chapter = createChapterFromActOne("cold_clay");

    expect(chapter.currentAct).toBe(2);
    expect(chapter.act1Sense).toBe("cold_clay");
    expect(chapter.checkpoint).toBe("act2_arrive");
    expect(chapter.playerTile).toEqual(ACT2_SPAWN_TILE);
  });

  it("requires the two inspections before taking a red-yeast sample", () => {
    let state = createChapterFromActOne("aroma");
    state = reduceChapter(state, { type: "ACT2_TALK_MASTER" });
    const awaitingTray = state;

    const tooEarly = reduceChapter(state, { type: "ACT2_TAKE_SAMPLE" });
    state = reduceChapter(state, { type: "ACT2_INSPECT_TRAY" });
    const awaitingJar = state;
    const stillEarly = reduceChapter(state, { type: "ACT2_TAKE_SAMPLE" });
    state = reduceChapter(state, { type: "ACT2_INSPECT_JAR" });
    const acquired = reduceChapter(state, { type: "ACT2_TAKE_SAMPLE" });

    expect(tooEarly).toBe(awaitingTray);
    expect(tooEarly.act2Phase).toBe("INSPECT_TRAY");
    expect(stillEarly).toBe(awaitingJar);
    expect(stillEarly.act2Phase).toBe("INSPECT_JAR");
    expect(acquired.act2Phase).toBe("MIX");
    expect(acquired.inventory).toContain("item_hongqu_sample");
  });

  it("keeps winter brewing steps in seasonal order", () => {
    let state = createChapterFromActOne("hongqu_red");
    state = reduceChapter(state, { type: "ACT2_TALK_MASTER" });
    state = reduceChapter(state, { type: "ACT2_INSPECT_TRAY" });
    state = reduceChapter(state, { type: "ACT2_INSPECT_JAR" });
    state = reduceChapter(state, { type: "ACT2_TAKE_SAMPLE" });

    const wrongVat = reduceChapter(state, {
      type: "ACT2_COMPLETE_STEP",
      step: "vat"
    });
    const mixed = reduceChapter(state, {
      type: "ACT2_COMPLETE_STEP",
      step: "mix"
    });
    const sealedTooEarly = reduceChapter(mixed, {
      type: "ACT2_COMPLETE_STEP",
      step: "seal"
    });

    expect(wrongVat).toBe(state);
    expect(mixed.act2Phase).toBe("VAT");
    expect(sealedTooEarly).toBe(mixed);
  });

  it.each([
    ["ask_hongqu", "relic_dongniang_common", "culture_gutian_hongqu"],
    ["ask_winter", "relic_dongniang_rare", "culture_winter_brewing"],
    ["ask_future", "relic_dongniang_rare", "culture_future_blank"]
  ] as const)(
    "records the %s question branch",
    (choice, relic, card) => {
      const complete = reduceChapter(reachActTwoQuestion(), {
        type: "ACT2_CHOOSE_QUESTION",
        choice
      });

      expect(complete.currentAct).toBe(3);
      expect(complete.act2Phase).toBe("COMPLETE");
      expect(complete.act2Question).toBe(choice);
      expect(complete.relics).toContain(relic);
      expect(complete.cultureCards).toContain(card);
      expect(complete.playerTile).toEqual(ACT3_SPAWN_TILE);
    }
  );

  it("awards the legendary blank seal for the cold-clay future path", () => {
    const complete = reduceChapter(reachActTwoQuestion("cold_clay"), {
      type: "ACT2_CHOOSE_QUESTION",
      choice: "ask_future"
    });

    expect(complete.relics).toContain("relic_liubai_legendary");
    expect(complete.relics).not.toContain("relic_dongniang_rare");
  });

  it("collects act three materials in any order and only once", () => {
    let state = reachActThreeCollecting();
    for (const material of ["laojiu", "bowl", "noodles"] as const) {
      state = reduceChapter(state, {
        type: "ACT3_COLLECT_MATERIAL",
        material
      });
    }
    const duplicate = reduceChapter(state, {
      type: "ACT3_COLLECT_MATERIAL",
      material: "bowl"
    });

    expect(state.act3Phase).toBe("READY_TO_COOK");
    expect(state.act3Materials).toEqual(["laojiu", "bowl", "noodles"]);
    expect(duplicate).toBe(state);
  });

  it("rejects cooking before all three materials exist", () => {
    let state = reachActThreeCollecting();
    state = reduceChapter(state, {
      type: "ACT3_COLLECT_MATERIAL",
      material: "bowl"
    });

    const result = reduceChapter(state, { type: "ACT3_COOK" });

    expect(result).toBe(state);
    expect(result.act3Phase).toBe("COLLECT");
  });

  it.each([
    ["warm", "relic_blue_white_cup_warm"],
    ["inherit", "relic_blue_white_cup_inherit"],
    ["remember", "relic_blue_white_cup_remember"]
  ] as const)("records the %s inscription", (choice, relic) => {
    let state = reachActThreeCollecting();
    for (const material of ["bowl", "noodles", "laojiu"] as const) {
      state = reduceChapter(state, {
        type: "ACT3_COLLECT_MATERIAL",
        material
      });
    }
    state = reduceChapter(state, { type: "ACT3_COOK" });
    state = reduceChapter(state, { type: "ACT3_SERVE" });
    state = reduceChapter(state, {
      type: "ACT3_CHOOSE_INSCRIPTION",
      choice
    });

    expect(state.currentAct).toBe(4);
    expect(state.act3Inscription).toBe(choice);
    expect(state.relics).toContain(relic);
    expect(state.playerTile).toEqual(ACT4_SPAWN_TILE);
  });

  it("allows one label retry and then advances through the film", () => {
    let state = reachActFour();
    state = reduceChapter(state, { type: "ACT4_TALK_MIA" });
    state = reduceChapter(state, {
      type: "ACT4_CHOOSE_EXPLANATION",
      choice: "three_generations"
    });
    state = reduceChapter(state, { type: "ACT4_GENERATE_LABEL" });
    state = reduceChapter(state, { type: "ACT4_RETRY_LABEL" });
    const retried = state;
    const secondRetry = reduceChapter(state, {
      type: "ACT4_RETRY_LABEL"
    });
    state = reduceChapter(state, { type: "ACT4_ACCEPT_LABEL" });
    state = reduceChapter(state, { type: "ACT4_DEMO_MINT" });

    expect(secondRetry).toBe(retried);
    expect(secondRetry.labelTemplate).toBe(1);
    expect(secondRetry.labelRetryUsed).toBe(true);
    expect(state.currentAct).toBe("film");
    expect(state.relics).toContain("relic_one_jar_echo");

    const complete = reduceChapter(state, { type: "FILM_SKIPPED" });
    const repeated = reduceChapter(complete, { type: "FILM_SEEN" });

    expect(complete.currentAct).toBe("complete");
    expect(complete.cultureFilmSeen).toBe(true);
    expect(complete.chapterComplete).toBe(true);
    expect(repeated).toBe(complete);
  });

  it("stores integer player tiles without changing progression", () => {
    const state = createChapterFromActOne("aroma");
    const moved = reduceChapter(state, {
      type: "SET_CHAPTER_PLAYER_TILE",
      tile: { x: 19.6, y: 20.4 }
    });

    expect(moved.playerTile).toEqual({ x: 20, y: 20 });
    expect(moved.checkpoint).toBe("act2_arrive");
  });
});
