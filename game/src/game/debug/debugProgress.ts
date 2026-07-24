import { reduceAct1 } from "../domain/act1Reducer";
import { createInitialAct1State } from "../domain/act1State";
import { reduceChapter } from "../domain/chapterReducer";
import {
  createChapterFromActOne,
  type ChapterAct,
  type ChapterOneSaveV2
} from "../domain/chapterState";
import { sceneForChapterAct } from "../domain/ChapterRoute";
import { reduceLongjing } from "../domain/longjingReducer";
import {
  createLongjingState,
  longjingFiringDecision,
  type LongjingAct,
  type LongjingSaveV1
} from "../domain/longjingState";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { SaveService } from "../systems/SaveService";

type WritableStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export type DebugStageResult = {
  sceneKey: string;
  label: string;
};

const NEXT_STAGE: Readonly<
  Record<string, { chapter: "one" | "two"; act: ChapterAct | LongjingAct }>
> = {
  Apartment: { chapter: "one", act: 2 },
  MemoryTransition: { chapter: "one", act: 2 },
  ActOneComplete: { chapter: "one", act: 2 },
  ActTwo: { chapter: "one", act: 3 },
  ActThree: { chapter: "one", act: 4 },
  ActFour: { chapter: "one", act: "film" },
  HuangjiuFilm: { chapter: "one", act: "complete" },
  ChapterComplete: { chapter: "two", act: "market" },
  LongjingMarket: { chapter: "two", act: "terrace" },
  LongjingTerrace: { chapter: "two", act: "workshop" },
  LongjingWorkshop: { chapter: "two", act: "truth" },
  LongjingTruth: { chapter: "two", act: "film" },
  LongjingFilm: { chapter: "two", act: "complete" }
};

const STAGE_LABELS: Readonly<Record<string, string>> = {
  ActTwo: "第一章 · 冬酿坊",
  ActThree: "第一章 · 家宴",
  ActFour: "第一章 · 归",
  HuangjiuFilm: "第一章 · 文化短片",
  ChapterComplete: "第一章 · 完成",
  LongjingMarket: "第二章 · 旧茶市场",
  LongjingTerrace: "第二章 · 清明茶园",
  LongjingWorkshop: "第二章 · 炒茶工坊",
  LongjingTruth: "第二章 · 名字的重量",
  LongjingFilm: "第二章 · 文化短片",
  LongjingComplete: "第二章 · 完成"
};

function completedActOne() {
  let state = createInitialAct1State();
  state = reduceAct1(state, { type: "MOVED", distanceTiles: 3 });
  state = reduceAct1(state, { type: "ACQUIRE_NOTE" });
  state = reduceAct1(state, { type: "READ_NOTE" });
  state = reduceAct1(state, { type: "MIA_ENTERED" });
  state = reduceAct1(state, { type: "INSPECT_JAR" });
  state = reduceAct1(state, {
    type: "CHOOSE_SENSE",
    choice: "hongqu_red"
  });
  state = reduceAct1(state, { type: "START_OPEN_JAR" });
  return reduceAct1(state, { type: "COMPLETE" });
}

function chapterAt(act: ChapterAct): ChapterOneSaveV2 {
  let state = createChapterFromActOne("hongqu_red");
  if (act === 2) return state;

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
  state = reduceChapter(state, {
    type: "ACT2_CHOOSE_QUESTION",
    choice: "ask_hongqu"
  });
  if (act === 3) return state;

  state = reduceChapter(state, { type: "ACT3_TALK_FAMILY" });
  for (const material of ["bowl", "noodles", "laojiu"] as const) {
    state = reduceChapter(state, {
      type: "ACT3_COLLECT_MATERIAL",
      material
    });
  }
  state = reduceChapter(state, { type: "ACT3_COOK" });
  state = reduceChapter(state, { type: "ACT3_PICK_UP_NOODLES" });
  state = reduceChapter(state, { type: "ACT3_SERVE" });
  state = reduceChapter(state, {
    type: "ACT3_CHOOSE_INSCRIPTION",
    choice: "remember"
  });
  if (act === 4) return state;

  state = reduceChapter(state, { type: "ACT4_TALK_MIA" });
  state = reduceChapter(state, {
    type: "ACT4_CHOOSE_EXPLANATION",
    choice: "fujian_hongqu"
  });
  state = reduceChapter(state, { type: "ACT4_GENERATE_LABEL" });
  state = reduceChapter(state, { type: "ACT4_ACCEPT_LABEL" });
  state = reduceChapter(state, { type: "ACT4_SAVE_LABEL" });
  if (act === "film") return state;

  return reduceChapter(state, { type: "FILM_SKIPPED" });
}

