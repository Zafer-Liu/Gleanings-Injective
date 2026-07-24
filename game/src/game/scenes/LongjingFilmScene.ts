import Phaser from "phaser";
import {
  LONGJING_FILM_DURATION_MS,
  longjingFilmSegmentAt,
  type LongjingFilmSegment
} from "../../content/film/longjingFilm";
import {
  createFilmAudioState,
  filmAudioLabel,
  reduceFilmAudio,
  type FilmAudioAction,
  type FilmAudioState
} from "../domain/FilmAudioControl";
import { FilmTimeline } from "../domain/FilmTimeline";
import { reduceLongjing } from "../domain/longjingReducer";
import type { LongjingSaveV1 } from "../domain/longjingState";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { publishActiveScene } from "../systems/SceneStatus";

type FilmData = {
  replay?: boolean;
};

type FilmKeys = {
  pause: Phaser.Input.Keyboard.Key;
  subtitles: Phaser.Input.Keyboard.Key;
  skip: Phaser.Input.Keyboard.Key;
  volumeUp: Phaser.Input.Keyboard.Key;
  volumeDown: Phaser.Input.Keyboard.Key;
  mute: Phaser.Input.Keyboard.Key;
};

export class LongjingFilmScene extends Phaser.Scene {
  private timeline = new FilmTimeline(LONGJING_FILM_DURATION_MS);
  private state!: LongjingSaveV1;
  private keys!: FilmKeys;
  private segmentContainer?: Phaser.GameObjects.Container;
  private activeSegmentId = "";
  private progressFill!: Phaser.GameObjects.Rectangle;
  private chapterText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleBack!: Phaser.GameObjects.Rectangle;
  private subtitleText!: Phaser.GameObjects.Text;
  private factText!: Phaser.GameObjects.Text;
  private sourceText!: Phaser.GameObjects.Text;
  private stateText!: Phaser.GameObjects.Text;
  private audioText!: Phaser.GameObjects.Text;
  private audioState: FilmAudioState = createFilmAudioState();
  private subtitlesVisible = true;
  private replay = false;
  private finishing = false;
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingFilm");
  }

  create(data: FilmData): void {
    const saved = this.saveService.load();
    this.replay = data.replay === true;
    if (
      saved === null ||
      (saved.currentAct !== "film" &&
        !(this.replay && saved.currentAct === "complete"))
    ) {
      this.scene.start("LongjingComplete");
      return;
    }
    this.state = saved;
    publishActiveScene("LongjingFilm");
    this.timeline = new FilmTimeline(LONGJING_FILM_DURATION_MS);
    this.audioState = createFilmAudioState();
    this.applyAudioState();
    this.cameras.main.setBackgroundColor("#171516");
    this.createControls();
    this.createChrome();
    this.renderSegment(longjingFilmSegmentAt(0));
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.volumeUp)) {
      this.updateAudio({ type: "VOLUME_UP" });
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.volumeDown)) {
      this.updateAudio({ type: "VOLUME_DOWN" });
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.mute)) {
      this.updateAudio({ type: "TOGGLE_MUTE" });
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
    const segment = longjingFilmSegmentAt(
      this.timeline.currentMs
    );
    if (segment.id !== this.activeSegmentId) {
      this.renderSegment(segment);
    }
    if (this.timeline.ended) this.finishFilm(false);
  }

  private createControls(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error("Keyboard input is unavailable");
    }
    this.keys = {
      pause: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      subtitles: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      skip: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      volumeUp: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      volumeDown: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      mute: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    };
  }

  private createChrome(): void {
    this.add
      .rectangle(0, 0, 640, 360, 0x171516)
      .setOrigin(0)
      .setDepth(900);
    this.add
      .rectangle(20, 16, 600, 328, 0x262223, 0)
      .setOrigin(0)
      .setStrokeStyle(1, 0x6d5846)
      .setDepth(1_000);
    this.chapterText = this.add
      .text(34, 28, "", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "9px",
        color: "#91AB73"
      })
      .setDepth(1_100);
    this.titleText = this.add
      .text(34, 47, "", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "19px",
        color: "#F0E4CA"
      })
      .setDepth(1_100);
    this.sourceText = this.add
      .text(606, 29, "", {
        align: "right",
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#839CA0",
        wordWrap: { width: 220 }
      })
      .setOrigin(1, 0)
      .setDepth(1_100);
    this.factText = this.add
      .text(606, 66, "", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "8px",
        color: "#262223",
        backgroundColor: "#B2C58A",
        padding: { x: 6, y: 3 }
      })
      .setOrigin(1, 0)
      .setDepth(1_100);

    this.subtitleBack = this.add
      .rectangle(32, 252, 576, 72, 0x262223, 1)
      .setOrigin(0)
      .setStrokeStyle(1, 0x91ab73)
      .setDepth(1_100);
    this.subtitleText = this.add
      .text(48, 264, "", {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#F0E4CA",
        lineSpacing: 4,
        wordWrap: { width: 544 }
      })
      .setDepth(1_101);

    this.add
      .rectangle(40, 332, 560, 4, 0x3a302b)
      .setOrigin(0)
      .setDepth(1_100);
    this.progressFill = this.add
      .rectangle(40, 332, 0, 4, 0x91ab73)
      .setOrigin(0)
      .setDepth(1_101);
    this.stateText = this.add
      .text(40, 340, "播放中", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#B2C58A"
      })
      .setDepth(1_100);
    this.audioText = this.add
      .text(90, 340, filmAudioLabel(this.audioState), {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#B2C58A"
      })
      .setDepth(1_100);
    this.add
      .text(
        600,
        340,
        "↑↓ 音量 · M 静音 · SPACE 暂停 · S 字幕 · ESC 跳过",
        {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "7px",
        color: "#AFC3BD"
        }
      )
      .setOrigin(1, 0)
      .setDepth(1_100);
  }

  private updateAudio(action: FilmAudioAction): void {
    this.audioState = reduceFilmAudio(this.audioState, action);
    this.applyAudioState();
    this.audioText.setText(filmAudioLabel(this.audioState));
  }

  private applyAudioState(): void {
    this.sound.volume = this.audioState.volume;
    this.sound.mute = this.audioState.muted;
  }

  private renderSegment(segment: LongjingFilmSegment): void {
    this.segmentContainer?.destroy(true);
    this.tweens.killAll();
    this.activeSegmentId = segment.id;
    this.chapterText.setText(segment.chapter);
    this.titleText.setText(segment.title);
    this.subtitleText.setText(segment.subtitle);
    this.factText.setText(segment.factLabel);
    this.sourceText.setText(segment.sourceLabel);
    const container = this.add.container(0, 0).setDepth(950);
    this.segmentContainer = container;

    switch (segment.visual) {
      case "restart-pan":
        this.renderPan(container);
        break;
      case "three-regions":
        this.renderRegions(container);
        break;
      case "history-legend":
        this.renderHistory(container);
        break;
      case "hand-craft":
        this.renderCraft(container);
        break;
      case "trace-origin":
        this.renderTrace(container);
        break;
      case "living-heritage":
        this.renderHeritage(container);
        break;
    }
  }

  private renderPan(container: Phaser.GameObjects.Container): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x3a302b)
      .setOrigin(0);
    const stove = this.add
      .rectangle(214, 176, 212, 58, 0x262223)
      .setOrigin(0);
    const pan = this.add.graphics();
    pan.fillStyle(0x171516).fillCircle(320, 164, 92);
    pan.lineStyle(7, 0xa68a68).strokeCircle(320, 164, 92);
    const leaves = Array.from({ length: 16 }, (_, index) =>
      this.add.rectangle(
        250 + (index % 8) * 20,
        132 + Math.floor(index / 8) * 28,
        14,
        6,
        index % 2 === 0 ? 0x91ab73 : 0x567a51
      )
    );
    container.add([back, stove, pan, ...leaves]);
    this.tweens.add({
      targets: leaves,
      y: "-=10",
      duration: 680,
      yoyo: true,
      repeat: -1,
      ease: "Stepped"
    });
  }

  private renderRegions(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x647b82)
      .setOrigin(0);
    const regions = [
      { x: 86, w: 150, label: "西湖", color: 0x91ab73 },
      { x: 246, w: 144, label: "钱塘", color: 0x567a51 },
      { x: 400, w: 154, label: "越州", color: 0x3e6345 }
    ];
    container.add(back);
    regions.forEach((region) => {
      const block = this.add
        .rectangle(region.x, 116, region.w, 82, region.color)
        .setOrigin(0)
        .setStrokeStyle(3, 0x262223);
      const label = this.add
        .text(region.x + region.w / 2, 156, region.label, {
          fontFamily:
            '"Microsoft YaHei", "PingFang SC", sans-serif',
          fontSize: "15px",
          color: "#F0E4CA"
        })
        .setOrigin(0.5);
      container.add([block, label]);
    });
    container.add(
      this.add
        .text(320, 222, "龙井茶地理标志保护范围", {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "10px",
          color: "#D6E1D5"
        })
        .setOrigin(0.5)
    );
  }

  private renderHistory(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x514137)
      .setOrigin(0);
    const line = this.add
      .rectangle(82, 164, 476, 4, 0xc4a883)
      .setOrigin(0);
    container.add([back, line]);
    [
      { x: 112, year: "唐", note: "茶事源流" },
      { x: 274, year: "宋元明", note: "声名渐著" },
      { x: 446, year: "清", note: "相关传说流传" }
    ].forEach((item) => {
      const node = this.add
        .rectangle(item.x, 154, 20, 20, 0x91ab73)
        .setStrokeStyle(3, 0x262223);
      const year = this.add
        .text(item.x, 116, item.year, {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "13px",
          color: "#F0E4CA"
        })
        .setOrigin(0.5);
      const note = this.add
        .text(item.x, 188, item.note, {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "9px",
          color: "#DED0B3"
        })
        .setOrigin(0.5);
      container.add([node, year, note]);
    });
  }

  private renderCraft(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x3a302b)
      .setOrigin(0);
    const pan = this.add.graphics();
    pan.fillStyle(0x171516).fillCircle(320, 150, 74);
    pan.lineStyle(6, 0xa68a68).strokeCircle(320, 150, 74);
    const top = this.add
      .text(320, 104, "抖  带  挤  甩  挺", {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: "12px",
        color: "#B2C58A"
      })
      .setOrigin(0.5);
    const bottom = this.add
      .text(320, 206, "拓  扣  抓  压  磨", {
        fontFamily: '"Microsoft YaHei", sans-serif',
        fontSize: "12px",
        color: "#B2C58A"
      })
      .setOrigin(0.5);
    const hand = this.add
      .rectangle(320, 150, 96, 22, 0xc4a883)
      .setAngle(-12);
    container.add([back, pan, top, bottom, hand]);
    this.tweens.add({
      targets: hand,
      x: 346,
      angle: 8,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Stepped"
    });
  }

  private renderTrace(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x262223)
      .setOrigin(0);
    const labels = ["产地", "原料", "采制", "产销记录", "规范标识"];
    container.add(back);
    labels.forEach((label, index) => {
      const x = 54 + index * 109;
      const card = this.add
        .rectangle(x, 120, 96, 84, index === 0 ? 0x567a51 : 0x3a302b)
        .setOrigin(0)
        .setStrokeStyle(2, index === 0 ? 0xb2c58a : 0x6d5846);
      const text = this.add
        .text(x + 48, 162, label, {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "10px",
          color: "#F0E4CA",
          wordWrap: { width: 80 },
          align: "center"
        })
        .setOrigin(0.5);
      container.add([card, text]);
    });
  }

  private renderHeritage(
    container: Phaser.GameObjects.Container
  ): void {
    const back = this.add
      .rectangle(32, 82, 576, 164, 0x1f352b)
      .setOrigin(0);
    container.add(back);
    ["茶园", "锅台", "待客", "师徒"].forEach((label, index) => {
      const x = 54 + index * 137;
      const panel = this.add
        .rectangle(x, 108, 118, 94, index % 2 ? 0x514137 : 0x3e6345)
        .setOrigin(0)
        .setStrokeStyle(2, 0xb2c58a);
      const icon = this.add
        .rectangle(x + 59, 140, 44, 32, 0x91ab73)
        .setStrokeStyle(2, 0x262223);
      const text = this.add
        .text(x + 59, 184, label, {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "11px",
          color: "#F0E4CA"
        })
        .setOrigin(0.5);
      container.add([panel, icon, text]);
    });
    container.add(
      this.add
        .text(320, 222, "2022 · 活在日常实践中的技艺", {
          fontFamily: '"Microsoft YaHei", sans-serif',
          fontSize: "10px",
          color: "#D6E1D5"
        })
        .setOrigin(0.5)
    );
  }

  private finishFilm(skipped: boolean): void {
    if (this.finishing) return;
    this.finishing = true;
    if (!this.replay) {
      this.state = reduceLongjing(this.state, {
        type: skipped
          ? "LONGJING_FILM_SKIPPED"
          : "LONGJING_FILM_SEEN"
      });
      this.saveService.save(this.state);
    }
    this.cameras.main.fadeOut(420, 23, 21, 22);
    this.time.delayedCall(440, () => {
      this.scene.start("LongjingComplete");
    });
  }
}
