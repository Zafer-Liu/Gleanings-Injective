import Phaser from "phaser";
import {
  questMarkerPlacement,
  type QuestMarkerPoint
} from "./QuestMarkerPolicy";

export type QuestMarkerStyle = {
  glyph?: string;
  fontSize?: string;
  color?: string;
  stroke?: string;
  strokeThickness?: number;
  bobDistance?: number;
  worldDepth?: number;
  edgeDepth?: number;
};

const DEFAULT_STYLE: Required<QuestMarkerStyle> = {
  glyph: "▼",
  fontSize: "18px",
  color: "#F4C45E",
  stroke: "#211A17",
  strokeThickness: 4,
  bobDistance: 5,
  worldDepth: 9_500,
  edgeDepth: 10_500
};

export class QuestMarker {
  private readonly container: Phaser.GameObjects.Container;
  private readonly style: Required<QuestMarkerStyle>;
  private target: QuestMarkerPoint | null = null;
  private suppressed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    style: QuestMarkerStyle = {}
  ) {
    this.style = { ...DEFAULT_STYLE, ...style };
    const arrow = scene.add
      .text(0, 0, this.style.glyph, {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: this.style.fontSize,
        color: this.style.color,
        stroke: this.style.stroke,
        strokeThickness: this.style.strokeThickness
      })
      .setOrigin(0.5);
    this.container = scene.add
      .container(0, 0, [arrow])
      .setDepth(this.style.worldDepth)
      .setVisible(false);
    scene.tweens.add({
      targets: arrow,
      y: `-=${this.style.bobDistance}`,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
    scene.events.on(
      Phaser.Scenes.Events.POST_UPDATE,
      this.syncToCamera,
      this
    );
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.events.off(
        Phaser.Scenes.Events.POST_UPDATE,
        this.syncToCamera,
        this
      );
    });
  }

  setTarget(target: QuestMarkerPoint | null): void {
    this.target = target === null ? null : { ...target };
    this.syncToCamera();
  }

  setSuppressed(suppressed: boolean): void {
    this.suppressed = suppressed;
    this.syncToCamera();
  }

  private syncToCamera(): void {
    if (this.target === null || this.suppressed) {
      this.container.setVisible(false);
      return;
    }
    const camera = this.scene.cameras.main;
    const placement = questMarkerPlacement(this.target, {
      x: camera.worldView.x,
      y: camera.worldView.y,
      width: camera.width,
      height: camera.height
    });
    if (placement.mode === "world") {
      this.container
        .setScrollFactor(1)
        .setDepth(this.style.worldDepth);
    } else {
      this.container
        .setScrollFactor(0)
        .setDepth(this.style.edgeDepth);
    }
    this.container
      .setPosition(placement.x, placement.y)
      .setRotation(placement.rotation)
      .setVisible(true);
  }
}
