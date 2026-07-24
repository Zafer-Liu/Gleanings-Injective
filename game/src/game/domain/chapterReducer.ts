import type { TilePosition } from "./act1State";
import {
  ACT3_SPAWN_TILE,
  ACT4_SPAWN_TILE,
  type Act2Question,
  type Act3Inscription,
  type Act3Material,
  type Act4Explanation,
  type ChapterOneSaveV2
} from "./chapterState";

export type Act2BrewingStep = "mix" | "vat" | "seal";

export type ChapterEvent =
  | { type: "ACT2_TALK_MASTER" }
  | { type: "ACT2_INSPECT_TRAY" }
  | { type: "ACT2_INSPECT_JAR" }
  | { type: "ACT2_TAKE_SAMPLE" }
  | { type: "ACT2_COMPLETE_STEP"; step: Act2BrewingStep }
  | { type: "ACT2_CHOOSE_QUESTION"; choice: Act2Question }
  | { type: "ACT3_TALK_FAMILY" }
  | { type: "ACT3_COLLECT_MATERIAL"; material: Act3Material }
  | { type: "ACT3_COOK" }
  | { type: "ACT3_SERVE" }
  | {
      type: "ACT3_CHOOSE_INSCRIPTION";
      choice: Act3Inscription;
    }
  | { type: "ACT4_TALK_MIA" }
  | {
      type: "ACT4_CHOOSE_EXPLANATION";
      choice: Act4Explanation;
    }
  | { type: "ACT4_GENERATE_LABEL" }
  | { type: "ACT4_RETRY_LABEL" }
  | { type: "ACT4_ACCEPT_LABEL" }
  | { type: "ACT4_DEMO_MINT" }
  | { type: "FILM_SEEN" }
  | { type: "FILM_SKIPPED" }
  | { type: "SET_CHAPTER_PLAYER_TILE"; tile: TilePosition };

function appendUnique(items: string[], item: string): string[] {
  return items.includes(item) ? items : [...items, item];
}

function without(items: string[], removals: string[]): string[] {
  return items.filter((item) => !removals.includes(item));
}

function finishActTwo(
  state: ChapterOneSaveV2,
  choice: Act2Question
): ChapterOneSaveV2 {
  const cardByChoice: Record<Act2Question, string> = {
    ask_hongqu: "culture_gutian_hongqu",
    ask_winter: "culture_winter_brewing",
    ask_future: "culture_future_blank"
  };
  const relic =
    choice === "ask_hongqu"
      ? "relic_dongniang_common"
      : choice === "ask_future" && state.act1Sense === "cold_clay"
        ? "relic_liubai_legendary"
        : "relic_dongniang_rare";

  return {
    ...state,
    currentAct: 3,
    checkpoint: "act3_arrive",
    act2Phase: "COMPLETE",
    act2Question: choice,
    playerTile: { ...ACT3_SPAWN_TILE },
    inventory: without(state.inventory, ["item_hongqu_sample"]),
    relics: appendUnique(state.relics, relic),
    cultureCards: appendUnique(
      state.cultureCards,
      cardByChoice[choice]
    )
  };
}

