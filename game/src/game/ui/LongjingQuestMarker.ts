import Phaser from "phaser";
import {
  longjingMarkerStyle,
  type LongjingMarkerTarget
} from "../render/LongjingScenePolicy";
import { QuestMarker } from "./QuestMarker";
import { questMarkerPointForTile } from "./QuestMarkerPolicy";

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
    this.marker.setTarget(
      questMarkerPointForTile(target.tile, this.tileSize)
    );
  }

  setSuppressed(suppressed: boolean): void {
    this.marker.setSuppressed(suppressed);
  }
}
