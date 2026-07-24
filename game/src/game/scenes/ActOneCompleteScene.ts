import Phaser from "phaser";
import { act1Content } from "../../content/act1/content";
import type { SenseChoice } from "../domain/act1State";
import { effectProfileForChoice } from "../fx/JarMemoryEffect";
import { SaveService } from "../systems/SaveService";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { advancedWrap } from "../ui/textWrap";

type CompleteData = {
  choice?: SenseChoice | null;
};

export class ActOneCompleteScene extends Phaser.Scene {
  private readonly saveService = new SaveService(window.localStorage);
  private readonly chapterSaveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("ActOneComplete");
  }

  create(data: CompleteData): void {
    publishActiveScene("ActOneComplete");
    const savedChoice = this.saveService.load().senseChoice;
    const choice = data.choice ?? savedChoice ?? "aroma";
    const profile = effectProfileForChoice(choice);
    const choiceContent = act1Content.dialogue.choices.find(
      (item) => item.value === choice
    );

    this.cameras.main.setBackgroundColor("#17110F");
    this.add
      .image(320, 180, "fx-jar-memory")
      .setTint(profile.tint)
      .setAlpha(0.35);
    this.add.rectangle(0, 0, 640, 360, 0x17110f, 0.66).setOrigin(0);

    this.add
      .rectangle(58, 42, 524, 276, 0x211a17, 0.98)
      .setOrigin(0)
      .setStrokeStyle(2, 0xc9873f);
    this.add.rectangle(76, 62, 5, 236, 0xa83b32).setOrigin(0);
    this.add.text(102, 68, "ACT 01 / COMPLETE", {
      fontFamily: '"Cascadia Mono", Consolas, monospace',
      fontSize: "10px",
      color: "#D4B46A",
      letterSpacing: 2
    });
    this.add.text(102, 101, "冬酿记忆已解锁", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "26px",
      color: "#F4EBDD"
    });
    this.add
      .text(102, 148, `你的第一眼 · ${profile.motif}`, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "14px",
        color: "#D4B46A",
        ...advancedWrap(420)
      });
    this.add.text(
      102,
      178,
      choiceContent?.feedback ?? "记忆从封泥的裂隙里透了出来。",
      {
        fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "11px",
        color: "#B7C2C0",
        lineSpacing: 5,
        ...advancedWrap(420)
      }
    );

    const restartBack = this.add
      .rectangle(102, 242, 170, 36, 0x6e4932)
      .setOrigin(0)
      .setStrokeStyle(1, 0xd4b46a)
      .setInteractive({ useHandCursor: true });
    this.add.text(118, 252, "R  重新体验", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "12px",
      color: "#F4EBDD"
    });
    const continueBack = this.add
      .rectangle(290, 242, 218, 36, 0x8d382f)
      .setOrigin(0)
      .setStrokeStyle(1, 0xd4b46a)
      .setInteractive({ useHandCursor: true });
    this.add.text(308, 252, "E  进入冬日酒坊", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      fontSize: "12px",
      color: "#F4EBDD"
    });

    const restart = (): void => {
      this.saveService.clear();
      this.scene.start("Apartment");
    };
    restartBack.on("pointerdown", restart);
    this.input.keyboard?.once("keydown-R", restart);

    const continueStory = (): void => {
      const chapter =
        this.chapterSaveService.load() ??
        this.chapterSaveService.createFromActOne(choice);
      if (chapter.currentAct === 2) {
        this.scene.start("ActTwo");
      }
    };
    continueBack.on("pointerdown", continueStory);
    this.input.keyboard?.once("keydown-E", continueStory);
    this.input.keyboard?.once("keydown-ENTER", continueStory);
  }
}
