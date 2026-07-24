import { describe, expect, it } from "vitest";
import { leafVisualPolicy } from "./LongjingWorldRenderer";

describe("Longjing world renderer", () => {
  it("gives every non-tender leaf state an observable visual difference", () => {
    const tender = leafVisualPolicy("tender");

    expect(leafVisualPolicy("too_young")).not.toEqual(tender);
    expect(leafVisualPolicy("mature")).not.toEqual(tender);
    expect(leafVisualPolicy("wet")).not.toEqual(tender);
    expect(leafVisualPolicy("damaged")).not.toEqual(tender);
    expect(leafVisualPolicy("wet").dew).toBe(true);
    expect(leafVisualPolicy("damaged").damaged).toBe(true);
  });
});
