import Phaser from "phaser";
import {
  PROVENANCE_COLUMNS,
  validateEvidencePlacement,
  type ProvenanceCard
} from "../domain/provenanceBoard";

export class ProvenanceBoard {
  private readonly container: Phaser.GameObjects.Container;
  private readonly header: Phaser.GameObjects.Text;
  private readonly cardTitle: Phaser.GameObjects.Text;
  private readonly cardDetail: Phaser.GameObjects.Text;
  private readonly feedback: Phaser.GameObjects.Text;
  private readonly columnBoxes: Phaser.GameObjects.Rectangle[] = [];
  private readonly columnLabels: Phaser.GameObjects.Text[] = [];
  private readonly columnCounts: Phaser.GameObjects.Text[] = [];
  private cards: ProvenanceCard[] = [];
  private placed = new Map<string, number>();
  private cardIndex = 0;
  private columnIndex = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x171516, 0.88)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(18, 18, 604, 324, 0x262223, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc4a883);
    this.header = scene.add.text(38, 34, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "16px",
      color: "#F0E4CA"
    });
    const instruction = scene.add.text(
      602,
      39,
      "← → 分类  ·  E 放置",
      {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "8px",
        color: "#AFC3BD"
      }
    ).setOrigin(1, 0);

    PROVENANCE_COLUMNS.forEach((column, index) => {
      const x = 38 + index * 148;
      const box = scene.add
        .rectangle(x, 78, 132, 92, 0x3a302b)
        .setOrigin(0)
        .setStrokeStyle(1, 0x6d5846);
      const label = scene.add.text(x + 8, 88, column.label, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "9px",
        color: "#DED0B3",
        wordWrap: { width: 116 }
      });
      const count = scene.add.text(x + 66, 139, "0", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "18px",
        color: "#91AB73"
      }).setOrigin(0.5);
      this.columnBoxes.push(box);
      this.columnLabels.push(label);
      this.columnCounts.push(count);
    });

    const cardBack = scene.add
      .rectangle(38, 188, 564, 90, 0x3a302b)
      .setOrigin(0)
      .setStrokeStyle(1, 0x8b7055);
    this.cardTitle = scene.add.text(56, 202, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "13px",
      color: "#F0E4CA"
    });
    this.cardDetail = scene.add.text(56, 228, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "10px",
      color: "#D6E1D5",
      wordWrap: { width: 524 }
    });
    this.feedback = scene.add.text(38, 296, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "10px",
      color: "#B2C58A",
      wordWrap: { width: 560 }
    });
    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        this.header,
        instruction,
        ...this.columnBoxes,
        ...this.columnLabels,
        ...this.columnCounts,
        cardBack,
        this.cardTitle,
        this.cardDetail,
        this.feedback
      ])
      .setScrollFactor(0)
      .setDepth(20_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  open(title: string, cards: ProvenanceCard[]): void {
    this.cards = cards;
    this.cardIndex = 0;
    this.columnIndex = 0;
    this.placed.clear();
    this.header.setText(title);
    this.feedback.setText("先判断这张卡在证据链里扮演什么角色。");
    this.container.setVisible(true);
    this.render();
  }

  move(direction: -1 | 1): void {
    if (!this.isOpen) return;
    this.columnIndex = Phaser.Math.Wrap(
      this.columnIndex + direction,
      0,
      PROVENANCE_COLUMNS.length
    );
    this.render();
  }

  confirm(): {
    accepted: boolean;
    complete: boolean;
    feedback: string;
  } {
    const card = this.cards[this.cardIndex];
    const column = PROVENANCE_COLUMNS[this.columnIndex];
    if (card === undefined || column === undefined) {
      return { accepted: false, complete: true, feedback: "" };
    }
    const result = validateEvidencePlacement(card.id, column.id);
    this.feedback
      .setText(result.feedback)
      .setColor(result.correct ? "#B2C58A" : "#C7653D");
    if (!result.correct) {
      return {
        accepted: false,
        complete: false,
        feedback: result.feedback
      };
    }
    this.placed.set(card.id, this.columnIndex);
    this.cardIndex += 1;
    const complete = this.cardIndex >= this.cards.length;
    if (!complete) this.render();
    return {
      accepted: true,
      complete,
      feedback: result.feedback
    };
  }

  close(): void {
    this.container.setVisible(false);
  }

  private render(): void {
    const card = this.cards[this.cardIndex];
    this.cardTitle.setText(
      card === undefined
        ? "来源声明已完成"
        : `${this.cardIndex + 1}/${this.cards.length}  ${card.title}`
    );
    this.cardDetail.setText(card?.detail ?? "");
    this.columnBoxes.forEach((box, index) => {
      box
        .setFillStyle(index === this.columnIndex ? 0x514137 : 0x3a302b)
        .setStrokeStyle(
          index === this.columnIndex ? 2 : 1,
          index === this.columnIndex ? 0xb2c58a : 0x6d5846
        );
      const count = [...this.placed.values()].filter(
        (placedColumn) => placedColumn === index
      ).length;
      this.columnCounts[index]?.setText(String(count));
    });
  }
}
