import Phaser from "phaser";
import { sceneForChapterAct } from "../domain/ChapterRoute";
import { apartmentBackgroundPolicy } from "../render/SceneVisualPolicy";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { SaveService } from "../systems/SaveService";

type FailedFile = {
  key?: string;
  src?: string;
};

export class BootScene extends Phaser.Scene {
  private readonly failedAssets = new Set<string>();

  constructor() {
    super("Boot");
  }

  preload(): void {
    const barBack = this.add
      .rectangle(320, 180, 224, 10, 0x30231d)
      .setOrigin(0.5);
    const bar = this.add
      .rectangle(210, 180, 0, 6, 0xc9873f)
      .setOrigin(0, 0.5);
    const label = this.add
      .text(320, 156, "正在打开太婆的纸箱……", {
        fontFamily: '"Noto Serif SC", serif',
        fontSize: "13px",
        color: "#EADDC5"
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      bar.width = Math.round(218 * progress);
    });
    this.load.on(
      Phaser.Loader.Events.FILE_LOAD_ERROR,
      (file: FailedFile) => {
        this.failedAssets.add(file.key ?? file.src ?? "unknown");
      }
    );
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      barBack.destroy();
      bar.destroy();
      label.destroy();
    });

    this.load.image(
      "map-apartment",
      apartmentBackgroundPolicy().assetPath
    );
    this.load.spritesheet(
      "actor-yi",
      "/sprites/spr_yi_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.spritesheet(
      "actor-mia",
      "/sprites/spr_mia_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.image(
      "obj-box",
      "/objects/obj_cardboard_box_32x32.png"
    );
    this.load.image(
      "obj-jar-sealed",
      "/objects/obj_laojiu_jar_sealed_32x64.png"
    );
    this.load.image(
      "obj-jar-open",
      "/objects/obj_laojiu_jar_open_32x64.png"
    );
    this.load.image("item-note", "/items/it_taipo_note_32x32.png");
    this.load.image("fx-jar-memory", "/fx/fx_jar_memory_640x360.png");
    this.load.image(
      "map-brewery-winter",
      "/maps/map_brewery_winter_1408x960.png"
    );
    this.load.spritesheet(
      "actor-taipo-young",
      "/sprites/spr_taipo_young_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.spritesheet(
      "actor-afeng",
      "/sprites/spr_afeng_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.image(
      "item-dongniang-relic",
      "/items/it_relic_dongniang_detail_128x128.png"
    );
    this.load.image(
      "map-postpartum-kitchen",
      "/maps/map_postpartum_kitchen_1152x832.png"
    );
    this.load.spritesheet(
      "actor-taipo-middle",
      "/sprites/spr_taipo_middle_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.spritesheet(
      "actor-azhen",
      "/sprites/spr_azhen_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.spritesheet(
      "actor-family",
      "/sprites/spr_afeng_walk_96x192.png",
      { frameWidth: 32, frameHeight: 48 }
    );
    this.load.image("obj-bowl", "/objects/obj_bowl_32x32.png");
    this.load.image(
      "obj-noodles",
      "/objects/obj_noodles_32x32.png"
    );
    this.load.image(
      "obj-laojiu-scoop",
      "/objects/obj_laojiu_ladle_32x32.png"
    );
    this.load.image(
      "obj-cooked-noodles",
      "/objects/obj_cooked_noodles_32x32.png"
    );
    this.load.image(
      "item-blue-white-cup",
      "/items/it_blue_white_cup_128x128.png"
    );
  }

  create(): void {
    if (this.failedAssets.size > 0) {
      this.showLoadError([...this.failedAssets]);
      return;
    }
    const chapter = new ChapterSaveService(window.localStorage).load();
    if (chapter !== null) {
      this.scene.start(sceneForChapterAct(chapter.currentAct));
      return;
    }
    const saved = new SaveService(window.localStorage).load();
    if (saved.phase === "COMPLETE") {
      this.scene.start("ActOneComplete", {
        choice: saved.senseChoice
      });
      return;
    }
    this.scene.start("Apartment");
  }

  private showLoadError(assetKeys: string[]): void {
    this.cameras.main.setBackgroundColor("#211A17");
    this.add
      .rectangle(320, 180, 520, 164, 0x30231d)
      .setStrokeStyle(2, 0xc74b3e);
    this.add
      .text(
        320,
        132,
        "素材没有成功装进记忆",
        {
          fontFamily: '"Noto Serif SC", serif',
          fontSize: "18px",
          color: "#F4EBDD"
        }
      )
      .setOrigin(0.5);
    this.add
      .text(320, 176, assetKeys.join("\n"), {
        align: "center",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#D4B46A",
        wordWrap: { width: 450 }
      })
      .setOrigin(0.5);
    this.add
      .text(320, 222, "请刷新页面；若仍失败，请检查上述文件。", {
        fontFamily: '"Noto Sans SC", sans-serif',
        fontSize: "12px",
        color: "#B7C2C0"
      })
      .setOrigin(0.5);
  }
}
