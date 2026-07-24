import Phaser from "phaser";
import type { TilePosition } from "../domain/act1State";
import type { LongjingSaveV1 } from "../domain/longjingState";
import { LONGJING_OBJECT_ASSET } from "./LongjingAssetCatalog";
import { tileToPixelCenter } from "./ApartmentRenderer";

export const LONGJING_OBJECT_FRAMES = {
  tea_tin_a: 0,
  tea_tin_b: 1,
  batch_card: 2,
  market_records: 3,
  chen_ledger: 3,
  old_tea_scoop: 4,
  tea_basket: 5,
  old_signature: 6,
  refusal_copy: 7,
  original_batch: 8,
  provenance_board: 9,
  shipping_invoices: 10,
  tea_sample_pouch: 11
} as const;

export type LongjingObjectId = keyof typeof LONGJING_OBJECT_FRAMES;

export type LongjingVisibleObject = {
  id: LongjingObjectId;
  tile: TilePosition;
};

const MARKET_OBJECTS: LongjingVisibleObject[] = [
  { id: "tea_tin_a", tile: { x: 15, y: 15.6 } },
  { id: "tea_tin_b", tile: { x: 18, y: 15.6 } },
  { id: "market_records", tile: { x: 23, y: 15.6 } },
  { id: "provenance_board", tile: { x: 25, y: 16.6 } },
  { id: "old_tea_scoop", tile: { x: 30.5, y: 11.6 } }
];

export function longjingObjectsForState(
  state: LongjingSaveV1
): LongjingVisibleObject[] {
  if (state.currentAct === "market") return MARKET_OBJECTS;
  if (state.currentAct === "terrace") {
    return [{ id: "tea_basket", tile: { x: 21.5, y: 20.5 } }];
  }
  if (state.currentAct === "workshop") {
    return state.workshopPhase === "MEMORY"
      ? [{ id: "old_signature", tile: { x: 31, y: 13.6 } }]
      : [];
  }
  if (state.currentAct === "truth") {
    if (state.truthPhase === "ARRIVE") {
      return [{ id: "chen_ledger", tile: { x: 15.5, y: 16.6 } }];
    }
    const objects: LongjingVisibleObject[] = [
      { id: "provenance_board", tile: { x: 17, y: 15.6 } }
    ];
    if (
      state.truthPhase === "COLLECT" &&
      !state.evidence.includes("evidence_original_batch")
    ) {
      objects.unshift({
        id: "original_batch",
        tile: { x: 7, y: 8.6 }
      });
    }
    if (
      state.truthPhase === "COLLECT" &&
      !state.evidence.includes("evidence_refusal_copy")
    ) {
      objects.unshift({
        id: "refusal_copy",
        tile: { x: 27, y: 8.6 }
      });
    }
    return objects;
  }
  return [];
}

export class LongjingObjectLayer {
  private readonly sprites: Phaser.GameObjects.Sprite[] = [];
  private signature = "";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tileSize: number,
    private readonly act: "market" | "terrace" | "workshop" | "truth"
  ) {}

  sync(state: LongjingSaveV1): void {
    const objects =
      state.currentAct === this.act ? longjingObjectsForState(state) : [];
    const signature = objects
      .map((object) => `${object.id}:${object.tile.x}:${object.tile.y}`)
      .join("|");
    if (signature === this.signature) return;
    this.signature = signature;
    this.sprites.splice(0).forEach((sprite) => sprite.destroy());
    objects.forEach((object) => {
      const pixel = tileToPixelCenter(object.tile, this.tileSize);
      const sprite = this.scene.add
        .sprite(
          pixel.x,
          pixel.y,
          LONGJING_OBJECT_ASSET.key,
          LONGJING_OBJECT_FRAMES[object.id]
        )
        .setOrigin(0.5, 0.78)
        .setDepth(Math.round(pixel.y))
        .setName(`longjing-object:${object.id}`);
      this.sprites.push(sprite);
    });
  }
}
