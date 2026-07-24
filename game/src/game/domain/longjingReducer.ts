import type { TilePosition } from "./act1State";
import {
  LONGJING_FIRING_ROUNDS,
  LONGJING_TERRACE_SPAWN,
  LONGJING_TRUTH_SPAWN,
  LONGJING_WORKSHOP_SPAWN,
  type LongjingEvidence,
  type LongjingFiringAction,
  type LongjingInscription,
  type LongjingLeafKind,
  type LongjingSaveV1
} from "./longjingState";

export type LongjingEvent =
  | { type: "MARKET_TALK_VENDOR" }
  | { type: "MARKET_INSPECT_TIN_A" }
  | { type: "MARKET_INSPECT_TIN_B" }
  | { type: "MARKET_CHECK_RECORDS" }
  | { type: "MARKET_COMPLETE_BOARD" }
  | { type: "MARKET_TOUCH_TEA_SCOOP" }
  | { type: "TERRACE_START_PICKING" }
  | {
      type: "TERRACE_JUDGE_LEAF";
      leaf: LongjingLeafKind;
      decision: "pick" | "leave";
    }
  | { type: "WORKSHOP_BEGIN_FIRING" }
  | {
      type: "WORKSHOP_CHOOSE_ACTION";
      action: LongjingFiringAction;
    }
  | { type: "WORKSHOP_REVEAL_REFUSAL" }
  | { type: "TRUTH_OPEN_LEDGER" }
  | {
      type: "TRUTH_COLLECT_EVIDENCE";
      evidence:
        | "evidence_original_batch"
        | "evidence_refusal_copy";
    }
  | { type: "TRUTH_COMPLETE_BOARD" }
  | {
      type: "TRUTH_CHOOSE_INSCRIPTION";
      inscription: LongjingInscription;
    }
  | { type: "LONGJING_FILM_SEEN" }
  | { type: "LONGJING_FILM_SKIPPED" }
  | { type: "SET_LONGJING_PLAYER_TILE"; tile: TilePosition };

function appendUnique<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items : [...items, item];
}

function addEvidence(
  state: LongjingSaveV1,
  ...evidence: LongjingEvidence[]
): LongjingEvidence[] {
  return evidence.reduce(
    (items, item) => appendUnique(items, item),
    state.evidence
  );
}

