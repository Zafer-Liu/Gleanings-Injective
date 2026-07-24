import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectionType
} from "../public/share/collectible-kind.js";

describe("public collection type labels", () => {
  it("localizes stable and legacy badge categories", () => {
    for (const category of [
      "badge",
      "medal",
      "徽章",
      "勋章"
    ]) {
      assert.deepEqual(collectionType({ category }), {
        kind: "badge",
        label: "徽章",
        glyph: "章"
      });
    }
    assert.deepEqual(
      collectionType({ item_type: "Gleanings Badge" }),
      { kind: "badge", label: "徽章", glyph: "章" }
    );
  });

  it("localizes stable and legacy item categories", () => {
    for (const category of ["item", "道具"]) {
      assert.deepEqual(collectionType({ category }), {
        kind: "item",
        label: "道具",
        glyph: "物"
      });
    }
  });
});
