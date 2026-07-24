import { describe, expect, it } from "vitest";
import {
  PROVENANCE_COLUMNS,
  cardsForEvidence,
  validateEvidencePlacement
} from "./provenanceBoard";

describe("provenance board", () => {
  it("separates claims, records, conflicts and further review", () => {
    expect(PROVENANCE_COLUMNS.map((column) => column.id)).toEqual([
      "claim",
      "record",
      "conflict",
      "review"
    ]);

    const cards = cardsForEvidence([
      "evidence_tin_a",
      "evidence_flow_record",
      "evidence_duplicate_batch",
      "evidence_old_signature"
    ]);

    expect(cards.map((card) => card.correctColumn)).toEqual([
      "claim",
      "record",
      "conflict",
      "review"
    ]);
  });

  it("explains why packaging cannot prove its own claim", () => {
    expect(
      validateEvidencePlacement("evidence_tin_a", "record")
    ).toEqual({
      correct: false,
      feedback: "包装声明本身不能证明包装声明。"
    });
  });

  it("accepts every card only in its evidence role", () => {
    const cards = cardsForEvidence([
      "evidence_tin_a",
      "evidence_date_conflict",
      "evidence_refusal_copy"
    ]);

    cards.forEach((card) => {
      expect(
        validateEvidencePlacement(card.id, card.correctColumn)
      ).toEqual({
        correct: true,
        feedback: card.success
      });
    });
  });
});
