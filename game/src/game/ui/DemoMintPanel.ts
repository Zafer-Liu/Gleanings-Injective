import Phaser from "phaser";
import type { DemoMintReceipt } from "../domain/cultureLabel";

export class DemoMintPanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly tokenText: Phaser.GameObjects.Text;
  private readonly hashText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const shade = scene.add
      .rectangle(0, 0, 640, 360, 0x17110f, 0.8)
      .setOrigin(0);
    const panel = scene.add
      .rectangle(92, 58, 456, 244, 0x211a17, 1)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    const tag = scene.add.text(118, 82, "LOCAL DEMO / NO WALLET", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#A83B32"
    });
    const title = scene.add.text(118, 110, "把这坛回声留在本地", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "21px",
      color: "#F4EBDD"
    });
    const note = scene.add.text(
      118,
      150,
      "这是演示铸造：不会连接钱包，不会发送交易，也不会产生真实链上资产。",
      {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#B7C2C0",
        lineSpacing: 5,
        wordWrap: { width: 400 }
      }
    );
    this.tokenText = scene.add.text(118, 205, "", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "11px",
      color: "#D4B46A"
    });
    this.hashText = scene.add.text(118, 229, "", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#6E6259"
    });
    const controls = scene.add
      .text(516, 266, "E / 回车 · 完成演示", {
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
        this.tokenText,
        this.hashText,
        controls
      ])
      .setScrollFactor(0)
      .setDepth(21_000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.container.visible;
  }

  show(receipt: DemoMintReceipt): void {
    this.tokenText.setText(`TOKEN  ${receipt.tokenId}`);
    this.hashText.setText(
      `PATH   ${receipt.pathHash}  ·  NETWORK ${receipt.network}`
    );
    this.container.setVisible(true);
  }

  close(): void {
    this.container.setVisible(false);
  }
}
