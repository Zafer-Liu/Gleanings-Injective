import {
  LONGJING_MARKET_INTERACTABLES,
  LONGJING_PICKING_LEAVES,
  LONGJING_TRUTH_INTERACTABLES,
  LONGJING_MAPS
} from "../../content/longjing/content";
import type { ChapterMapContent } from "../../content/chapter/types";
import type { TilePosition } from "../domain/act1State";
import type { LongjingSaveV1 } from "../domain/longjingState";

export const LONGJING_PALETTE = Object.freeze([
  "#171516",
  "#262223",
  "#3A302B",
  "#514137",
  "#6D5846",
  "#8B7055",
  "#A68A68",
  "#C4A883",
  "#DED0B3",
  "#F0E4CA",
  "#7F3029",
  "#C7653D",
  "#1F352B",
  "#2D4B37",
  "#3E6345",
  "#567A51",
  "#71915F",
  "#91AB73",
  "#B2C58A",
  "#D1D9A2",
  "#647B82",
  "#839CA0",
  "#AFC3BD",
  "#D6E1D5"
]);

export type LongjingMarkerTarget = {
  id: string;
  tile: { x: number; y: number };
};

export function longjingMarkerStyle() {
  return {
    glyph: "▼",
    fill: "#F0E4CA",
    stroke: "#514137",
    strokeThickness: 2,
    bobDistance: 2,
    objectGap: 8,
    shadow: false
  } as const;
}

export function initialViewportContainsFocalPoint(
  map: ChapterMapContent,
  spawn: TilePosition,
  focalPoint: TilePosition
): boolean {
  const visibleRows = 360 / map.tileSize;
  const maximumScroll = Math.max(
    0,
    map.size.height - visibleRows
  );
  const scrollTop = Math.min(
    maximumScroll,
    Math.max(0, spawn.y - visibleRows / 2)
  );
  const readableTop = scrollTop + 3.8;
  const readableBottom = scrollTop + visibleRows - 0.8;
  return (
    focalPoint.y >= readableTop &&
    focalPoint.y <= readableBottom
  );
}

function findTarget(
  items: Array<{ id: string; tile: { x: number; y: number } }>,
  id: string
): LongjingMarkerTarget | null {
  const item = items.find((candidate) => candidate.id === id);
  return item === undefined ? null : { id: item.id, tile: item.tile };
}

export function activeLongjingMarker(
  state: LongjingSaveV1
): LongjingMarkerTarget | null {
  if (state.currentAct === "market") {
    const byPhase: Record<string, string> = {
      ARRIVE: "market_vendor",
      INSPECT_TIN_A: "tea_tin_a",
      INSPECT_TIN_B: "tea_tin_b",
      RECORDS: "market_records",
      BOARD: "provenance_board",
      TEA_SCOOP: "old_tea_scoop"
    };
    return findTarget(
      LONGJING_MARKET_INTERACTABLES,
      byPhase[state.marketPhase] ?? ""
    );
  }
  if (state.currentAct === "terrace") {
    if (state.terracePhase === "ARRIVE") {
      return {
        id: "master_he",
        tile: LONGJING_MAPS.terrace.npcSpawns.masterHe
      };
    }
    if (state.terracePhase === "PICKING") {
      const leaf = LONGJING_PICKING_LEAVES[state.pickAttempts];
      return leaf === undefined
        ? null
        : { id: leaf.id, tile: leaf.tile };
    }
  }
  if (state.currentAct === "workshop") {
    if (state.workshopPhase === "ARRIVE") {
      return {
        id: "workshop_pan",
        tile: { x: 20, y: 17 }
      };
    }
    if (state.workshopPhase === "MEMORY") {
      return {
        id: "old_signature",
        tile: { x: 31, y: 14 }
      };
    }
  }
  if (state.currentAct === "truth") {
    const byPhase: Record<string, string> = {
      ARRIVE: "chen_ledger",
      BOARD: "truth_board",
      INSCRIPTION: "inscription_table"
    };
    if (state.truthPhase === "COLLECT") {
      const id = state.evidence.includes("evidence_original_batch")
        ? "refusal_copy"
        : "original_batch";
      return findTarget(LONGJING_TRUTH_INTERACTABLES, id);
    }
    return findTarget(
      LONGJING_TRUTH_INTERACTABLES,
      byPhase[state.truthPhase] ?? ""
    );
  }
  return null;
}
