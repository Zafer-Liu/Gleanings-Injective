import Phaser from "phaser";
import { tileToPixelCenter } from "../render/ApartmentRenderer";
import {
  longjingMarkerStyle,
  type LongjingMarkerTarget
} from "../render/LongjingScenePolicy";
import { QuestMarker } from "./QuestMarker";

export class LongjingQuestMarker {
  private readonly marker: QuestMarker;

  constructor(
    scene: Phaser.Scene,
    private readonly tileSize: number
  ) {
    const style = longjingMarkerStyle();
    this.marker = new QuestMarker(scene, {
      glyph: style.glyph,
      fontSize: "15px",
      color: style.fill,
      stroke: style.stroke,
      strokeThickness: style.strokeThickness,
      bobDistance: style.bobDistance
    });
  }

  update(target: LongjingMarkerTarget | null): void {
    if (target === null) {
      this.marker.setTarget(null);
      return;
    }
    const style = longjingMarkerStyle();
    const pixel = tileToPixelCenter(target.tile, this.tileSize);
    this.marker.setTarget({
      x: pixel.x,
      y: pixel.y - 40 - style.objectGap
    });
  }

  setSuppressed(suppressed: boolean): void {
    this.marker.setSuppressed(suppressed);
  }
}
