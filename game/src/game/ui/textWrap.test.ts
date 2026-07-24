import { describe, expect, it } from "vitest";
import { advancedWrap } from "./textWrap";

describe("advancedWrap", () => {
  it("enables character-level wrapping for continuous Chinese text", () => {
    expect(advancedWrap(240)).toEqual({
      wordWrap: {
        width: 240,
        useAdvancedWrap: true
      }
    });
  });
});
