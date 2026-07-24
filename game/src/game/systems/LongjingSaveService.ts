import type { TilePosition } from "../domain/act1State";
import {
  LONGJING_MARKET_SPAWN,
  LONGJING_TERRACE_SPAWN,
  LONGJING_TRUTH_SPAWN,
  LONGJING_WORKSHOP_SPAWN,
  createLongjingState,
  type LongjingAct,
  type LongjingEvidence,
  type LongjingInscription,
  type LongjingLeafKind,
  type LongjingMarketPhase,
  type LongjingSaveV1,
  type LongjingTerracePhase,
  type LongjingTruthPhase,
  type LongjingWorkshopPhase
} from "../domain/longjingState";

type StorageLike = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const ACTS: LongjingAct[] = [
  "market",
  "terrace",
  "workshop",
  "truth",
  "film",
  "complete"
];
const MARKET_PHASES: LongjingMarketPhase[] = [
  "ARRIVE",
  "INSPECT_TIN_A",
  "INSPECT_TIN_B",
  "RECORDS",
  "BOARD",
  "TEA_SCOOP",
  "COMPLETE"
];
const TERRACE_PHASES: LongjingTerracePhase[] = [
  "ARRIVE",
  "PICKING",
  "COMPLETE"
];
const WORKSHOP_PHASES: LongjingWorkshopPhase[] = [
  "ARRIVE",
  "FIRING",
  "MEMORY",
  "COMPLETE"
];
const TRUTH_PHASES: LongjingTruthPhase[] = [
  "ARRIVE",
  "COLLECT",
  "BOARD",
  "INSCRIPTION",
  "COMPLETE"
];
const LEAF_KINDS: LongjingLeafKind[] = [
  "tender",
  "too_young",
  "mature",
  "wet",
  "damaged"
];
const EVIDENCE: LongjingEvidence[] = [
  "evidence_tin_a",
  "evidence_duplicate_batch",
  "evidence_date_conflict",
  "evidence_flow_record",
  "evidence_old_signature",
  "evidence_original_batch",
  "evidence_refusal_copy"
];
const INSCRIPTIONS: LongjingInscription[] = [
  "restore_name",
  "keep_truth",
  "pass_on"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function enumValue<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function nullableEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string")
    )
  ];
}

function enumArray<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T[] {
  return stringArray(value).filter((item): item is T =>
    allowed.includes(item as T)
  );
}

function safeCount(value: unknown, maximum: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.round(value)));
}

function dimensionsForAct(act: LongjingAct): {
  width: number;
  height: number;
  spawn: TilePosition;
} {
  switch (act) {
    case "market":
      return {
        width: 38,
        height: 26,
        spawn: LONGJING_MARKET_SPAWN
      };
    case "terrace":
      return {
        width: 48,
        height: 32,
        spawn: LONGJING_TERRACE_SPAWN
      };
    case "workshop":
      return {
        width: 40,
        height: 28,
        spawn: LONGJING_WORKSHOP_SPAWN
      };
    case "truth":
      return {
        width: 34,
        height: 24,
        spawn: LONGJING_TRUTH_SPAWN
      };
    case "film":
    case "complete":
      return { width: 1, height: 1, spawn: { x: 0, y: 0 } };
  }
}

function safeTile(value: unknown, act: LongjingAct): TilePosition {
  const { width, height, spawn } = dimensionsForAct(act);
  if (!isRecord(value)) return { ...spawn };
  const { x, y } = value;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  ) {
    return { ...spawn };
  }
  return { x, y };
}

function isProgressConsistent(state: LongjingSaveV1): boolean {
  switch (state.currentAct) {
    case "market":
      return state.marketPhase !== "COMPLETE";
    case "terrace":
      return (
        state.marketPhase === "COMPLETE" &&
        state.terracePhase !== "COMPLETE" &&
        state.pickAttempts < 12
      );
    case "workshop":
      return (
        state.marketPhase === "COMPLETE" &&
        state.terracePhase === "COMPLETE" &&
        state.workshopPhase !== "COMPLETE" &&
        ((state.workshopPhase === "ARRIVE" &&
          state.firingStep === 0) ||
          (state.workshopPhase === "FIRING" &&
            state.firingStep < LONGJING_FIRING_ROUNDS_COUNT) ||
          (state.workshopPhase === "MEMORY" &&
            state.firingStep === LONGJING_FIRING_ROUNDS_COUNT))
      );
    case "truth":
      return (
        state.marketPhase === "COMPLETE" &&
        state.terracePhase === "COMPLETE" &&
        state.workshopPhase === "COMPLETE" &&
        state.truthPhase !== "COMPLETE"
      );
    case "film":
      return (
        state.marketPhase === "COMPLETE" &&
        state.terracePhase === "COMPLETE" &&
        state.workshopPhase === "COMPLETE" &&
        state.truthPhase === "COMPLETE" &&
        state.inscription !== null
      );
    case "complete":
      return (
        state.marketPhase === "COMPLETE" &&
        state.terracePhase === "COMPLETE" &&
        state.workshopPhase === "COMPLETE" &&
        state.truthPhase === "COMPLETE" &&
        state.inscription !== null &&
        state.filmSeen &&
        state.chapterComplete
      );
  }
}

