import Phaser from "phaser";
import type { ChapterDialogueChoice } from "../../content/chapter/types";

export type ChapterChoicePanelCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export class ChapterChoicePanel<TValue extends string> {
  private readonly container: Phaser.GameObjects.Container;
  private readonly eyebrow: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly optionTexts: Phaser.GameObjects.Text[] = [];
  private choices: ChapterDialogueChoice<TValue>[] = [];
  private selectedIndex = 0;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.72)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(106, 42, 428, 276, 0x211a17, 0.99)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    this.eyebrow = scene.add.text(136, 67, "", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#A83B32"
    });
    this.title = scene.add.text(136, 90, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "18px",
      color: "#F4EBDD"
    });
    this.subtitle = scene.add.text(136, 121, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "10px",
      color: "#B7C2C0"
    });
    for (let index = 0; index < 3; index += 1) {
      this.optionTexts.push(
        scene.add.text(142, 158 + index * 40, "", {
          fontFamily:
            '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: "12px",
          color: "#B7C2C0",
          backgroundColor: "#30231D",
          fixedWidth: 356,
          padding: { x: 12, y: 9 }
        })
      );
    }
    const controls = scene.add
      .text(504, 292, "↑↓ 选择    E 确认", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0);
    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        this.eyebrow,
        this.title,
        this.subtitle,
        ...this.optionTexts,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(18_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  open(
    copy: ChapterChoicePanelCopy,
    choices: ChapterDialogueChoice<TValue>[]
  ): void {
    this.choices = choices;
    this.selectedIndex = 0;
    this.eyebrow.setText(copy.eyebrow);
    this.title.setText(copy.title);
    this.subtitle.setText(copy.subtitle);
    this.container.setVisible(true);
    this.render();
  }

  move(direction: -1 | 1): void {
    if (!this.isOpen || this.choices.length === 0) return;
    this.selectedIndex = Phaser.Math.Wrap(
      this.selectedIndex + direction,
      0,
      this.choices.length
    );
    this.render();
  }

  selectedChoice(): ChapterDialogueChoice<TValue> | null {
    return this.choices[this.selectedIndex] ?? null;
  }

  confirm(): TValue | null {
    return this.selectedChoice()?.value ?? null;
  }

  close(): void {
    this.container.setVisible(false);
  }

  private render(): void {
    this.optionTexts.forEach((text, index) => {
      const choice = this.choices[index];
      const selected = index === this.selectedIndex;
      text
        .setText(choice ? `${selected ? "◆" : "◇"}  ${choice.label}` : "")
        .setColor(selected ? "#F4EBDD" : "#B7C2C0")
        .setBackgroundColor(selected ? "#6E4932" : "#30231D");
    });
  }
}
