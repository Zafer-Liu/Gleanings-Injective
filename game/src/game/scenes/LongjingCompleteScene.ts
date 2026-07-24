import Phaser from "phaser";
import type { LongjingInscription } from "../domain/longjingState";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { publishActiveScene } from "../systems/SceneStatus";

const INSCRIPTION_COPY: Record<
  LongjingInscription,
  { title: string; line: string }
> = {
  restore_name: {
    title: "还名",
    line: "把名称还给真正的地方与记录。"
  },
  keep_truth: {
    title: "留真",
    line: "留下能被下一双眼睛继续核查的证据。"
  },
  pass_on: {
    title: "传手",
    line: "让手艺重新回到观察、练习与传授之间。"
  }
};

export class LongjingCompleteScene extends Phaser.Scene {
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingComplete");
  }

  create(): void {
    const state = this.saveService.load();
    if (state === null || state.currentAct !== "complete") {
      this.scene.start("Boot");
      return;
    }
    publishActiveScene("LongjingComplete");
    const inscription =
      INSCRIPTION_COPY[state.inscription ?? "pass_on"];
    this.cameras.main.setBackgroundColor("#171516");
    this.add
      .rectangle(20, 18, 600, 324, 0x262223)
      .setOrigin(0)
      .setStrokeStyle(2, 0x91ab73);
    this.add
      .rectangle(38, 36, 5, 286, 0x7f3029)
      .setOrigin(0);
    this.add.text(60, 38, "CHAPTER 02 / COMPLETE", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#91AB73"
    });
    this.add.text(60, 62, "一叶来处", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "27px",
      color: "#F0E4CA"
    });
    this.add.text(60, 101, `${inscription.title} · ${inscription.line}`, {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "12px",
      color: "#D6E1D5"
    });

    this.drawRelic(62, 142, "第一章", "一坛回声", "坛");
    this.drawRelic(238, 142, "第二章", "清明芽签", "芽");
    this.drawRelic(414, 142, "第二章", "一叶来处", "叶");

    this.add.text(
      60,
      252,
      "V  重看《一片叶，为什么叫西湖龙井》",
      {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#F0E4CA",
        backgroundColor: "#3E6345",
        padding: { x: 10, y: 7 }
      }
    );
    this.add.text(406, 258, "H  重看第一章黄酒后记", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "9px",
      color: "#AFC3BD"
    });
    this.add.text(406, 280, "R  重新体验第二章", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "9px",
      color: "#AFC3BD"
    });
    this.add.text(
      60,
      307,
      "数字剧情纪念品不构成对现实茶叶产地、品质、地理标志或真伪的证明。",
      {
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "8px",
        color: "#839CA0",
        wordWrap: { width: 520 }
      }
    );

    this.input.keyboard?.on("keydown-V", () => {
      this.scene.start("LongjingFilm", { replay: true });
    });
    this.input.keyboard?.on("keydown-H", () => {
      this.scene.start("HuangjiuFilm", {
        replay: true,
        returnScene: "LongjingComplete"
      });
    });
    this.input.keyboard?.on("keydown-R", () => {
      this.saveService.clear();
      this.saveService.create();
      this.scene.start("LongjingMarket");
    });
  }

  private drawRelic(
    x: number,
    y: number,
    eyebrow: string,
    title: string,
    glyph: string
  ): void {
    this.add
      .rectangle(x, y, 152, 82, 0x3a302b)
      .setOrigin(0)
      .setStrokeStyle(1, 0x6d5846);
    this.add
      .rectangle(x + 12, y + 15, 42, 42, 0x1f352b)
      .setStrokeStyle(2, 0x91ab73);
    this.add
      .text(x + 33, y + 36, glyph, {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: "17px",
        color: "#B2C58A"
      })
      .setOrigin(0.5);
    this.add.text(x + 66, y + 17, eyebrow, {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "7px",
      color: "#839CA0"
    });
    this.add.text(x + 66, y + 38, title, {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "12px",
      color: "#F0E4CA"
    });
  }
}
