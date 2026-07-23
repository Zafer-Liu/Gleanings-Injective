import Phaser from "phaser";
import {
  HUANGJIU_FILM_DURATION_MS,
  filmSegmentAt,
  type HuangjiuFilmSegment
} from "../../content/film/huangjiuFilm";
import { FilmTimeline } from "../domain/FilmTimeline";
import { reduceChapter } from "../domain/chapterReducer";
import type { ChapterOneSaveV2 } from "../domain/chapterState";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { publishActiveScene } from "../systems/SceneStatus";

type FilmData = {
  replay?: boolean;
};

type FilmKeys = {
  pause: Phaser.Input.Keyboard.Key;
  subtitles: Phaser.Input.Keyboard.Key;
  skip: Phaser.Input.Keyboard.Key;
};

export class HuangjiuFilmScene extends Phaser.Scene {
  private timeline = new FilmTimeline(HUANGJIU_FILM_DURATION_MS);
  private state!: ChapterOneSaveV2;
  private keys!: FilmKeys;
  private segmentContainer?: Phaser.GameObjects.Container;
  private activeSegmentId = "";
  private progressFill!: Phaser.GameObjects.Rectangle;
  private chapterText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleBack!: Phaser.GameObjects.Rectangle;
  private subtitleText!: Phaser.GameObjects.Text;
  private sourceText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private subtitlesVisible = true;
  private replay = false;
  private finishing = false;
  private readonly saveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("HuangjiuFilm");
  }

  create(data: FilmData): void {
    const saved = this.saveService.load();
    this.replay = data.replay === true;
    if (
      saved === null ||
      (saved.currentAct !== "film" &&
        !(this.replay && saved.currentAct === "complete"))
    ) {
      this.scene.start("ChapterComplete");
      return;
    }
    this.state = saved;
    publishActiveScene("HuangjiuFilm");
    this.timeline = new FilmTimeline(HUANGJIU_FILM_DURATION_MS);
    this.cameras.main.setBackgroundColor("#17110F");
    this.createControls();
    this.createChrome();
    this.renderSegment(filmSegmentAt(0));
  }

  update(_time: number, delta: number): void {
    if (!this.keys || this.finishing) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.pause)) {
      this.timeline.togglePause();
      this.stateText.setText(
        this.timeline.paused ? "已暂停" : "播放中"
      );
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.subtitles)) {
      this.subtitlesVisible = !this.subtitlesVisible;
      this.subtitleBack.setVisible(this.subtitlesVisible);
      this.subtitleText.setVisible(this.subtitlesVisible);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.skip)) {
      this.timeline.skip();
      this.finishFilm(true);
      return;
    }

    this.timeline.tick(delta);
    this.progressFill.setSize(
      Math.round(560 * this.timeline.progress),
      4
    );
    const segment = filmSegmentAt(this.timeline.currentMs);
    if (segment.id !== this.activeSegmentId) {
      this.renderSegment(segment);
    }
    if (this.timeline.ended) {
      this.finishFilm(false);
    }
  }

  private createControls(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error("Keyboard input is unavailable");
    }
    this.keys = {
      pause: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      subtitles: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      skip: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    };
  }

  private createChrome(): void {
    this.add
      .rectangle(0, 0, 640, 360, 0x17110f)
      .setOrigin(0)
      .setDepth(900);
    this.add
      .rectangle(20, 16, 600, 328, 0x211a17, 0)
      .setOrigin(0)
      .setStrokeStyle(1, 0x6e4932)
      .setDepth(1_000);
    this.chapterText = this.add
      .text(34, 28, "", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#D4B46A"
      })
      .setDepth(1_100);
    this.titleText = this.add
      .text(34, 48, "", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "20px",
        color: "#F4EBDD"
      })
      .setDepth(1_100);
    this.sourceText = this.add
      .text(606, 30, "", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#6E6259"
      })
      .setOrigin(1, 0)
      .setDepth(1_100);

    this.subtitleBack = this.add
      .rectangle(32, 254, 576, 68, 0x211a17, 0.98)
      .setOrigin(0)
      .setStrokeStyle(1, 0xc9873f)
      .setDepth(1_100);
    this.subtitleText = this.add
      .text(48, 268, "", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "12px",
        color: "#F4EBDD",
        lineSpacing: 5,
        wordWrap: { width: 544 }
      })
      .setDepth(1_101);

    this.add
      .rectangle(40, 332, 560, 4, 0x30231d)
      .setOrigin(0)
      .setDepth(1_100);
    this.progressFill = this.add
      .rectangle(40, 332, 0, 4, 0xa83b32)
      .setOrigin(0)
      .setDepth(1_101);
    this.stateText = this.add
      .text(40, 340, "播放中", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#D4B46A"
      })
      .setDepth(1_100);
    this.add
      .text(600, 340, "SPACE 暂停  ·  S 字幕  ·  ESC 跳过", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#B7C2C0"
      })
      .setOrigin(1, 0)
      .setDepth(1_100);
  }

  private renderSegment(segment: HuangjiuFilmSegment): void {
    this.segmentContainer?.destroy(true);
    this.tweens.killAll();
    this.activeSegmentId = segment.id;
    this.chapterText.setText(segment.chapter);
    this.titleText.setText(segment.title);
    this.subtitleText.setText(segment.subtitle);
    this.sourceText.setText(segment.sourceLabel);

    const container = this.add.container(0, 0).setDepth(950);
    this.segmentContainer = container;
    switch (segment.visual) {
      case "family-jar":
        this.renderFamilyJar(container);
        break;
      case "grain-wine":
        this.renderGrainWine(container);
        break;
      case "jiahu-vessel":
        this.renderJiahu(container);
        break;
      case "qu-fermentation":
        this.renderFermentation(container);
        break;
      case "song-yuan":
        this.renderSongYuan(container);
        break;
      case "fujian-hongqu":
        this.renderFujian(container);
        break;
    }
  }

  private renderFamilyJar(
    container: Phaser.GameObjects.Container
  ): void {
    const image = this.add
      .image(320, 166, "map-apartment")
      .setDisplaySize(540, 360)
      .setTint(0xc7b098);
    const veil = this.add
      .rectangle(32, 76, 576, 170, 0x211a17, 0.34)
      .setOrigin(0);
    const jar = this.add
      .image(466, 198, "obj-jar-open")
      .setDisplaySize(64, 128);
    const caption = this.add.text(72, 180, "一坛酒\n一封没有寄完的家书", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "15px",
      color: "#F4EBDD",
      lineSpacing: 10
    });
    container.add([image, veil, jar, caption]);
    this.tweens.add({
      targets: jar,
      y: 190,
      duration: 4_000,
      yoyo: true,
      repeat: -1,
      ease: "Stepped"
    });
  }

  private renderGrainWine(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 76, 576, 170, 0x30231d)
      .setOrigin(0);
    const labels = [
      { x: 104, label: "谷物", color: 0xd4b46a },
      { x: 232, label: "蒸煮", color: 0xc9873f },
      { x: 360, label: "加曲", color: 0xa83b32 },
      { x: 488, label: "发酵", color: 0x8d382f }
    ];
    container.add(back);
    labels.forEach((item, index) => {
      const block = this.add
        .rectangle(item.x, 150, 78, 64, item.color)
        .setStrokeStyle(3, 0x211a17);
      const text = this.add
        .text(item.x, 198, item.label, {
          fontFamily:
            '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: "11px",
          color: "#F4EBDD"
        })
        .setOrigin(0.5);
      container.add([block, text]);
      if (index < labels.length - 1) {
        container.add(
          this.add
            .text(item.x + 64, 144, "→", {
              fontFamily: "monospace",
              fontSize: "18px",
              color: "#D4B46A"
            })
            .setOrigin(0.5)
        );
      }
    });
  }

  private renderJiahu(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 76, 576, 170, 0x46352c)
      .setOrigin(0);
    const vessel = this.add.graphics();
    vessel.fillStyle(0x9a6442, 1);
    vessel.fillRect(270, 102, 100, 22);
    vessel.fillRect(252, 124, 136, 72);
    vessel.fillRect(270, 196, 100, 28);
    vessel.lineStyle(4, 0x211a17, 1);
    vessel.strokeRect(270, 102, 100, 22);
    vessel.strokeRect(252, 124, 136, 72);
    const rice = this.add.text(92, 126, "稻米", {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "13px",
      color: "#EADDC5"
    });
    const honey = this.add.text(92, 166, "蜂蜜", {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "13px",
      color: "#D4B46A"
    });
    const fruit = this.add.text(478, 146, "果实", {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "13px",
      color: "#C9873F"
    });
    container.add([back, vessel, rice, honey, fruit]);
  }

  private renderFermentation(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 76, 576, 170, 0x30231d)
      .setOrigin(0);
    const left = this.add
      .rectangle(64, 104, 222, 112, 0x6e4932)
      .setOrigin(0)
      .setStrokeStyle(2, 0xd4b46a);
    const right = this.add
      .rectangle(354, 104, 222, 112, 0x46352c)
      .setOrigin(0)
      .setStrokeStyle(2, 0xa83b32);
    const sugar = this.add.text(
      175,
      134,
      "淀粉 → 糖\n糖化",
      {
        align: "center",
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "15px",
        color: "#F4EBDD",
        lineSpacing: 9
      }
    ).setOrigin(0.5, 0);
    const alcohol = this.add.text(
      465,
      134,
      "糖 → 酒精\n发酵",
      {
        align: "center",
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "15px",
        color: "#F4EBDD",
        lineSpacing: 9
      }
    ).setOrigin(0.5, 0);
    const simultaneous = this.add
      .text(320, 150, "⇄", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#D4B46A"
      })
      .setOrigin(0.5);
    container.add([
      back,
      left,
      right,
      sugar,
      alcohol,
      simultaneous
    ]);
  }

  private renderSongYuan(
    container: Phaser.GameObjects.Container
  ): void {
    const image = this.add
      .image(300, 164, "map-brewery-winter")
      .setDisplaySize(620, 430)
      .setTint(0xd4b090);
    const tag = this.add
      .text(54, 210, "酿造 · 澄清 · 储存", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "13px",
        color: "#F4EBDD",
        backgroundColor: "#211A17",
        padding: { x: 10, y: 7 }
      });
    container.add([image, tag]);
    this.tweens.add({
      targets: image,
      x: 340,
      duration: 10_000,
      ease: "Linear"
    });
  }

  private renderFujian(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 76, 576, 170, 0x30231d)
      .setOrigin(0);
    const jar = this.add
      .image(320, 158, "obj-jar-sealed")
      .setDisplaySize(72, 144);
    const redPixels = Array.from({ length: 18 }, (_, index) =>
      this.add.rectangle(
        92 + index * 26,
        122 + (index % 3) * 18,
        10,
        10,
        index % 2 === 0 ? 0xa83b32 : 0x8d382f
      )
    );
    const line = this.add
      .text(320, 218, "福建 · 红曲 · 家的味道", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "13px",
        color: "#F4EBDD"
      })
      .setOrigin(0.5);
    container.add([back, ...redPixels, jar, line]);
  }

  private finishFilm(skipped: boolean): void {
    if (this.finishing) return;
    this.finishing = true;
    if (!this.replay) {
      this.state = reduceChapter(this.state, {
        type: skipped ? "FILM_SKIPPED" : "FILM_SEEN"
      });
      this.saveService.save(this.state);
    }
    this.cameras.main.fadeOut(420, 23, 17, 15);
    this.time.delayedCall(440, () => {
      this.scene.start("ChapterComplete");
    });
  }
}
