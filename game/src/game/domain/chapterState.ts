import type { SenseChoice, TilePosition } from "./act1State";

export const ACT2_SPAWN_TILE = Object.freeze({ x: 20, y: 24 });
export const ACT3_SPAWN_TILE = Object.freeze({ x: 17, y: 21 });
export const ACT4_SPAWN_TILE = Object.freeze({ x: 14, y: 15 });

export type Act2Phase =
  | "ARRIVE"
  | "INSPECT_TRAY"
  | "INSPECT_JAR"
  | "TAKE_SAMPLE"
  | "MIX"
  | "VAT"
  | "SEAL"
  | "QUESTION"
  | "COMPLETE";

export type Act2Question =
  | "ask_hongqu"
  | "ask_winter"
  | "ask_future";

export type Act3Phase =
  | "ARRIVE"
  | "COLLECT"
  | "READY_TO_COOK"
  | "COOKED"
  | "INSCRIPTION"
  | "COMPLETE";

export type Act3Material = "bowl" | "noodles" | "laojiu";
export type Act3Inscription = "warm" | "inherit" | "remember";

export type Act4Phase =
  | "ARRIVE"
  | "EXPLANATION"
  | "LABEL"
  | "REVIEW"
  | "MINT"
  | "COMPLETE";

export type Act4Explanation =
  | "letter"
  | "three_generations"
  | "fujian_hongqu";

export type ChapterAct = 2 | 3 | 4 | "film" | "complete";

export type ChapterOneSaveV2 = {
  version: 2;
  currentAct: ChapterAct;
  checkpoint: string;
  act1Sense: SenseChoice;
  act2Phase: Act2Phase;
  act2Question: Act2Question | null;
  act3Phase: Act3Phase;
  act3Materials: Act3Material[];
  act3Inscription: Act3Inscription | null;
  act4Phase: Act4Phase;
  act4Explanation: Act4Explanation | null;
  labelTemplate: 0 | 1;
  labelRetryUsed: boolean;
  cultureFilmSeen: boolean;
  chapterComplete: boolean;
  inventory: string[];
  relics: string[];
  cultureCards: string[];
  playerTile: TilePosition;
};

export function createChapterFromActOne(
  senseChoice: SenseChoice
): ChapterOneSaveV2 {
  return {
    version: 2,
    currentAct: 2,
    checkpoint: "act2_arrive",
    act1Sense: senseChoice,
    act2Phase: "ARRIVE",
    act2Question: null,
    act3Phase: "ARRIVE",
    act3Materials: [],
    act3Inscription: null,
    act4Phase: "ARRIVE",
    act4Explanation: null,
    labelTemplate: 0,
    labelRetryUsed: false,
    cultureFilmSeen: false,
    chapterComplete: false,
    inventory: [],
    relics: [],
    cultureCards: [],
    playerTile: { ...ACT2_SPAWN_TILE }
  };
}

export function spawnForAct(act: ChapterAct): TilePosition {
  switch (act) {
    case 2:
      return { ...ACT2_SPAWN_TILE };
    case 3:
      return { ...ACT3_SPAWN_TILE };
    case 4:
      return { ...ACT4_SPAWN_TILE };
    case "film":
    case "complete":
      return { x: 0, y: 0 };
  }
}
