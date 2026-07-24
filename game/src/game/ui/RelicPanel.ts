import Phaser from "phaser";

export type RelicView = {
  eyebrow: string;
  name: string;
  rarity: string;
  description: string;
  texture?: string;
};

export class RelicPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly eyebrow: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly rarity: Phaser.GameObjects.Text;
  private readonly description: Phaser.GameObjects.Text;
  private readonly iconBack: Phaser.GameObjects.Rectangle;
  private icon?: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.78)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(84, 48, 472, 264, 0x211a17, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    this.iconBack = scene.add
      .rectangle(112, 96, 128, 128, 0x30231d)
      .setOrigin(0)
      .setStrokeStyle(1, 0xd4b46a);
    this.eyebrow = scene.add.text(270, 84, "", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#A83B32"
    });
    this.title = scene.add.text(270, 110, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "22px",
      color: "#F4EBDD"
    });
    this.rarity = scene.add.text(270, 146, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#D4B46A"
    });
    this.description = scene.add.text(270, 178, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "11px",
      color: "#B7C2C0",
      lineSpacing: 5,
      wordWrap: { width: 246 }
    });
    const controls = scene.add
      .text(520, 278, "E / 回车 · 收下", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0);
    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        this.iconBack,
        this.eyebrow,
        this.title,
        this.rarity,
        this.description,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(19_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  show(view: RelicView): void {
    this.eyebrow.setText(view.eyebrow);
    this.title.setText(view.name);
    this.rarity.setText(view.rarity);
    this.description.setText(view.description);
    this.icon?.destroy();
    this.icon = undefined;
    if (view.texture && this.scene.textures.exists(view.texture)) {
      this.icon = this.scene.add
        .image(176, 160, view.texture)
        .setDisplaySize(112, 112);
      this.container.add(this.icon);
    }
    this.container.setVisible(true);
  }

  close(): void {
    this.container.setVisible(false);
  }
}
