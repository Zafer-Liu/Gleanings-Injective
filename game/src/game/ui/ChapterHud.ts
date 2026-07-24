import Phaser from "phaser";
import { advancedWrap } from "./textWrap";

export type ChapterHudView = {
  actLabel: string;
  questTitle: string;
  hint: string;
  inventoryCount: number;
  progress?: string;
};

const TEXT_STYLE = {
  fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
  color: "#F4EBDD"
} satisfies Phaser.Types.GameObjects.Text.TextStyle;

export class ChapterHud {
  private readonly container: Phaser.GameObjects.Container;
  private readonly questBack: Phaser.GameObjects.Rectangle;
  private readonly accent: Phaser.GameObjects.Rectangle;
  private readonly actText: Phaser.GameObjects.Text;
  private readonly questText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly inventoryText: Phaser.GameObjects.Text;
  private readonly promptBack: Phaser.GameObjects.Rectangle;
  private readonly promptText: Phaser.GameObjects.Text;
  private readonly toastText: Phaser.GameObjects.Text;
  private toastTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(10_000);
    this.questBack = scene.add
      .rectangle(12, 12, 332, 64, 0x211a17, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, 0xc9873f);
    this.accent = scene.add
      .rectangle(20, 20, 4, 48, 0xa83b32)
      .setOrigin(0);
    this.actText = scene.add.text(32, 18, "", {
      ...TEXT_STYLE,
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#D4B46A",
      ...advancedWrap(296)
    });
    this.questText = scene.add.text(32, 35, "", {
      ...TEXT_STYLE,
      fontSize: "13px",
      lineSpacing: 2,
      ...advancedWrap(296)
    });
    this.hintText = scene.add.text(32, 57, "", {
      ...TEXT_STYLE,
      fontSize: "9px",
      color: "#B7C2C0",
      lineSpacing: 2,
      ...advancedWrap(296)
    });

    const inventoryBack = scene.add
      .rectangle(628, 12, 128, 32, 0x211a17, 0.94)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x6e4932);
    this.inventoryText = scene.add
      .text(620, 21, "", {
        ...TEXT_STYLE,
        fontSize: "9px",
        color: "#D4B46A",
        align: "right",
        ...advancedWrap(116)
      })
      .setOrigin(1, 0);

    this.promptBack = scene.add
      .rectangle(320, 332, 280, 28, 0x211a17, 0.96)
      .setStrokeStyle(1, 0x6e4932)
      .setVisible(false);
    this.promptText = scene.add
      .text(320, 332, "", {
        ...TEXT_STYLE,
        fontSize: "11px",
        align: "center",
        lineSpacing: 2,
        ...advancedWrap(260)
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.toastText = scene.add
      .text(320, 92, "", {
        ...TEXT_STYLE,
        fontSize: "11px",
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
      this.accent,
      this.actText,
      this.questText,
      this.hintText,
      inventoryBack,
      this.inventoryText,
      this.promptBack,
      this.promptText,
      this.toastText
    ]);
  }

  update(view: ChapterHudView, showHint = true): void {
    this.actText.setText(view.actLabel);
    this.questText.setText(`当前目标 · ${view.questTitle}`);
    this.questText.setY(this.actText.y + this.actText.height + 2);
    this.hintText.setText(showHint ? view.hint : "");
    this.hintText.setY(this.questText.y + this.questText.height + 3);
    const contentBottom =
      this.hintText.text.length > 0
        ? this.hintText.y + this.hintText.height
        : this.questText.y + this.questText.height;
    const panelHeight = Math.max(64, contentBottom - 12 + 10);
    this.questBack.setSize(332, panelHeight);
    this.accent.setSize(4, Math.max(48, panelHeight - 16));
    this.toastText.setY(Math.max(92, 12 + panelHeight + 16));
    const progress = view.progress ? `  ·  ${view.progress}` : "";
    this.inventoryText.setText(
      `随身物件 ${view.inventoryCount}${progress}`
    );
  }

  setPrompt(message: string | null): void {
    const visible = message !== null && message.length > 0;
    this.promptText.setText(message ?? "").setVisible(visible);
    const height = Math.max(28, this.promptText.height + 10);
    const centerY = 346 - height / 2;
    this.promptText.setY(centerY);
    this.promptBack
      .setPosition(320, centerY)
      .setSize(280, height)
      .setVisible(visible);
  }

  showToast(message: string): void {
    this.toastTimer?.remove(false);
    this.toastText.setText(message).setVisible(true).setAlpha(1);
    this.toastTimer = this.scene.time.delayedCall(1_800, () => {
      this.scene.tweens.add({
        targets: this.toastText,
        alpha: 0,
        duration: 160,
        onComplete: () => this.toastText.setVisible(false)
      });
    });
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
}