export function reduceLongjing(
  state: LongjingSaveV1,
  event: LongjingEvent
): LongjingSaveV1 {
  switch (event.type) {
    case "MARKET_TALK_VENDOR":
      return state.currentAct === "market" &&
        state.marketPhase === "ARRIVE"
        ? {
            ...state,
            marketPhase: "INSPECT_TIN_A",
            checkpoint: "longjing_market_vendor"
          }
        : state;

    case "MARKET_INSPECT_TIN_A":
      return state.currentAct === "market" &&
        state.marketPhase === "INSPECT_TIN_A"
        ? {
            ...state,
            marketPhase: "INSPECT_TIN_B",
            checkpoint: "longjing_market_tin_a",
            evidence: addEvidence(state, "evidence_tin_a")
          }
        : state;

    case "MARKET_INSPECT_TIN_B":
      return state.currentAct === "market" &&
        state.marketPhase === "INSPECT_TIN_B"
        ? {
            ...state,
            marketPhase: "RECORDS",
            checkpoint: "longjing_market_tin_b",
            evidence: addEvidence(
              state,
              "evidence_duplicate_batch",
              "evidence_date_conflict"
            )
          }
        : state;

    case "MARKET_CHECK_RECORDS":
      return state.currentAct === "market" &&
        state.marketPhase === "RECORDS"
        ? {
            ...state,
            marketPhase: "BOARD",
            checkpoint: "longjing_market_records",
            evidence: addEvidence(state, "evidence_flow_record")
          }
        : state;

    case "MARKET_COMPLETE_BOARD":
      return state.currentAct === "market" &&
        state.marketPhase === "BOARD" &&
        state.evidence.includes("evidence_duplicate_batch") &&
        state.evidence.includes("evidence_date_conflict") &&
        state.evidence.includes("evidence_flow_record")
        ? {
            ...state,
            marketPhase: "TEA_SCOOP",
            checkpoint: "longjing_market_board"
          }
        : state;

    case "MARKET_TOUCH_TEA_SCOOP":
      return state.currentAct === "market" &&
        state.marketPhase === "TEA_SCOOP"
        ? {
            ...state,
            currentAct: "terrace",
            marketPhase: "COMPLETE",
            checkpoint: "longjing_terrace_arrive",
            relics: appendUnique(
              state.relics,
              "relic_old_tea_scoop"
            ),
            playerTile: { ...LONGJING_TERRACE_SPAWN }
          }
        : state;

    case "TERRACE_START_PICKING":
      return state.currentAct === "terrace" &&
        state.terracePhase === "ARRIVE"
        ? {
            ...state,
            terracePhase: "PICKING",
            checkpoint: "longjing_terrace_picking"
          }
        : state;

    case "TERRACE_JUDGE_LEAF": {
      if (
        state.currentAct !== "terrace" ||
        state.terracePhase !== "PICKING" ||
        state.pickAttempts >= 12
      ) {
        return state;
      }
      const pickAttempts = state.pickAttempts + 1;
      const correctDecision =
        (event.leaf === "tender" && event.decision === "pick") ||
        (event.leaf !== "tender" && event.decision === "leave");
      const pickCorrect =
        state.pickCorrect + (correctDecision ? 1 : 0);
      const pickedLeaves = [...state.pickedLeaves, event.leaf];
      if (pickAttempts < 12) {
        return {
          ...state,
          pickAttempts,
          pickCorrect,
          pickedLeaves,
          checkpoint: `longjing_terrace_pick_${pickAttempts}`
        };
      }
      return {
        ...state,
        currentAct: "workshop",
        terracePhase: "COMPLETE",
        checkpoint: "longjing_workshop_arrive",
        pickAttempts,
        pickCorrect,
        pickedLeaves,
        relics: appendUnique(state.relics, "relic_qingming_bud"),
        playerTile: { ...LONGJING_WORKSHOP_SPAWN }
      };
    }

    case "WORKSHOP_BEGIN_FIRING":
      return state.currentAct === "workshop" &&
        state.workshopPhase === "ARRIVE"
        ? {
            ...state,
            workshopPhase: "FIRING",
            checkpoint: "longjing_workshop_firing"
          }
        : state;

    case "WORKSHOP_CHOOSE_ACTION": {
      if (
        state.currentAct !== "workshop" ||
        state.workshopPhase !== "FIRING"
      ) {
        return state;
      }
      const round = LONGJING_FIRING_ROUNDS[state.firingStep];
      if (round === undefined) return state;
      const correct = event.action === round.idealAction;
      if (!correct && !state.firingRetryUsed) {
        return {
          ...state,
          firingRetryUsed: true,
          firingMistakes: state.firingMistakes + 1,
          checkpoint: `longjing_firing_retry_${round.id}`
        };
      }
      const firingStep = state.firingStep + 1;
      const finished = firingStep >= LONGJING_FIRING_ROUNDS.length;
      return {
        ...state,
        firingStep,
        firingScore: state.firingScore + (correct ? 1 : 0),
        firingMistakes:
          state.firingMistakes + (!correct ? 1 : 0),
        workshopPhase: finished ? "MEMORY" : "FIRING",
        checkpoint: finished
          ? "longjing_workshop_memory"
          : `longjing_firing_${firingStep}`
      };
    }

    case "WORKSHOP_REVEAL_REFUSAL":
      return state.currentAct === "workshop" &&
        state.workshopPhase === "MEMORY"
        ? {
            ...state,
            currentAct: "truth",
            workshopPhase: "COMPLETE",
            checkpoint: "longjing_truth_arrive",
            evidence: addEvidence(state, "evidence_old_signature"),
            relics: appendUnique(state.relics, "relic_palm_fire"),
            playerTile: { ...LONGJING_TRUTH_SPAWN }
          }
        : state;

    case "TRUTH_OPEN_LEDGER":
      return state.currentAct === "truth" &&
        state.truthPhase === "ARRIVE"
        ? {
            ...state,
            truthPhase: "COLLECT",
            checkpoint: "longjing_truth_collect"
          }
        : state;

    case "TRUTH_COLLECT_EVIDENCE": {
      if (
        state.currentAct !== "truth" ||
        (state.truthPhase !== "COLLECT" &&
          state.truthPhase !== "BOARD")
      ) {
        return state;
      }
      const evidence = addEvidence(state, event.evidence);
      const ready =
        evidence.includes("evidence_original_batch") &&
        evidence.includes("evidence_refusal_copy");
      return {
        ...state,
        evidence,
        truthPhase: ready ? "BOARD" : "COLLECT",
        checkpoint: ready
          ? "longjing_truth_board"
          : `longjing_truth_evidence_${evidence.length}`
      };
    }

    case "TRUTH_COMPLETE_BOARD":
      return state.currentAct === "truth" &&
        state.truthPhase === "BOARD" &&
        state.evidence.includes("evidence_original_batch") &&
        state.evidence.includes("evidence_refusal_copy")
        ? {
            ...state,
            truthPhase: "INSCRIPTION",
            checkpoint: "longjing_truth_inscription"
          }
        : state;

    case "TRUTH_CHOOSE_INSCRIPTION":
      return state.currentAct === "truth" &&
        state.truthPhase === "INSCRIPTION"
        ? {
            ...state,
            currentAct: "film",
            truthPhase: "COMPLETE",
            checkpoint: "longjing_film_start",
            inscription: event.inscription,
            relics: appendUnique(
              state.relics,
              "relic_one_leaf_origin"
            ),
            cultureCards: appendUnique(
              state.cultureCards,
              "culture_longjing_origin"
            ),
            playerTile: { x: 0, y: 0 }
          }
        : state;

    case "LONGJING_FILM_SEEN":
    case "LONGJING_FILM_SKIPPED":
      return state.currentAct === "film"
        ? {
            ...state,
            currentAct: "complete",
            checkpoint: "longjing_complete",
            filmSeen: true,
            chapterComplete: true,
            playerTile: { x: 0, y: 0 }
          }
        : state;

    case "SET_LONGJING_PLAYER_TILE": {
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
