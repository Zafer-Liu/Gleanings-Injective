import { describe, expect, it } from "vitest";
import { questMarkerPlacement } from "./QuestMarkerPolicy";

const viewport = {
  x: 100,
  y: 200,
  width: 640,
  height: 360
};

describe("questMarkerPlacement", () => {
  it("keeps an onscreen target at its world position", () => {
    expect(
      questMarkerPlacement({ x: 420, y: 340 }, viewport)
    ).toEqual({
      mode: "world",
      x: 420,
      y: 340,
      rotation: 0
    });
  });

  it("does not pin a visible target merely because it is near the HUD", () => {
    expect(
      questMarkerPlacement({ x: 420, y: 201 }, viewport).mode
    ).toBe("world");
  });

  it.each([
    [
      "left",
      { x: 0, y: 380 },
      { x: 24, y: 180, rotation: Math.PI / 2 }
    ],
    [
      "right",
      { x: 900, y: 380 },
      { x: 616, y: 180, rotation: -Math.PI / 2 }
    ],
    [
      "top",
      { x: 420, y: 0 },
      { x: 320, y: 84, rotation: -Math.PI }
    ],
    [
      "bottom",
      { x: 420, y: 800 },
      { x: 320, y: 324, rotation: 0 }
    ]
  ])(
    "pins an offscreen %s target to the matching safe edge",
    (_direction, target, expected) => {
      const placement = questMarkerPlacement(target, viewport);

      expect(placement.mode).toBe("edge");
      expect(placement.x).toBeCloseTo(expected.x);
      expect(placement.y).toBeCloseTo(expected.y);
      expect(placement.rotation).toBeCloseTo(expected.rotation);
    }
  );

  it("preserves the direction for a diagonal offscreen target", () => {
    const placement = questMarkerPlacement(
      { x: 1_000, y: 0 },
      viewport
    );

    expect(placement.mode).toBe("edge");
    expect(placement.y).toBe(84);
    expect(placement.x).toBeGreaterThan(320);
    expect(placement.x).toBeLessThan(616);
    expect(placement.rotation).toBeCloseTo(
      Math.atan2(-380, 580) - Math.PI / 2
    );
  });
});
