import { describe, expect, it } from "vitest";
import {
  LONGJING_FIRING_ROUNDS,
  createLongjingState,
  type LongjingSaveV1
} from "./longjingState";
import { reduceLongjing } from "./longjingReducer";

function reachTerrace() {
  let state = createLongjingState();
  state = reduceLongjing(state, { type: "MARKET_TALK_VENDOR" });
  state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_A" });
  state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_B" });
  state = reduceLongjing(state, { type: "MARKET_CHECK_RECORDS" });
  state = reduceLongjing(state, { type: "MARKET_COMPLETE_BOARD" });
  return reduceLongjing(state, { type: "MARKET_TOUCH_TEA_SCOOP" });
}

describe("Longjing chapter reducer", () => {
  it("collects modern evidence before allowing the memory transition", () => {
    let state = createLongjingState();

    state = reduceLongjing(state, { type: "MARKET_TALK_VENDOR" });
    state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_A" });
    state = reduceLongjing(state, { type: "MARKET_INSPECT_TIN_B" });

    expect(state.marketPhase).toBe("RECORDS");
    expect(state.evidence).toEqual(
      expect.arrayContaining([
        "evidence_tin_a",
        "evidence_duplicate_batch",
        "evidence_date_conflict"
      ])
    );

    const tooEarly = reduceLongjing(state, {
      type: "MARKET_TOUCH_TEA_SCOOP"
    });
    expect(tooEarly).toBe(state);

    state = reduceLongjing(state, { type: "MARKET_CHECK_RECORDS" });
    state = reduceLongjing(state, { type: "MARKET_COMPLETE_BOARD" });
    state = reduceLongjing(state, { type: "MARKET_TOUCH_TEA_SCOOP" });

    expect(state.currentAct).toBe("terrace");
    expect(state.marketPhase).toBe("COMPLETE");
    expect(state.relics).toContain("relic_old_tea_scoop");
  });

  it("records twelve picking judgements without hard failing mistakes", () => {
    let state = reachTerrace();
    state = reduceLongjing(state, { type: "TERRACE_START_PICKING" });
    const sequence = [
      "tender",
      "too_young",
      "mature",
      "wet",
      "damaged",
      "tender",
      "tender",
      "mature",
      "tender",
      "wet",
      "tender",
      "tender"
    ] as const;
    sequence.forEach((leaf) => {
      state = reduceLongjing(state, {
        type: "TERRACE_JUDGE_LEAF",
        leaf,
        decision: leaf === "tender" ? "pick" : "leave"
      });
    });

    expect(state.pickAttempts).toBe(12);
    expect(state.pickCorrect).toBe(12);
    expect(state.currentAct).toBe("workshop");
    expect(state.relics).toContain("relic_qingming_bud");
  });

  it("uses sensory firing rounds and grants one retry without blocking", () => {
    let state: LongjingSaveV1 = {
      ...reachTerrace(),
      currentAct: "workshop" as const,
      terracePhase: "COMPLETE" as const
    };
    state = reduceLongjing(state, { type: "WORKSHOP_BEGIN_FIRING" });

    state = reduceLongjing(state, {
      type: "WORKSHOP_CHOOSE_ACTION",
      action: "压"
    });
    expect(state.firingStep).toBe(0);
    expect(state.firingRetryUsed).toBe(true);
    expect(state.firingMistakes).toBe(1);

    LONGJING_FIRING_ROUNDS.forEach((round) => {
      state = reduceLongjing(state, {
        type: "WORKSHOP_CHOOSE_ACTION",
        action: round.idealActions[0]
      });
    });

    expect(state.workshopPhase).toBe("MEMORY");
    expect(state.firingScore).toBe(LONGJING_FIRING_ROUNDS.length);
  });

  it("accepts different hand-action paths and records hidden leaf state", () => {
    const start: LongjingSaveV1 = {
      ...reachTerrace(),
      currentAct: "workshop",
      terracePhase: "COMPLETE"
    };
    let first = reduceLongjing(start, {
      type: "WORKSHOP_BEGIN_FIRING"
    });
    let second = reduceLongjing(start, {
      type: "WORKSHOP_BEGIN_FIRING"
    });

    LONGJING_FIRING_ROUNDS.forEach((round) => {
      first = reduceLongjing(first, {
        type: "WORKSHOP_CHOOSE_ACTION",
        action: round.idealActions[0]
      });
      second = reduceLongjing(second, {
        type: "WORKSHOP_CHOOSE_ACTION",
        action: round.idealActions[1]
      });
    });

    expect(first.workshopPhase).toBe("MEMORY");
    expect(second.workshopPhase).toBe("MEMORY");
    expect(first.firingScore).toBe(5);
    expect(second.firingScore).toBe(5);
    expect([
      first.firingHeat,
      first.firingMoisture,
      first.firingShape
    ]).not.toEqual([
      second.firingHeat,
      second.firingMoisture,
      second.firingShape
    ]);
  });

  it("closes the evidence loop, stores the inscription and completes the film", () => {
    let state = createLongjingState();
    state = {
      ...state,
      currentAct: "truth",
      marketPhase: "COMPLETE",
      terracePhase: "COMPLETE",
      workshopPhase: "COMPLETE",
      truthPhase: "ARRIVE",
      evidence: [
        "evidence_duplicate_batch",
        "evidence_date_conflict",
        "evidence_flow_record",
        "evidence_old_signature"
      ]
    };

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
      inscription: "pass_on"
    });

    expect(state.currentAct).toBe("film");
    expect(state.inscription).toBe("pass_on");
    expect(state.relics).toContain("relic_one_leaf_origin");

    state = reduceLongjing(state, { type: "LONGJING_FILM_SEEN" });
    expect(state.currentAct).toBe("complete");
    expect(state.filmSeen).toBe(true);
    expect(state.chapterComplete).toBe(true);
  });
});
