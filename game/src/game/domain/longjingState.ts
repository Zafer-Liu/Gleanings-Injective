import type { TilePosition } from "./act1State";

export const LONGJING_MARKET_SPAWN = Object.freeze({ x: 18, y: 18 });
export const LONGJING_TERRACE_SPAWN = Object.freeze({ x: 23, y: 21 });
export const LONGJING_WORKSHOP_SPAWN = Object.freeze({ x: 20, y: 19 });
export const LONGJING_TRUTH_SPAWN = Object.freeze({ x: 16, y: 19 });

export type LongjingAct =
  | "market"
  | "terrace"
  | "workshop"
  | "truth"
  | "film"
  | "complete";

export type LongjingMarketPhase =
  | "ARRIVE"
  | "INSPECT_TIN_A"
  | "INSPECT_TIN_B"
  | "RECORDS"
  | "BOARD"
  | "TEA_SCOOP"
  | "COMPLETE";

export type LongjingTerracePhase =
  | "ARRIVE"
  | "PICKING"
  | "COMPLETE";

export type LongjingWorkshopPhase =
  | "ARRIVE"
  | "FIRING"
  | "MEMORY"
  | "COMPLETE";

export type LongjingTruthPhase =
  | "ARRIVE"
  | "COLLECT"
  | "BOARD"
  | "INSCRIPTION"
  | "COMPLETE";

export type LongjingLeafKind =
  | "tender"
  | "too_young"
  | "mature"
  | "wet"
  | "damaged";

export type LongjingFiringAction =
  | "抖"
  | "带"
  | "挤"
  | "甩"
  | "挺"
  | "拓"
  | "扣"
  | "抓"
  | "压"
  | "磨"
  | "摊放";

export type LongjingEvidence =
  | "evidence_tin_a"
  | "evidence_duplicate_batch"
  | "evidence_date_conflict"
  | "evidence_flow_record"
  | "evidence_old_signature"
  | "evidence_original_batch"
  | "evidence_refusal_copy";

export type LongjingInscription =
  | "restore_name"
  | "keep_truth"
  | "pass_on";

export type LongjingFiringRound = {
  id: string;
  stage: "青锅" | "回潮" | "辉锅";
  cue: string;
  hint: string;
  choices: readonly [
    LongjingFiringAction,
    LongjingFiringAction,
    LongjingFiringAction
  ];
  idealAction: LongjingFiringAction;
};

export const LONGJING_FIRING_ROUNDS = [
    {
      id: "spread_heat",
      stage: "青锅",
      cue: "鲜叶刚入锅，叶片挤在一起，受热不均。",
      hint: "先让叶片散开，让热气能够出去。",
      choices: ["抖", "压", "抓"] as const,
      idealAction: "抖"
    },
    {
      id: "guide_leaf",
      stage: "青锅",
      cue: "叶片已经变软，边缘仍带着水汽。",
      hint: "顺着锅壁带动叶片，继续散湿。",
      choices: ["带", "挤", "扣"] as const,
      idealAction: "带"
    },
    {
      id: "redistribute_moisture",
      stage: "回潮",
      cue: "叶片外层干得更快，内外水分还没有重新分布。",
      hint: "这一次不急着动手，让叶片先歇一会儿。",
      choices: ["摊放", "甩", "磨"] as const,
      idealAction: "摊放"
    },
    {
      id: "straighten",
      stage: "辉锅",
      cue: "叶条已经回软，可以理直，但还不能重压。",
      hint: "动作要稳，沿着叶条把形理顺。",
      choices: ["挺", "拓", "压"] as const,
      idealAction: "挺"
    },
    {
      id: "finish_dry",
      stage: "辉锅",
      cue: "锅里的声音轻下来了，叶片接近足干。",
      hint: "最后收住表面与形态，准备起锅。",
      choices: ["磨", "抓", "甩"] as const,
      idealAction: "磨"
    }
  ] as const satisfies readonly LongjingFiringRound[];

export type LongjingSaveV1 = {
  version: 1;
  currentAct: LongjingAct;
  checkpoint: string;
  marketPhase: LongjingMarketPhase;
  terracePhase: LongjingTerracePhase;
  workshopPhase: LongjingWorkshopPhase;
  truthPhase: LongjingTruthPhase;
  evidence: LongjingEvidence[];
  pickAttempts: number;
  pickCorrect: number;
  pickedLeaves: LongjingLeafKind[];
  firingStep: number;
  firingScore: number;
  firingMistakes: number;
  firingRetryUsed: boolean;
  inscription: LongjingInscription | null;
  filmSeen: boolean;
  chapterComplete: boolean;
  inventory: string[];
  relics: string[];
  cultureCards: string[];
  playerTile: TilePosition;
};

export function createLongjingState(): LongjingSaveV1 {
  return {
    version: 1,
    currentAct: "market",
    checkpoint: "longjing_market_arrive",
    marketPhase: "ARRIVE",
    terracePhase: "ARRIVE",
    workshopPhase: "ARRIVE",
    truthPhase: "ARRIVE",
    evidence: [],
    pickAttempts: 0,
    pickCorrect: 0,
    pickedLeaves: [],
    firingStep: 0,
    firingScore: 0,
    firingMistakes: 0,
    firingRetryUsed: false,
    inscription: null,
    filmSeen: false,
    chapterComplete: false,
    inventory: [],
    relics: [],
    cultureCards: [],
    playerTile: { ...LONGJING_MARKET_SPAWN }
  };
}

export function longjingSpawnForAct(act: LongjingAct): TilePosition {
  switch (act) {
    case "market":
      return { ...LONGJING_MARKET_SPAWN };
    case "terrace":
      return { ...LONGJING_TERRACE_SPAWN };
    case "workshop":
      return { ...LONGJING_WORKSHOP_SPAWN };
    case "truth":
      return { ...LONGJING_TRUTH_SPAWN };
    case "film":
    case "complete":
      return { x: 0, y: 0 };
  }
}
