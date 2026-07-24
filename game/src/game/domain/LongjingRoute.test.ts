import { describe, expect, it } from "vitest";
import { sceneForLongjingAct } from "./LongjingRoute";

describe("Longjing chapter routing", () => {
  it.each([
    ["market", "LongjingMarket"],
    ["terrace", "LongjingTerrace"],
    ["workshop", "LongjingWorkshop"],
    ["truth", "LongjingTruth"],
    ["film", "LongjingFilm"],
    ["complete", "LongjingComplete"]
  ] as const)("routes %s to %s", (act, scene) => {
    expect(sceneForLongjingAct(act)).toBe(scene);
  });
});
