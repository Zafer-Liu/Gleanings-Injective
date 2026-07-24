import { describe, expect, it } from "vitest";
import { createLongjingState } from "../domain/longjingState";
import {
  LONGJING_PALETTE,
  activeLongjingMarker,
  initialViewportContainsFocalPoint,
  longjingMarkerStyle
} from "./LongjingScenePolicy";
import { LONGJING_MAPS } from "../../content/longjing/content";

describe("Longjing scene visual policy", () => {
  it("uses one explicit 24-colour palette without gradients", () => {
    expect(LONGJING_PALETTE).toHaveLength(24);
    expect(new Set(LONGJING_PALETTE).size).toBe(24);
    expect(LONGJING_PALETTE.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(
      true
    );
  });

  it("marks exactly the next interactable", () => {
    const state = createLongjingState();
    expect(activeLongjingMarker(state)).toMatchObject({
      id: "market_vendor",
      tile: { x: 18, y: 16 }
    });

    expect(
      activeLongjingMarker({
        ...state,
        marketPhase: "INSPECT_TIN_B"
      })
    ).toMatchObject({
      id: "tea_tin_b",
      tile: { x: 18, y: 16 }
    });
  });

  it("uses a small outlined arrow with no shadow", () => {
    expect(longjingMarkerStyle()).toEqual({
      glyph: "▼",
      fill: "#F0E4CA",
      stroke: "#514137",
      strokeThickness: 2,
      bobDistance: 2,
      objectGap: 8,
      shadow: false
    });
  });

  it("keeps each opening focal point below the HUD and inside the first view", () => {
    const focalPoints = {
      market: { x: 18, y: 17 },
      terrace: { x: 23, y: 20 },
      workshop: { x: 20, y: 18 },
      truth: { x: 17, y: 17 }
    } as const;

    Object.entries(LONGJING_MAPS).forEach(([key, map]) => {
      expect(
        initialViewportContainsFocalPoint(
          map,
          map.playerSpawn,
          focalPoints[key as keyof typeof focalPoints]
        ),
        `${key} opening focal point`
      ).toBe(true);
    });
  });
});
