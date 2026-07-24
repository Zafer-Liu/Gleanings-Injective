import Phaser from "phaser";

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
    const questBack = scene.add
      .rectangle(12, 12, 332, 64, 0x211a17, 0.94)
      .setOrigin(0)
      .setStrokeStyle(1, 0xc9873f);
    const accent = scene.add
      .rectangle(20, 20, 4, 48, 0xa83b32)
      .setOrigin(0);
    this.actText = scene.add.text(32, 18, "", {
      ...TEXT_STYLE,
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#D4B46A"
    });
    this.questText = scene.add.text(32, 35, "", {
      ...TEXT_STYLE,
      fontSize: "13px"
    });
    this.hintText = scene.add.text(32, 57, "", {
      ...TEXT_STYLE,
      fontSize: "9px",
      color: "#B7C2C0"
    });

    const inventoryBack = scene.add
      .rectangle(628, 12, 128, 32, 0x211a17, 0.94)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0x6e4932);
    this.inventoryText = scene.add
      .text(620, 21, "", {
        ...TEXT_STYLE,
        fontSize: "9px",
        color: "#D4B46A"
      })
      .setOrigin(1, 0);

    this.promptBack = scene.add
      .rectangle(320, 332, 280, 28, 0x211a17, 0.96)
      .setStrokeStyle(1, 0x6e4932)
      .setVisible(false);
    this.promptText = scene.add
      .text(320, 332, "", {
        ...TEXT_STYLE,
        fontSize: "11px"
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.toastText = scene.add
      .text(320, 92, "", {
        ...TEXT_STYLE,
        fontSize: "11px",
        color: "#211A17",
        backgroundColor: "#D4B46A",
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.container.add([
      questBack,
      accent,
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
    this.hintText.setText(showHint ? view.hint : "");
    const progress = view.progress ? `  ·  ${view.progress}` : "";
    this.inventoryText.setText(
      `随身物件 ${view.inventoryCount}${progress}`
    );
  }

  setPrompt(message: string | null): void {
    const visible = message !== null && message.length > 0;
    this.promptText.setText(message ?? "").setVisible(visible);
    this.promptBack.setVisible(visible);
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
