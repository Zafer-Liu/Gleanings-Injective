import Phaser from "phaser";
import {
  LONGJING_MAPS,
  type LongjingPickingLeaf
} from "../../content/longjing/content";

export type LongjingMapKey = keyof typeof LONGJING_MAPS;
export type LeafVisualPolicy = {
  silhouette: "bud" | "standard" | "wide";
  dew: boolean;
  damaged: boolean;
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

const COLOR = {
  ink: 0x171516,
  teaDark: 0x1f352b,
  teaMid: 0x567a51,
  teaPale: 0xb2c58a,
  rainLight: 0xafc3bd
} as const;

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
): Phaser.GameObjects.Graphics {
  const leaf = scene.add.graphics().setPosition(x, y).setDepth(y);
  const policy = leafVisualPolicy(kind);
  const fill = active ? COLOR.teaPale : COLOR.teaMid;
  leaf.fillStyle(fill, 1);
  if (policy.silhouette === "bud") {
    leaf.fillTriangle(-4, 4, 0, -9, 2, 5);
    leaf.fillRect(3, -2, 3, 8);
  } else if (policy.silhouette === "wide") {
    leaf.fillTriangle(-13, 6, -2, -12, 0, 7);
    leaf.fillTriangle(0, 7, 13, -9, 12, 9);
  } else {
    leaf.fillTriangle(-9, 4, 0, -10, 1, 5);
    leaf.fillTriangle(0, 5, 9, -7, 9, 7);
  }
  if (policy.dew) {
    leaf.fillStyle(COLOR.rainLight, 1);
    leaf.fillRect(-6, -1, 3, 3);
    leaf.fillRect(5, 2, 3, 4);
  }
  if (policy.damaged) {
    leaf.fillStyle(COLOR.ink, 1);
    leaf.fillTriangle(5, -4, 10, -1, 6, 2);
  }
  leaf.lineStyle(2, COLOR.teaDark, 1);
  leaf.lineBetween(0, 7, 0, -8);
  return leaf;
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
    damaged: kind === "damaged"
  };
}
