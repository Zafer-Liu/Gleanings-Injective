import { describe, expect, it } from "vitest";
import {
  leafVisualPolicy,
  LONGJING_WORLD_ASSETS
} from "./LongjingWorldRenderer";

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

  it("uses one full pixel-art map with the gameplay dimensions for every act", () => {
    expect(LONGJING_WORLD_ASSETS).toEqual({
      market: {
        key: "map-longjing-market",
        path: "/maps/map_longjing_market_1216x832.png",
        width: 1216,
        height: 832
      },
      terrace: {
        key: "map-longjing-terrace",
        path: "/maps/map_longjing_terrace_1536x1024.png",
        width: 1536,
        height: 1024
      },
      workshop: {
        key: "map-longjing-workshop",
        path: "/maps/map_longjing_workshop_1280x896.png",
        width: 1280,
        height: 896
      },
      truth: {
        key: "map-longjing-truth",
        path: "/maps/map_longjing_truth_1088x768.png",
        width: 1088,
        height: 768
      }
    });
  });
});
