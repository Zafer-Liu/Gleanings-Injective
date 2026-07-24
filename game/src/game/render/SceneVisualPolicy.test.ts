import { describe, expect, it } from "vitest";
import {
  apartmentBackgroundPolicy,
  questMarkerTargetForPhase,
  shouldRenderInteractableOverlay
} from "./SceneVisualPolicy";

describe("SceneVisualPolicy", () => {
  it.each([
    "obj_cardboard_box",
    "obj_laojiu_jar"
  ])("does not duplicate the baked map object with a contaminated overlay for %s", (id) => {
    expect(shouldRenderInteractableOverlay(id)).toBe(false);
  });

  it("uses the supplied complete apartment source image as the background", () => {
    expect(apartmentBackgroundPolicy()).toEqual({
      assetPath: "/maps/map_apartment_source.png",
      nativeSize: { width: 1536, height: 1024 },
      worldSize: { width: 960, height: 640 }
    });
  });

  it.each([
    ["EXPLORE", "obj_cardboard_box", { x: 4, y: 13 }, -44],
    ["NOTE_READ", "obj_laojiu_jar", { x: 26, y: 8 }, -56],
    ["MIA_ENTERED", "obj_laojiu_jar", { x: 26, y: 8 }, -56],
    ["SENSE_CHOSEN", "obj_laojiu_jar", { x: 26, y: 8 }, -56]
  ] as const)(
    "points the quest arrow at the active mission object during %s",
    (phase, objectId, tile, offsetY) => {
      expect(questMarkerTargetForPhase(phase)).toEqual({
        objectId,
        tile,
        offsetY
      });
    }
  );

  it.each([
    "ARRIVE",
    "NOTE_ACQUIRED",
    "JAR_INSPECTED",
    "JAR_OPENING",
    "COMPLETE"
  ] as const)(
    "does not show an object arrow while the active task is not an object during %s",
    (phase) => {
      expect(questMarkerTargetForPhase(phase)).toBeNull();
    }
  );
});
