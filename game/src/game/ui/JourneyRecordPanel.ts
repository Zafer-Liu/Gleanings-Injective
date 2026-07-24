import Phaser from "phaser";
import type { CultureLabel } from "../domain/cultureLabel";
import { advancedWrap } from "./textWrap";

export class JourneyRecordPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly labelText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.8)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(92, 58, 456, 244, 0x211a17, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    const tag = scene.add.text(118, 82, "JOURNEY RECORD / 酒签留存", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#A83B32",
      ...advancedWrap(400)
    });
    const title = scene.add.text(118, 110, "把这段回声收进酒签", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "21px",
      color: "#F4EBDD",
      ...advancedWrap(400)
    });
    const note = scene.add.text(
      118,
      150,
      "这张酒签收录了你一路做出的选择，留作这段旅程的回声。",
      {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#B7C2C0",
        lineSpacing: 5,
        ...advancedWrap(400)
      }
    );
    this.labelText = scene.add.text(118, 210, "", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "14px",
      color: "#D4B46A",
      ...advancedWrap(400)
    });
    const controls = scene.add
      .text(516, 266, "E / 回车 · 收好酒签", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0);
    this.container = scene.add
      .container(0, 0, [
        shade,
        panel,
        tag,
        title,
        note,
        this.labelText,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(21_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  show(label: CultureLabel): void {
    this.labelText.setText(`《${label.chineseName}》`);
    this.container.setVisible(true);
  }

  close(): void {
    this.container.setVisible(false);
  }
}
