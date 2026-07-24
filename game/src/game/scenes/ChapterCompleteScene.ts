import Phaser from "phaser";
import { generateCultureLabel } from "../domain/cultureLabel";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { publishActiveScene } from "../systems/SceneStatus";
import { advancedWrap } from "../ui/textWrap";

export class ChapterCompleteScene extends Phaser.Scene {
  private readonly saveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("ChapterComplete");
  }

  create(): void {
    const state = this.saveService.load();
    if (state === null || state.currentAct !== "complete") {
      this.scene.start("Boot");
      return;
    }
    publishActiveScene("ChapterComplete");
    const label = generateCultureLabel(state);
    this.cameras.main.setBackgroundColor("#17110F");
    this.add
      .rectangle(24, 20, 592, 320, 0x211a17)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    this.add
      .rectangle(42, 38, 5, 284, 0xa83b32)
      .setOrigin(0);
    this.add.text(64, 40, "CHAPTER 01 / COMPLETE", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "9px",
      color: "#D4B46A"
    });
    this.add.text(64, 66, "一坛回声", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "28px",
      color: "#F4EBDD"
    });
    this.add.text(64, 108, `${label.chineseName}`, {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "14px",
      color: "#D4B46A",
      ...advancedWrap(520)
    });
    this.add.text(64, 132, label.englishName, {
      fontFamily: "Georgia, serif",
      fontSize: "10px",
      color: "#B7C2C0",
      ...advancedWrap(520)
    });

    const relics = [
      {
        x: 76,
        title: "冬酿曲印",
        mark: state.act2Question ?? "—"
      },
      {
        x: 236,
        title: "青花酒盏",
        mark: state.act3Inscription ?? "—"
      },
      {
        x: 396,
        title: "一坛回声",
        mark: label.pathHash
      }
    ];
    relics.forEach((item) => {
      this.add
        .rectangle(item.x, 168, 140, 86, 0x30231d)
        .setOrigin(0)
        .setStrokeStyle(1, 0x6e4932);
      this.add.text(item.x + 12, 183, item.title, {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "12px",
        color: "#F4EBDD",
        ...advancedWrap(116)
      });
      this.add.text(item.x + 12, 214, item.mark, {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "8px",
        color: "#D4B46A",
        ...advancedWrap(112)
      });
    });
    this.add.text(
      64,
      276,
      "V  重播《从一坛福建老酒，到中国黄酒》",
      {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#F4EBDD",
        backgroundColor: "#6E4932",
        padding: { x: 10, y: 7 }
      }
    );
    this.add.text(400, 270, "N  进入第二章《一叶来处》", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "9px",
      color: "#D4B46A"
    });
    this.add.text(400, 292, "R  从第一幕重新体验", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "9px",
      color: "#B7C2C0"
    });
    this.add.text(
      64,
      316,
      "本章酒签与故事进度均保存在浏览器本地。",
      {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "8px",
        color: "#6E6259"
      }
    );

    this.input.keyboard?.on("keydown-V", () => {
      this.scene.start("HuangjiuFilm", { replay: true });
    });
    this.input.keyboard?.on("keydown-N", () => {
      const longjingService = new LongjingSaveService(
        window.localStorage
      );
      const longjing = longjingService.load() ?? longjingService.create();
      this.scene.start(sceneForLongjingAct(longjing.currentAct));
    });
    this.input.keyboard?.on("keydown-R", () => {
      this.saveService.clearAll();
      this.scene.start("Apartment");
    });
  }
}
