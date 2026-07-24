import Phaser from "phaser";
import { tileToPixelCenter } from "../render/ApartmentRenderer";
import {
  longjingMarkerStyle,
  type LongjingMarkerTarget
} from "../render/LongjingScenePolicy";

export class LongjingQuestMarker {
  private readonly container: Phaser.GameObjects.Container;
  private hasTarget = false;
  private suppressed = false;

  constructor(
    scene: Phaser.Scene,
    private readonly tileSize: number
  ) {
    const style = longjingMarkerStyle();
    const arrow = scene.add
      .text(0, 0, style.glyph, {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "15px",
        color: style.fill,
        stroke: style.stroke,
        strokeThickness: style.strokeThickness
      })
      .setOrigin(0.5, 1);
    this.container = scene.add
      .container(0, 0, [arrow])
      .setDepth(9_500);
    scene.tweens.add({
      targets: arrow,
      y: `-=${style.bobDistance}`,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  update(target: LongjingMarkerTarget | null): void {
    if (target === null) {
      this.hasTarget = false;
      this.container.setVisible(false);
      return;
    }
    this.hasTarget = true;
    const style = longjingMarkerStyle();
    const pixel = tileToPixelCenter(target.tile, this.tileSize);
    this.container
      .setPosition(pixel.x, pixel.y - 40 - style.objectGap)
      .setVisible(!this.suppressed);
  }

  setSuppressed(suppressed: boolean): void {
    this.suppressed = suppressed;
    this.container.setVisible(this.hasTarget && !suppressed);
  }
}
