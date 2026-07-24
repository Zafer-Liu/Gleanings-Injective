import { describe, expect, it } from "vitest";
import { createLongjingState } from "../domain/longjingState";
import {
  LONGJING_OBJECT_FRAMES,
  longjingObjectsForState
} from "./LongjingObjectLayer";

describe("Longjing object layer", () => {
  it("maps every investigation prop to a dedicated atlas frame", () => {
    expect(LONGJING_OBJECT_FRAMES).toEqual({
      tea_tin_a: 0,
      tea_tin_b: 1,
      batch_card: 2,
      market_records: 3,
      chen_ledger: 3,
      old_tea_scoop: 4,
      tea_basket: 5,
      old_signature: 6,
      refusal_copy: 7,
      original_batch: 8,
      provenance_board: 9,
      shipping_invoices: 10,
      tea_sample_pouch: 11
    });
  });

  it("keeps every market investigation target visible", () => {
    const state = createLongjingState();
    expect(
      longjingObjectsForState(state).map((object) => object.id)
    ).toEqual([
      "tea_tin_a",
      "tea_tin_b",
      "market_records",
      "provenance_board",
      "old_tea_scoop"
    ]);
  });

  it("removes collected truth evidence without hiding the task board", () => {
    const state = createLongjingState();
    const truth = {
      ...state,
      currentAct: "truth" as const,
      truthPhase: "COLLECT" as const,
      evidence: [
        ...state.evidence,
        "evidence_original_batch" as const
      ]
    };

    expect(
      longjingObjectsForState(truth).map((object) => object.id)
    ).toEqual(["refusal_copy", "provenance_board"]);
  });
});
