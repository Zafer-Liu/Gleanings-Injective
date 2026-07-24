import type {
  Act1Phase,
  TilePosition
} from "../domain/act1State";

export type ApartmentBackgroundPolicy = {
  assetPath: string;
  nativeSize: {
    width: number;
    height: number;
  };
  worldSize: {
    width: number;
    height: number;
  };
};

export type QuestMarkerTarget = {
  objectId: "obj_cardboard_box" | "obj_laojiu_jar";
  tile: TilePosition;
  offsetY: number;
};

const BAKED_MAP_INTERACTABLES = new Set([
  "obj_cardboard_box",
  "obj_laojiu_jar"
]);

export function shouldRenderInteractableOverlay(
  objectId: string
): boolean {
  return !BAKED_MAP_INTERACTABLES.has(objectId);
}

export function apartmentBackgroundPolicy(): ApartmentBackgroundPolicy {
  return {
    assetPath: "/maps/map_apartment_source.png",
    nativeSize: { width: 1536, height: 1024 },
    worldSize: { width: 960, height: 640 }
  };
}

export function questMarkerTargetForPhase(
  phase: Act1Phase
): QuestMarkerTarget | null {
  if (phase === "EXPLORE") {
    return {
      objectId: "obj_cardboard_box",
      tile: { x: 4, y: 13 },
      offsetY: -44
    };
  }

  if (
    phase === "NOTE_READ" ||
    phase === "MIA_ENTERED" ||
    phase === "SENSE_CHOSEN"
  ) {
    return {
      objectId: "obj_laojiu_jar",
      tile: { x: 26, y: 8 },
      offsetY: -56
    };
  }

  return null;
}
