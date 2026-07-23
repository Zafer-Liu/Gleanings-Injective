import Phaser from "phaser";
import type { CultureLabel } from "../domain/cultureLabel";

export type CultureLabelAction = "accept" | "retry";

export class CultureLabelPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly englishNameText: Phaser.GameObjects.Text;
  private readonly introText: Phaser.GameObjects.Text;
  private readonly factText: Phaser.GameObjects.Text;
  private readonly creativeText: Phaser.GameObjects.Text;
  private readonly metaText: Phaser.GameObjects.Text;
  private readonly acceptText: Phaser.GameObjects.Text;
  private readonly retryText: Phaser.GameObjects.Text;
  private actions: CultureLabelAction[] = ["accept"];
  private selectedIndex = 0;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.82)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(42, 22, 556, 316, 0x211a17, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    const accent = scene.add
      .rectangle(58, 38, 5, 284, 0xa83b32)
      .setOrigin(0);
    const eyebrow = scene.add.text(78, 40, "LOCAL CULTURE LABEL", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#D4B46A"
    });
    this.nameText = scene.add.text(78, 62, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "23px",
      color: "#F4EBDD"
    });
    this.englishNameText = scene.add.text(78, 94, "", {
      fontFamily: "Georgia, serif",
      fontSize: "12px",
      color: "#D4B46A"
    });
    this.introText = scene.add.text(78, 119, "", {
      fontFamily: "Georgia, serif",
      fontSize: "10px",
      color: "#B7C2C0",
      wordWrap: { width: 486 }
    });
    this.factText = scene.add.text(78, 158, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "10px",
      color: "#D4B46A",
      backgroundColor: "#30231D",
      padding: { x: 8, y: 6 },
      fixedWidth: 486,
      wordWrap: { width: 470 }
    });
    this.creativeText = scene.add.text(78, 205, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#F4EBDD",
      lineSpacing: 4,
      wordWrap: { width: 486 }
    });
    this.metaText = scene.add.text(78, 260, "", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "8px",
      color: "#6E6259"
    });
    this.acceptText = scene.add.text(78, 290, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#F4EBDD",
      backgroundColor: "#6E4932",
      padding: { x: 12, y: 7 }
    });
    this.retryText = scene.add.text(258, 290, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#B7C2C0",
      backgroundColor: "#30231D",
      padding: { x: 12, y: 7 }
    });
    const controls = scene.add
      .text(566, 298, "↑↓ 选择 · E 确认", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "8px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0);
    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        accent,
        eyebrow,
        this.nameText,
        this.englishNameText,
        this.introText,
        this.factText,
        this.creativeText,
        this.metaText,
        this.acceptText,
        this.retryText,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(20_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  open(label: CultureLabel, canRetry: boolean): void {
    this.nameText.setText(label.chineseName);
    this.englishNameText.setText(label.englishName);
    this.introText.setText(label.englishIntro);
    this.factText.setText(label.culturalFact);
    this.creativeText.setText(`创意表达：${label.creativeText}`);
    this.metaText.setText(
      `${label.templateSource}  ·  PATH ${label.pathHash}`
    );
    this.actions = canRetry ? ["accept", "retry"] : ["accept"];
    this.selectedIndex = 0;
    this.container.setVisible(true);
    this.renderActions();
  }

  move(direction: -1 | 1): void {
    if (!this.isOpen || this.actions.length < 2) return;
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      this.actions.length
    );
    this.renderActions();
  }

  selectedAction(): CultureLabelAction {
    return this.actions[this.selectedIndex] ?? "accept";
  }

  close(): void {
    this.container.setVisible(false);
  }

  private renderActions(): void {
    const acceptSelected =
      this.selectedAction() === "accept" || this.actions.length === 1;
    this.acceptText
      .setText(`${acceptSelected ? "◆" : "◇"}  接受这张酒签`)
      .setBackgroundColor(acceptSelected ? "#6E4932" : "#30231D");
    const canRetry = this.actions.includes("retry");
    this.retryText
      .setVisible(canRetry)
      .setText(
        `${!acceptSelected ? "◆" : "◇"}  ${
          canRetry ? "换一种创意表达" : "已用过重试"
        }`
      )
      .setBackgroundColor(!acceptSelected ? "#6E4932" : "#30231D");
  }
}
