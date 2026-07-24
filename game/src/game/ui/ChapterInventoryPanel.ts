import Phaser from "phaser";

type ChapterInventoryEntry = {
  id: string;
  title: string;
  description: string;
  texture: string;
};

const ENTRY_BY_ID: Record<string, ChapterInventoryEntry> = {
  ingredient_bowl: {
    id: "ingredient_bowl",
    title: "瓷碗",
    description: "盛放月子酒面线的瓷碗。",
    texture: "obj-bowl"
  },
  ingredient_noodles: {
    id: "ingredient_noodles",
    title: "面线",
    description: "细长柔韧的福建面线。",
    texture: "obj-noodles"
  },
  ingredient_laojiu: {
    id: "ingredient_laojiu",
    title: "福建老酒",
    description: "烹制月子酒面线要用的老酒。",
    texture: "obj-laojiu-scoop"
  },
  item_cooked_noodles: {
    id: "item_cooked_noodles",
    title: "老酒面线",
    description: "刚刚煮好的月子酒面线，应该趁热送给阿珍。",
    texture: "obj-cooked-noodles"
  }
};

export function chapterInventoryEntries(
  inventory: string[]
): ChapterInventoryEntry[] {
  return inventory.flatMap((id) => {
    const entry = ENTRY_BY_ID[id];
    return entry === undefined ? [] : [{ ...entry }];
  });
}

export class ChapterInventoryPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly itemIcons: Phaser.GameObjects.Image[];
  private readonly itemLabels: Phaser.GameObjects.Text[];
  private readonly description: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.72)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(84, 48, 472, 264, 0x211a17, 0.99)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    const title = scene.add.text(110, 72, "随身物件", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "19px",
      color: "#F4EBDD"
    });
    const rule = scene.add
      .rectangle(110, 106, 420, 1, 0x6e4932)
      .setOrigin(0);
    const slots = Array.from({ length: 4 }, (_, index) =>
      scene.add
        .rectangle(110 + index * 80, 124, 64, 64, 0x30231d)
        .setOrigin(0)
        .setStrokeStyle(1, 0x6e4932)
    );
    this.itemIcons = Array.from({ length: 4 }, (_, index) =>
      scene.add
        .image(142 + index * 80, 156, "obj-bowl")
        .setDisplaySize(48, 48)
        .setVisible(false)
    );
    this.itemLabels = Array.from({ length: 4 }, (_, index) =>
      scene.add
        .text(142 + index * 80, 198, "", {
          align: "center",
          fontFamily:
            '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: "10px",
          color: "#D4B46A"
        })
        .setOrigin(0.5, 0)
    );
    this.description = scene.add.text(110, 226, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#B7C2C0",
      lineSpacing: 5,
      wordWrap: { width: 420 }
    });
    const controls = scene.add
      .text(530, 284, "I 关闭", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0);

    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        title,
        rule,
        ...slots,
        ...this.itemIcons,
        ...this.itemLabels,
        this.description,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(15_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  open(inventory: string[]): void {
    const entries = chapterInventoryEntries(inventory).slice(0, 4);
    this.itemIcons.forEach((icon, index) => {
      const entry = entries[index];
      if (entry === undefined) {
        icon.setVisible(false);
        this.itemLabels[index].setText("");
        return;
      }
      icon.setTexture(entry.texture).setVisible(true);
      this.itemLabels[index].setText(entry.title);
    });
    this.description.setText(
      entries.length === 0
        ? "背包里暂时没有物件。"
        : entries.map((entry) => entry.description).join("\n")
    );
    this.container.setVisible(true);
  }

  close(): void {
    this.container.setVisible(false);
  }
}