const LONGJING_FIRING_ROUNDS_COUNT = 5;

export class LongjingSaveService {
  static readonly STORAGE_KEY = "gleanings.chapter-two.save.v1";
  static readonly CORRUPT_KEY = "gleanings.chapter-two.corrupt";

  constructor(private readonly storage: StorageLike) {}

  create(): LongjingSaveV1 {
    const state = createLongjingState();
    this.save(state);
    return state;
  }

  save(state: LongjingSaveV1): void {
    this.storage.setItem(
      LongjingSaveService.STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  load(): LongjingSaveV1 | null {
    const raw = this.storage.getItem(LongjingSaveService.STORAGE_KEY);
    if (raw === null) return null;
    try {
      const normalized = this.normalize(JSON.parse(raw) as unknown);
      if (normalized === null) this.backUp(raw);
      return normalized;
    } catch {
      this.backUp(raw);
      return null;
    }
  }

  clear(): void {
    this.storage.removeItem(LongjingSaveService.STORAGE_KEY);
  }

  private backUp(raw: string): void {
    this.storage.setItem(LongjingSaveService.CORRUPT_KEY, raw);
  }

  private normalize(value: unknown): LongjingSaveV1 | null {
    if (
      !isRecord(value) ||
      value.version !== 1 ||
      !ACTS.includes(value.currentAct as LongjingAct)
    ) {
      return null;
    }
    const base = createLongjingState();
    const currentAct = value.currentAct as LongjingAct;
    const pickedLeaves = enumArray(value.pickedLeaves, LEAF_KINDS);
    const firingStep = safeCount(value.firingStep, 5);
    const normalized: LongjingSaveV1 = {
      ...base,
      currentAct,
      checkpoint:
        typeof value.checkpoint === "string"
          ? value.checkpoint
          : base.checkpoint,
      marketPhase: enumValue(
        value.marketPhase,
        MARKET_PHASES,
        base.marketPhase
      ),
      terracePhase: enumValue(
        value.terracePhase,
        TERRACE_PHASES,
        base.terracePhase
      ),
      workshopPhase: enumValue(
        value.workshopPhase,
        WORKSHOP_PHASES,
        base.workshopPhase
      ),
      truthPhase: enumValue(
        value.truthPhase,
        TRUTH_PHASES,
        base.truthPhase
      ),
      evidence: enumArray(value.evidence, EVIDENCE),
      pickAttempts: safeCount(value.pickAttempts, 12),
      pickCorrect: safeCount(value.pickCorrect, 12),
      pickedLeaves,
      firingStep,
      firingScore: safeCount(value.firingScore, 5),
      firingMistakes: safeCount(value.firingMistakes, 5),
      firingRetryUsed: value.firingRetryUsed === true,
      firingHeat:
        typeof value.firingHeat === "number"
          ? safeCount(value.firingHeat, 5)
          : base.firingHeat,
      firingMoisture:
        typeof value.firingMoisture === "number"
          ? safeCount(value.firingMoisture, 5)
          : base.firingMoisture,
      firingShape: safeCount(value.firingShape, 5),
      inscription: nullableEnum(value.inscription, INSCRIPTIONS),
      filmSeen: value.filmSeen === true,
      chapterComplete: value.chapterComplete === true,
      inventory: stringArray(value.inventory),
      relics: stringArray(value.relics),
      cultureCards: stringArray(value.cultureCards),
      playerTile: safeTile(value.playerTile, currentAct)
    };
    return isProgressConsistent(normalized) ? normalized : null;
  }
}
