import Phaser from "phaser";
import { ACT1_NOTE_ID, type Act1State } from "../domain/act1State";
import { advancedWrap } from "./textWrap";

export type InventoryAction = "read-note" | null;

export class InventoryPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly itemIcon: Phaser.GameObjects.Image;
  private readonly itemTitle: Phaser.GameObjects.Text;
  private readonly itemDescription: Phaser.GameObjects.Text;
  private hasNote = false;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.72)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(106, 54, 428, 252, 0x211a17, 0.99)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    const title = scene.add.text(132, 78, "随身物件", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "19px",
      color: "#F4EBDD"
    });
    const rule = scene.add.rectangle(132, 112, 376, 1, 0x6e4932).setOrigin(0);
    const slots = Array.from({ length: 4 }, (_, index) =>
      scene.add
        .rectangle(132 + index * 76, 132, 64, 64, 0x30231d)
        .setOrigin(0)
        .setStrokeStyle(1, index === 0 ? 0xd4b46a : 0x6e4932)
    );
    this.itemIcon = scene.add.image(148, 148, "item-note").setOrigin(0);
    this.itemTitle = scene.add.text(132, 211, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "13px",
      color: "#D4B46A",
      ...advancedWrap(376)
    });
    this.itemDescription = scene.add.text(132, 234, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "10px",
      color: "#B7C2C0",
      lineSpacing: 2,
      ...advancedWrap(376)
    });
    const controls = scene.add
      .text(508, 272, "E / 回车 查看    I 关闭", {
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
        this.itemIcon,
        this.itemTitle,
        this.itemDescription,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(15_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  open(state: Act1State): void {
    this.hasNote = state.inventory.includes(ACT1_NOTE_ID);
    this.itemIcon.setVisible(this.hasNote);
    this.itemTitle.setText(this.hasNote ? "太婆的字条" : "这里还是空的");
    this.itemDescription.setText(
      this.hasNote
        ? state.phase === "NOTE_ACQUIRED"
          ? "一张折得很小的旧纸条。墨迹已经淡了。"
          : "太婆留下的那句话，已经读过了。"
        : "先在房间里找找还有什么没整理。"
    );
    this.itemDescription.setY(
      this.itemTitle.y + this.itemTitle.height + 6
    );
    this.container.setVisible(true);
  }

  close(): void {
    this.container.setVisible(false);
  }

  activate(): InventoryAction {
    return this.hasNote ? "read-note" : null;
  }
}
