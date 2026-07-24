import Phaser from "phaser";
import type {
  LongjingSaveV1,
  LongjingWorkshopPhase
} from "../domain/longjingState";
import { LONGJING_FIRING_ASSET } from "./LongjingAssetCatalog";

type FiringVisualSnapshot = Pick<
  LongjingSaveV1,
  | "firingStep"
  | "firingHeat"
  | "firingMoisture"
  | "firingShape"
  | "firingMistakes"
> & {
  workshopPhase: LongjingWorkshopPhase;
};

export type FiringVisualPolicy = {
  visible: boolean;
  frame: 0 | 1 | 2;
  heat: number;
  moisture: number;
  shape: number;
  steamPips: number;
  fragmentPips: number;
};

const clamp = (value: number): number =>
  Math.max(0, Math.min(5, Math.round(value)));

export function firingVisualPolicy(
  state: FiringVisualSnapshot
): FiringVisualPolicy {
  const moisture = clamp(state.firingMoisture);
  return {
    visible: state.workshopPhase === "FIRING",
    frame:
      state.firingStep <= 1 ? 0 : state.firingStep === 2 ? 1 : 2,
    heat: clamp(state.firingHeat),
    moisture,
    shape: clamp(state.firingShape),
    steamPips: moisture >= 4 ? 3 : moisture >= 2 ? 2 : moisture > 0 ? 1 : 0,
    fragmentPips:
      state.firingStep >= 4 ? Math.min(3, state.firingMistakes) : 0
  };
}

function meter(value: number): string {
  return `${"●".repeat(value)}${"○".repeat(5 - value)}`;
}

export class LongjingFiringVisual {
  private readonly container: Phaser.GameObjects.Container;
  private readonly image: Phaser.GameObjects.Image;
  private readonly status: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const panel = scene.add
      .rectangle(492, 94, 96, 124, 0x171516, 0.99)
      .setStrokeStyle(1, 0x91ab73);
    this.image = scene.add
      .image(492, 70, LONGJING_FIRING_ASSET.key, 0)
      .setDisplaySize(64, 64);
    this.status = scene.add
      .text(492, 106, "", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#D6E1D5",
        align: "center",
        lineSpacing: 2
      })
      .setOrigin(0.5, 0);
    this.container = scene.add
      .container(0, 0, [panel, this.image, this.status])
      .setScrollFactor(0)
      .setDepth(18_010)
      .setVisible(false);
  }

  show(state: FiringVisualSnapshot): void {
    const policy = firingVisualPolicy(state);
    this.image.setFrame(policy.frame);
    this.status.setText([
      `热 ${meter(policy.heat)}`,
      `润 ${meter(policy.moisture)}`,
      `形 ${meter(policy.shape)}`
    ]);
    this.container.setVisible(policy.visible);
  }

  hide(): void {
    this.container.setVisible(false);
  }
}

