import { describe, expect, it } from "vitest";
import { firingVisualPolicy } from "./LongjingFiringVisual";

describe("Longjing firing visual", () => {
  it("moves through qingguo, resting, and huiguo frames", () => {
    expect(
      firingVisualPolicy({
        workshopPhase: "FIRING",
        firingStep: 0,
        firingHeat: 1,
        firingMoisture: 5,
        firingShape: 0,
        firingMistakes: 0
      }).frame
    ).toBe(0);
    expect(
      firingVisualPolicy({
        workshopPhase: "FIRING",
        firingStep: 2,
        firingHeat: 2,
        firingMoisture: 3,
        firingShape: 1,
        firingMistakes: 0
      }).frame
    ).toBe(1);
    expect(
      firingVisualPolicy({
        workshopPhase: "FIRING",
        firingStep: 4,
        firingHeat: 4,
        firingMoisture: 1,
        firingShape: 4,
        firingMistakes: 1
      }).frame
    ).toBe(2);
  });

  it("turns process values into bounded readable indicators", () => {
    expect(
      firingVisualPolicy({
        workshopPhase: "FIRING",
        firingStep: 4,
        firingHeat: 7,
        firingMoisture: -1,
        firingShape: 4,
        firingMistakes: 2
      })
    ).toMatchObject({
      visible: true,
      heat: 5,
      moisture: 0,
      shape: 4,
      steamPips: 0,
      fragmentPips: 2
    });
    expect(
      firingVisualPolicy({
        workshopPhase: "MEMORY",
        firingStep: 5,
        firingHeat: 3,
        firingMoisture: 0,
        firingShape: 5,
        firingMistakes: 0
      }).visible
    ).toBe(false);
  });
});