function longjingAt(act: LongjingAct): LongjingSaveV1 {
  let state = createLongjingState();
  if (act === "market") return state;

  state = reduceLongjing(state, { type: "MARKET_TALK_VENDOR" });
  state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_A" });
  state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_B" });
  state = reduceLongjing(state, { type: "MARKET_CHECK_RECORDS" });
  state = reduceLongjing(state, { type: "MARKET_COMPLETE_BOARD" });
  state = reduceLongjing(state, { type: "MARKET_TOUCH_TEA_SCOOP" });
  if (act === "terrace") return state;

  state = reduceLongjing(state, { type: "TERRACE_START_PICKING" });
  for (let index = 0; index < 12; index += 1) {
    state = reduceLongjing(state, {
      type: "TERRACE_JUDGE_LEAF",
      leaf: "tender",
      decision: "pick"
    });
  }
  if (act === "workshop") return state;

  state = reduceLongjing(state, { type: "WORKSHOP_BEGIN_FIRING" });
  while (state.firingStep < 5) {
    const decision = longjingFiringDecision(state);
    if (decision === null) break;
    state = reduceLongjing(state, {
      type: "WORKSHOP_CHOOSE_ACTION",
      action: decision.idealActions[0]
    });
  }
  state = reduceLongjing(state, { type: "WORKSHOP_REVEAL_REFUSAL" });
  if (act === "truth") return state;

  state = reduceLongjing(state, { type: "TRUTH_OPEN_LEDGER" });
  state = reduceLongjing(state, {
    type: "TRUTH_COLLECT_EVIDENCE",
    evidence: "evidence_original_batch"
  });
  state = reduceLongjing(state, {
    type: "TRUTH_COLLECT_EVIDENCE",
    evidence: "evidence_refusal_copy"
  });
  state = reduceLongjing(state, { type: "TRUTH_COMPLETE_BOARD" });
  state = reduceLongjing(state, {
    type: "TRUTH_CHOOSE_INSCRIPTION",
    inscription: "keep_truth"
  });
  if (act === "film") return state;

  return reduceLongjing(state, { type: "LONGJING_FILM_SKIPPED" });
}

function unique(items: readonly string[]): string[] {
  return [...new Set(items)];
}

function preserveChapterRewards(
  next: ChapterOneSaveV2,
  current: ChapterOneSaveV2 | null
): ChapterOneSaveV2 {
  if (current === null) return next;
  return {
    ...next,
    relics: unique([...next.relics, ...current.relics]),
    cultureCards: unique([
      ...next.cultureCards,
      ...current.cultureCards
    ])
  };
}

function preserveLongjingRewards(
  next: LongjingSaveV1,
  current: LongjingSaveV1 | null
): LongjingSaveV1 {
  if (current === null) return next;
  return {
    ...next,
    relics: unique([...next.relics, ...current.relics]),
    cultureCards: unique([
      ...next.cultureCards,
      ...current.cultureCards
    ])
  };
}

export function advanceDebugStage(
  currentSceneKey: string,
  storage: WritableStorage,
  sessionStorage?: Pick<Storage, "setItem">
): DebugStageResult | null {
  const target = NEXT_STAGE[currentSceneKey];
  if (target === undefined) return null;

  if (target.chapter === "one") {
    new SaveService(storage).save(completedActOne());
    const chapterService = new ChapterSaveService(storage);
    const next = preserveChapterRewards(
      chapterAt(target.act as ChapterAct),
      chapterService.load()
    );
    chapterService.save(next);
    sessionStorage?.setItem("gleanings.active-chapter.v1", "one");
    const sceneKey = sceneForChapterAct(next.currentAct);
    return {
      sceneKey,
      label: STAGE_LABELS[sceneKey] ?? sceneKey
    };
  }

  const longjingService = new LongjingSaveService(storage);
  const next = preserveLongjingRewards(
    longjingAt(target.act as LongjingAct),
    longjingService.load()
  );
  longjingService.save(next);
  sessionStorage?.setItem("gleanings.active-chapter.v1", "two");
  const sceneKey = sceneForLongjingAct(next.currentAct);
  return {
    sceneKey,
    label: STAGE_LABELS[sceneKey] ?? sceneKey
  };
}
