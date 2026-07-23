import type { SenseChoice, TilePosition } from "../domain/act1State";
import {
  ACT2_SPAWN_TILE,
  ACT3_SPAWN_TILE,
  ACT4_SPAWN_TILE,
  createChapterFromActOne,
  type Act2Phase,
  type Act2Question,
  type Act3Inscription,
  type Act3Material,
  type Act3Phase,
  type Act4Explanation,
  type Act4Phase,
  type ChapterAct,
  type ChapterOneSaveV2
} from "../domain/chapterState";

type StorageLike = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

const SENSE_CHOICES: SenseChoice[] = [
  "aroma",
  "hongqu_red",
  "cold_clay"
];
const CHAPTER_ACTS: ChapterAct[] = [
  2,
  3,
  4,
  "film",
  "complete"
];
const ACT2_PHASES: Act2Phase[] = [
  "ARRIVE",
  "INSPECT_TRAY",
  "INSPECT_JAR",
  "TAKE_SAMPLE",
  "MIX",
  "VAT",
  "SEAL",
  "QUESTION",
  "COMPLETE"
];
const ACT2_QUESTIONS: Act2Question[] = [
  "ask_hongqu",
  "ask_winter",
  "ask_future"
];
const ACT3_PHASES: Act3Phase[] = [
  "ARRIVE",
  "COLLECT",
  "READY_TO_COOK",
  "COOKED",
  "INSCRIPTION",
  "COMPLETE"
];
const ACT3_MATERIALS: Act3Material[] = [
  "bowl",
  "noodles",
  "laojiu"
];
const ACT3_INSCRIPTIONS: Act3Inscription[] = [
  "warm",
  "inherit",
  "remember"
];
const ACT4_PHASES: Act4Phase[] = [
  "ARRIVE",
  "EXPLANATION",
  "LABEL",
  "REVIEW",
  "MINT",
  "COMPLETE"
];
const ACT4_EXPLANATIONS: Act4Explanation[] = [
  "letter",
  "three_generations",
  "fujian_hongqu"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string")
    )
  ];
}

function enumValue<T extends string | number>(
  value: unknown,
  values: readonly T[],
  fallback: T
): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function nullableEnum<T extends string>(
  value: unknown,
  values: readonly T[]
): T | null {
  return values.includes(value as T) ? (value as T) : null;
}

function dimensionsForAct(act: ChapterAct): {
  width: number;
  height: number;
  spawn: TilePosition;
} {
  switch (act) {
    case 2:
      return { width: 44, height: 30, spawn: ACT2_SPAWN_TILE };
    case 3:
      return { width: 36, height: 26, spawn: ACT3_SPAWN_TILE };
    case 4:
      return { width: 30, height: 20, spawn: ACT4_SPAWN_TILE };
    case "film":
    case "complete":
      return { width: 1, height: 1, spawn: { x: 0, y: 0 } };
  }
}

function validTile(value: unknown, act: ChapterAct): TilePosition {
  const { width, height, spawn } = dimensionsForAct(act);
  if (!isRecord(value)) return { ...spawn };
  const x = value.x;
  const y = value.y;
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

export class ChapterSaveService {
  static readonly STORAGE_KEY = "gleanings.chapter-one.save.v2";
  static readonly CORRUPT_KEY = "gleanings.chapter-one.corrupt";
  static readonly LEGACY_KEY = "gleanings.act1.save.v1";

  constructor(private readonly storage: StorageLike) {}

  save(state: ChapterOneSaveV2): void {
    this.storage.setItem(
      ChapterSaveService.STORAGE_KEY,
      JSON.stringify(state)
    );
  }

  load(): ChapterOneSaveV2 | null {
    const raw = this.storage.getItem(ChapterSaveService.STORAGE_KEY);
    if (raw === null) return this.createFromLegacy();

    try {
      const normalized = this.normalize(JSON.parse(raw) as unknown);
      if (normalized === null) {
        this.backUpCorrupt(raw);
      }
      return normalized;
    } catch {
      this.backUpCorrupt(raw);
      return null;
    }
  }

  createFromActOne(choice: SenseChoice): ChapterOneSaveV2 {
    const state = createChapterFromActOne(choice);
    this.save(state);
    return state;
  }

  clearAll(): void {
    this.storage.removeItem(ChapterSaveService.STORAGE_KEY);
    this.storage.removeItem(ChapterSaveService.LEGACY_KEY);
  }

  private createFromLegacy(): ChapterOneSaveV2 | null {
    const raw = this.storage.getItem(ChapterSaveService.LEGACY_KEY);
    if (raw === null) return null;
    try {
      const legacy: unknown = JSON.parse(raw);
      if (
        !isRecord(legacy) ||
        legacy.version !== 1 ||
        legacy.phase !== "COMPLETE" ||
        legacy.act1Complete !== true ||
        !SENSE_CHOICES.includes(legacy.senseChoice as SenseChoice)
      ) {
        return null;
      }
      const state = createChapterFromActOne(
        legacy.senseChoice as SenseChoice
      );
      this.save(state);
      return state;
    } catch {
      return null;
    }
  }

  private backUpCorrupt(raw: string): void {
    this.storage.setItem(ChapterSaveService.CORRUPT_KEY, raw);
  }

  private normalize(value: unknown): ChapterOneSaveV2 | null {
    if (
      !isRecord(value) ||
      value.version !== 2 ||
      !SENSE_CHOICES.includes(value.act1Sense as SenseChoice) ||
      !CHAPTER_ACTS.includes(value.currentAct as ChapterAct)
    ) {
      return null;
    }

    const act1Sense = value.act1Sense as SenseChoice;
    const currentAct = value.currentAct as ChapterAct;
    const base = createChapterFromActOne(act1Sense);
    const rawMaterials = Array.isArray(value.act3Materials)
      ? value.act3Materials
      : [];
    const act3Materials = [
      ...new Set(
        rawMaterials.filter((material): material is Act3Material =>
          ACT3_MATERIALS.includes(material as Act3Material)
        )
      )
    ];

    return {
      ...base,
      currentAct,
      checkpoint:
        typeof value.checkpoint === "string"
          ? value.checkpoint
          : base.checkpoint,
      act2Phase: enumValue(
        value.act2Phase,
        ACT2_PHASES,
        base.act2Phase
      ),
      act2Question: nullableEnum(
        value.act2Question,
        ACT2_QUESTIONS
      ),
      act3Phase: enumValue(
        value.act3Phase,
        ACT3_PHASES,
        base.act3Phase
      ),
      act3Materials,
      act3Inscription: nullableEnum(
        value.act3Inscription,
        ACT3_INSCRIPTIONS
      ),
      act4Phase: enumValue(
        value.act4Phase,
        ACT4_PHASES,
        base.act4Phase
      ),
      act4Explanation: nullableEnum(
        value.act4Explanation,
        ACT4_EXPLANATIONS
      ),
      labelTemplate: value.labelTemplate === 1 ? 1 : 0,
      labelRetryUsed: value.labelRetryUsed === true,
      cultureFilmSeen: value.cultureFilmSeen === true,
      chapterComplete: value.chapterComplete === true,
      inventory: strings(value.inventory),
      relics: strings(value.relics),
      cultureCards: strings(value.cultureCards),
      playerTile: validTile(value.playerTile, currentAct)
    };
  }
}