export function reduceChapter(
  state: ChapterOneSaveV2,
  event: ChapterEvent
): ChapterOneSaveV2 {
  switch (event.type) {
    case "ACT2_TALK_MASTER":
      return state.currentAct === 2 && state.act2Phase === "ARRIVE"
        ? {
            ...state,
            act2Phase: "INSPECT_TRAY",
            checkpoint: "act2_master"
          }
        : state;

    case "ACT2_INSPECT_TRAY":
      return state.currentAct === 2 &&
        state.act2Phase === "INSPECT_TRAY"
        ? {
            ...state,
            act2Phase: "INSPECT_JAR",
            checkpoint: "act2_tray"
          }
        : state;

    case "ACT2_INSPECT_JAR":
      return state.currentAct === 2 &&
        state.act2Phase === "INSPECT_JAR"
        ? {
            ...state,
            act2Phase: "TAKE_SAMPLE",
            checkpoint: "act2_jar"
          }
        : state;

    case "ACT2_TAKE_SAMPLE":
      return state.currentAct === 2 &&
        state.act2Phase === "TAKE_SAMPLE"
        ? {
            ...state,
            act2Phase: "MIX",
            checkpoint: "act2_sample",
            inventory: appendUnique(
              state.inventory,
              "item_hongqu_sample"
            )
          }
        : state;

    case "ACT2_COMPLETE_STEP": {
      if (state.currentAct !== 2) return state;
      if (event.step === "mix" && state.act2Phase === "MIX") {
        return {
          ...state,
          act2Phase: "VAT",
          checkpoint: "act2_mix"
        };
      }
      if (event.step === "vat" && state.act2Phase === "VAT") {
        return {
          ...state,
          act2Phase: "SEAL",
          checkpoint: "act2_vat"
        };
      }
      if (event.step === "seal" && state.act2Phase === "SEAL") {
        return {
          ...state,
          act2Phase: "QUESTION",
          checkpoint: "act2_seal"
        };
      }
      return state;
    }

    case "ACT2_CHOOSE_QUESTION":
      return state.currentAct === 2 &&
        state.act2Phase === "QUESTION"
        ? finishActTwo(state, event.choice)
        : state;

    case "ACT3_TALK_FAMILY":
      return state.currentAct === 3 && state.act3Phase === "ARRIVE"
        ? {
            ...state,
            act3Phase: "COLLECT",
            checkpoint: "act3_collect"
          }
        : state;

    case "ACT3_COLLECT_MATERIAL": {
      if (
        state.currentAct !== 3 ||
        (state.act3Phase !== "COLLECT" &&
          state.act3Phase !== "READY_TO_COOK") ||
        state.act3Materials.includes(event.material)
      ) {
        return state;
      }
      const materials = [...state.act3Materials, event.material];
      const ready = materials.length === 3;
      return {
        ...state,
        act3Materials: materials,
        act3Phase: ready ? "READY_TO_COOK" : "COLLECT",
        checkpoint: ready
          ? "act3_ready_to_cook"
          : `act3_materials_${materials.length}`,
        inventory: appendUnique(
          state.inventory,
          `ingredient_${event.material}`
        )
      };
    }

    case "ACT3_COOK":
      return state.currentAct === 3 &&
        state.act3Phase === "READY_TO_COOK" &&
        state.act3Materials.length === 3
        ? {
            ...state,
            act3Phase: "COOKED",
            checkpoint: "act3_cooked",
            inventory: appendUnique(
              without(state.inventory, [
                "ingredient_bowl",
                "ingredient_noodles",
                "ingredient_laojiu"
              ]),
              "item_cooked_noodles"
            )
          }
        : state;

    case "ACT3_SERVE":
      return state.currentAct === 3 &&
        state.act3Phase === "COOKED"
        ? {
            ...state,
            act3Phase: "INSCRIPTION",
            checkpoint: "act3_served",
            inventory: without(state.inventory, [
              "item_cooked_noodles"
            ])
          }
        : state;

    case "ACT3_CHOOSE_INSCRIPTION":
      return state.currentAct === 3 &&
        state.act3Phase === "INSCRIPTION"
        ? {
            ...state,
            currentAct: 4,
            checkpoint: "act4_arrive",
            act3Phase: "COMPLETE",
            act3Inscription: event.choice,
            playerTile: { ...ACT4_SPAWN_TILE },
            relics: appendUnique(
              state.relics,
              `relic_blue_white_cup_${event.choice}`
            )
          }
        : state;

    case "ACT4_TALK_MIA":
      return state.currentAct === 4 && state.act4Phase === "ARRIVE"
        ? {
            ...state,
            act4Phase: "EXPLANATION",
            checkpoint: "act4_explanation"
          }
        : state;

    case "ACT4_CHOOSE_EXPLANATION":
      return state.currentAct === 4 &&
        state.act4Phase === "EXPLANATION"
        ? {
            ...state,
            act4Phase: "LABEL",
            act4Explanation: event.choice,
            checkpoint: "act4_label"
          }
        : state;

    case "ACT4_GENERATE_LABEL":
      return state.currentAct === 4 && state.act4Phase === "LABEL"
        ? {
            ...state,
            act4Phase: "REVIEW",
            checkpoint: "act4_review"
          }
        : state;

    case "ACT4_RETRY_LABEL":
      return state.currentAct === 4 &&
        state.act4Phase === "REVIEW" &&
        !state.labelRetryUsed
        ? {
            ...state,
            labelTemplate: 1,
            labelRetryUsed: true,
            checkpoint: "act4_review_retry"
          }
        : state;

    case "ACT4_ACCEPT_LABEL":
      return state.currentAct === 4 &&
        state.act4Phase === "REVIEW"
        ? {
            ...state,
            act4Phase: "MINT",
            checkpoint: "act4_mint"
          }
        : state;

    case "ACT4_DEMO_MINT":
      return state.currentAct === 4 && state.act4Phase === "MINT"
        ? {
            ...state,
            currentAct: "film",
            checkpoint: "film_start",
            act4Phase: "COMPLETE",
            relics: appendUnique(
              state.relics,
              "relic_one_jar_echo"
            )
          }
        : state;

    case "FILM_SEEN":
    case "FILM_SKIPPED":
      return state.currentAct === "film"
        ? {
            ...state,
            currentAct: "complete",
            checkpoint: "chapter_complete",
            cultureFilmSeen: true,
            chapterComplete: true,
            playerTile: { x: 0, y: 0 }
          }
        : state;

    case "SET_CHAPTER_PLAYER_TILE": {
      const tile = {
        x: Math.round(event.tile.x),
        y: Math.round(event.tile.y)
      };
      return tile.x === state.playerTile.x &&
        tile.y === state.playerTile.y
        ? state
        : { ...state, playerTile: tile };
    }
  }
}
