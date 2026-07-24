import Phaser from "phaser";
import {
  LONGJING_MAPS,
  type LongjingPickingLeaf
} from "../../content/longjing/content";
import { LONGJING_LEAF_ASSET } from "./LongjingAssetCatalog";

export type LongjingMapKey = keyof typeof LONGJING_MAPS;
export type LeafVisualPolicy = {
  silhouette: "bud" | "standard" | "wide";
  dew: boolean;
  damaged: boolean;
  frame: number;
};

type LongjingWorldAsset = {
  key: string;
  path: string;
  width: number;
  height: number;
};

export const LONGJING_WORLD_ASSETS = {
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
} as const satisfies Record<LongjingMapKey, LongjingWorldAsset>;

export function renderLongjingWorld(
  scene: Phaser.Scene,
  key: LongjingMapKey
): { width: number; height: number } {
  const map = LONGJING_MAPS[key];
  const width = map.size.width * map.tileSize;
  const height = map.size.height * map.tileSize;
  const asset = LONGJING_WORLD_ASSETS[key];

  scene.add
    .image(0, 0, asset.key)
    .setOrigin(0)
    .setDisplaySize(width, height)
    .setDepth(0);

  return { width, height };
}

export function createLeafMarker(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: LongjingPickingLeaf["kind"],
  active: boolean
): Phaser.GameObjects.Image {
  const policy = leafVisualPolicy(kind);
  return scene.add
    .image(x, y, LONGJING_LEAF_ASSET.key, policy.frame)
    .setDepth(y)
    .setScale(active ? 1.18 : 1);
}

export function leafVisualPolicy(
  kind: LongjingPickingLeaf["kind"]
): LeafVisualPolicy {
  return {
    silhouette:
      kind === "too_young"
        ? "bud"
        : kind === "mature"
          ? "wide"
          : "standard",
    dew: kind === "wet",
    damaged: kind === "damaged",
    frame: {
      tender: 0,
      too_young: 1,
      mature: 2,
      wet: 3,
      damaged: 4
    }[kind]
  };
}
