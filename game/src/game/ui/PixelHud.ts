import Phaser from "phaser";
import { questContent } from "../../content/act1/content";
import type { Act1State } from "../domain/act1State";
import { advancedWrap } from "./textWrap";

const TEXT_STYLE = {
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  color: "#F4EBDD"
} satisfies Phaser.Types.GameObjects.Text.TextStyle;

export class PixelHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly questBack: Phaser.GameObjects.Rectangle;
  private readonly questMark: Phaser.GameObjects.Rectangle;
  private readonly questText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly promptBack: Phaser.GameObjects.Rectangle;
  private readonly promptText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;
  private readonly holdBack: Phaser.GameObjects.Rectangle;
  private readonly holdFill: Phaser.GameObjects.Rectangle;
  private readonly toastText: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(10_000);

    this.questBack = scene.add
      .rectangle(12, 12, 312, 54, 0x211a17, 0.92)
      .setOrigin(0)
      .setStrokeStyle(1, 0xc9873f);
    this.questMark = scene.add
      .rectangle(20, 21, 4, 34, 0xa83b32)
      .setOrigin(0);
    this.questText = scene.add.text(32, 18, "", {
      ...TEXT_STYLE,
      fontSize: "13px",
      lineSpacing: 2,
      ...advancedWrap(276)
    });
    this.hintText = scene.add.text(32, 41, "", {
      ...TEXT_STYLE,
      fontSize: "10px",
      color: "#D4B46A",
      lineSpacing: 2,
      ...advancedWrap(276)
    });

    this.promptBack = scene.add
      .rectangle(320, 332, 250, 28, 0x211a17, 0.94)
      .setStrokeStyle(1, 0x6e4932)
      .setVisible(false);
    this.promptText = scene.add
      .text(320, 332, "", {
        ...TEXT_STYLE,
        fontSize: "11px",
        align: "center",
        lineSpacing: 2,
        ...advancedWrap(230)
      })
      .setOrigin(0.5)
      .setVisible(false);

    const inventoryBack = scene.add
      .rectangle(628, 12, 92, 30, 0x211a17, 0.92)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x6e4932);
    this.inventoryText = scene.add
      .text(620, 20, "背包 I  ·  0", {
        ...TEXT_STYLE,
        fontSize: "10px",
        color: "#B7C2C0",
        align: "right",
        ...advancedWrap(108)
      })
      .setOrigin(1, 0);

    this.holdBack = scene.add
      .rectangle(248, 315, 144, 5, 0x30231d)
      .setOrigin(0)
      .setVisible(false);
    this.holdFill = scene.add
      .rectangle(250, 317, 0, 1, 0xd4b46a)
      .setOrigin(0)
      .setVisible(false);

    this.toastText = scene.add
      .text(320, 88, "", {
        ...TEXT_STYLE,
        fontSize: "12px",
        color: "#211A17",
        backgroundColor: "#D4B46A",
        padding: { x: 10, y: 6 },
        align: "center",
        ...advancedWrap(420)
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([
      this.questBack,
      this.questMark,
      this.questText,
      this.hintText,
      this.promptBack,
      this.promptText,
      inventoryBack,
      this.inventoryText,
      this.holdBack,
      this.holdFill,
      this.toastText
    ]);
  }

  updateState(state: Act1State, showHint: boolean): void {
    const quest = questContent(state.questId);
    this.questText.setText(`当前目标 · ${quest.title}`);
    this.hintText.setText(showHint ? quest.hint : "");
    this.hintText.setY(this.questText.y + this.questText.height + 3);
    const contentBottom =
      this.hintText.text.length > 0
        ? this.hintText.y + this.hintText.height
        : this.questText.y + this.questText.height;
    const panelHeight = Math.max(54, contentBottom - 12 + 10);
    this.questBack.setSize(312, panelHeight);
    this.questMark.setSize(4, Math.max(34, panelHeight - 20));
    this.toastText.setY(Math.max(88, 12 + panelHeight + 16));
    this.inventoryText.setText(`背包 I  ·  ${state.inventory.length}`);
  }

  setPrompt(message: string | null): void {
    const visible = message !== null && message.length > 0;
    this.promptText.setText(message ?? "").setVisible(visible);
    const height = Math.max(28, this.promptText.height + 10);
    const centerY = 346 - height / 2;
    this.promptText.setY(centerY);
    this.promptBack
      .setPosition(320, centerY)
      .setSize(250, height)
      .setVisible(visible);
  }

  setHoldProgress(progress: number): void {
    const normalized = Phaser.Math.Clamp(progress, 0, 1);
    const visible = normalized > 0 && normalized < 1;
    this.holdBack.setVisible(visible);
    this.holdFill
      .setVisible(visible)
      .setSize(Math.round(140 * normalized), 1);
  }

  showToast(message: string): void {
    this.toastTimer?.remove(false);
    this.toastText.setText(message).setVisible(true).setAlpha(1);
    this.toastTimer = this.scene.time.delayedCall(1_800, () => {
      this.scene.tweens.add({
        targets: this.toastText,
        alpha: 0,
        duration: 180,
        onComplete: () => this.toastText.setVisible(false)
      });
    });
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
}
