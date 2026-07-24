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
};

export type LongjingFiringDecision = LongjingFiringRound & {
  choices: readonly [
    LongjingFiringAction,
    LongjingFiringAction,
    LongjingFiringAction
  ];
  idealActions: readonly [
    LongjingFiringAction,
    LongjingFiringAction
  ];
};

export const LONGJING_FIRING_ROUNDS = [
    {
      id: "spread_heat",
      stage: "青锅",
      cue: "鲜叶刚入锅，叶片挤在一起，受热不均。",
      hint: "先判断锅温与叶片拥挤程度，再让热气散出去。"
    },
    {
      id: "guide_leaf",
      stage: "青锅",
      cue: "叶片已经变软，边缘仍带着水汽。",
      hint: "前一手改变了叶片位置，这一手要继续看形与水汽。"
    },
    {
      id: "redistribute_moisture",
      stage: "回潮",
      cue: "叶片外层干得更快，内外水分还没有重新分布。",
      hint: "含水仍高时先散湿；已经轻下来的叶片可以开始理条。"
    },
    {
      id: "straighten",
      stage: "辉锅",
      cue: "叶条已经回软，可以理直，但还不能重压。",
      hint: "手心温度与叶条松紧，会改变这一轮可用的动作。"
    },
    {
      id: "finish_dry",
      stage: "辉锅",
      cue: "锅里的声音轻下来了，叶片接近足干。",
      hint: "最后看成形程度，收住表面，准备起锅。"
    }
  ] as const satisfies readonly LongjingFiringRound[];

type LongjingFiringSnapshot = {
  firingStep: number;
  firingHeat: number;
  firingMoisture: number;
  firingShape: number;
};

export function longjingFiringDecision(
  state: LongjingFiringSnapshot
): LongjingFiringDecision | null {
  const round = LONGJING_FIRING_ROUNDS[state.firingStep];
  if (round === undefined) return null;

  const decision = (
    choices: LongjingFiringDecision["choices"],
    idealActions: LongjingFiringDecision["idealActions"]
  ): LongjingFiringDecision => ({
    ...round,
    choices,
    idealActions
  });

  switch (state.firingStep) {
    case 0:
      return state.firingHeat <= 1
        ? decision(["抖", "带", "压"], ["抖", "带"])
        : decision(["摊放", "抖", "甩"], ["摊放", "抖"]);
    case 1:
      return state.firingShape === 0
        ? decision(["带", "挺", "扣"], ["带", "挺"])
        : decision(["抖", "甩", "挤"], ["抖", "甩"]);
    case 2:
      return state.firingMoisture >= 3
        ? decision(["摊放", "抖", "磨"], ["摊放", "抖"])
        : decision(["挺", "拓", "抓"], ["挺", "拓"]);
    case 3:
      return state.firingHeat >= 4
        ? decision(["摊放", "挺", "压"], ["摊放", "挺"])
        : decision(["挺", "拓", "带"], ["挺", "带"]);
    case 4:
      return state.firingShape <= 2
        ? decision(["挺", "抓", "磨"], ["挺", "抓"])
        : decision(["磨", "抓", "甩"], ["磨", "抓"]);
    default:
      return null;
  }
}

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
  firingHeat: number;
  firingMoisture: number;
  firingShape: number;
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
    firingHeat: 1,
    firingMoisture: 5,
    firingShape: 0,
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
