import Phaser from "phaser";
import {
  act2Content,
  act2Dialogue,
  act2Quest
} from "../../content/act2/content";
import type { ChapterInteractable } from "../../content/chapter/types";
import {
  act2QuestId,
  act2RelicView,
  act2TargetId
} from "../domain/act2Flow";
import {
  reduceChapter,
  type ChapterEvent
} from "../domain/chapterReducer";
import type {
  Act2Question,
  ChapterOneSaveV2
} from "../domain/chapterState";
import { Player, type MovementKeys } from "../entities/Player";
import {
  buildChapterGeometry,
  type ChapterPixelOccluder
} from "../render/ChapterMapGeometry";
import { tileToPixelCenter } from "../render/ApartmentRenderer";
import { findChapterTarget } from "../systems/ChapterInteraction";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChapterChoicePanel } from "../ui/ChapterChoicePanel";
import { ChapterHud } from "../ui/ChapterHud";
import { DialogueBox } from "../ui/DialogueBox";
import { RelicPanel } from "../ui/RelicPanel";

type CommandKeys = {
  interact: Phaser.Input.Keyboard.Key;
  alternate: Phaser.Input.Keyboard.Key;
  confirm: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
};

const STATION_IDS = [
  "hongqu_tray",
  "clay_jar",
  "mix_station",
  "vat_station",
  "seal_station"
] as const;

const PHASE_ORDER = [
  "ARRIVE",
  "INSPECT_TRAY",
  "INSPECT_JAR",
  "TAKE_SAMPLE",
  "MIX",
  "VAT",
  "SEAL",
  "QUESTION",
  "COMPLETE"
] as const;

export class ActTwoScene extends Phaser.Scene {
  private state!: ChapterOneSaveV2;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: CommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private choices!: ChapterChoicePanel<Act2Question>;
  private relic!: RelicPanel;
  private questMarker!: Phaser.GameObjects.Container;
  private readonly stationMarks = new Map<
    string,
    Phaser.GameObjects.Rectangle
  >();
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("ActTwo");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null || saved.currentAct !== 2) {
      this.scene.start("ActOneComplete");
      return;
    }
    this.state = saved;
    publishActiveScene("ActTwo");

    const geometry = buildChapterGeometry(act2Content.map);
    this.physics.world.setBounds(
      0,
      0,
      geometry.width,
      geometry.height
    );
    this.add
      .image(0, 0, "map-brewery-winter")
      .setOrigin(0)
      .setDisplaySize(geometry.width, geometry.height)
      .setDepth(0);
    this.createForegroundOccluders(
      geometry.occluders,
      geometry.width,
      geometry.height
    );
    this.createStationMarks();

    const master = tileToPixelCenter(
      act2Content.map.npcSpawns.master,
      act2Content.map.tileSize
    );
    this.add
      .sprite(master.x, master.y, "actor-afeng", 1)
      .setOrigin(0.5, 0.78)
      .setName("master")
      .setDepth(master.y);

    const spawn = tileToPixelCenter(
      this.state.playerTile,
      act2Content.map.tileSize
    );
    this.player = new Player(
      this,
      spawn.x,
      spawn.y,
      "actor-taipo-young"
    );
    this.lastTile = { ...this.state.playerTile };

    for (const collision of geometry.collisions) {
      const zone = this.add.zone(
        collision.x + collision.width / 2,
        collision.y + collision.height / 2,
        collision.width,
        collision.height
      );
      this.physics.add.existing(zone, true);
      this.physics.add.collider(this.player, zone);
    }

    this.configureInput();
    this.cameras.main.setBounds(
      0,
      0,
      geometry.width,
      geometry.height
    );
    this.cameras.main
      .startFollow(this.player, true, 1, 1)
      .setDeadzone(104, 72);
    this.cameras.main.roundPixels = true;

    this.hud = new ChapterHud(this);
    this.dialogue = new DialogueBox(this);
    this.choices = new ChapterChoicePanel<Act2Question>(this);
    this.relic = new RelicPanel(this);
    this.createQuestMarker();
    this.refreshAll();

    if (this.state.act2Phase === "ARRIVE") {
      this.dialogue.play(act2Dialogue("opening"));
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(): void {
    if (!this.player) return;
    if (this.handleDialogueInput()) return;
    if (this.handleChoiceInput()) return;
    if (this.handleRelicInput()) return;

    const moved = this.player.updateMovement(
      this.movementKeys,
      false
    );
    if (moved) this.trackPlayerTile();

    const target = this.currentTarget();
    this.hud.setPrompt(target?.prompt ?? null);
    if (this.actionJustDown()) {
      this.handleInteraction(target);
    }
  }

  private configureInput(): void {
    const keyboard = this.input.keyboard;
    if (keyboard === null) {
      throw new Error("Keyboard input is unavailable");
    }
    const cursors = keyboard.createCursorKeys();
    const wasd = keyboard.addKeys("W,A,S,D") as Record<
      "W" | "A" | "S" | "D",
      Phaser.Input.Keyboard.Key
    >;
    this.movementKeys = {
      up: {
        get isDown() {
          return cursors.up.isDown || wasd.W.isDown;
        }
      },
      down: {
        get isDown() {
          return cursors.down.isDown || wasd.S.isDown;
        }
      },
      left: {
        get isDown() {
          return cursors.left.isDown || wasd.A.isDown;
        }
      },
      right: {
        get isDown() {
          return cursors.right.isDown || wasd.D.isDown;
        }
      }
    };
    this.commandKeys = {
      interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      alternate: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      confirm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      up: cursors.up,
      down: cursors.down
    };
  }

  private handleDialogueInput(): boolean {
    if (!this.dialogue.isActive) return false;
    this.player.updateMovement(this.movementKeys, true);
    this.hud.setPrompt(null);
    if (this.actionJustDown()) this.dialogue.advance();
    return true;
  }

  private handleChoiceInput(): boolean {
    if (!this.choices.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.up)) {
      this.choices.move(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.down)) {
      this.choices.move(1);
    }
    if (!this.actionJustDown()) return true;

    const selected = this.choices.selectedChoice();
    const choice = this.choices.confirm();
    if (selected === null || choice === null) return true;
    this.choices.close();
    this.dispatch({
      type: "ACT2_CHOOSE_QUESTION",
      choice
    });
    this.dialogue.play(
      [
        {
          speakerId: "memory",
          speakerName: "记忆回响",
          text: selected.feedback
        }
      ],
      () => {
        this.relic.show(act2RelicView(this.state.act1Sense, choice));
      }
    );
    return true;
  }

  private handleRelicInput(): boolean {
    if (!this.relic.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (this.actionJustDown()) {
      this.relic.close();
      this.scene.start("ActThree");
    }
    return true;
  }

  private currentTarget(): ChapterInteractable | null {
    return findChapterTarget(
      this.currentPlayerTile(),
      this.player.facing,
      act2Content.interactables,
      this.state.act2Phase
    );
  }

  private handleInteraction(
    target: ChapterInteractable | null
  ): void {
    if (target === null) {
      this.hud.showToast("这里没有当前要做的事");
      return;
    }
    if (target.optional) {
      this.dialogue.play(act2Dialogue(target.dialogueGroup));
      return;
    }
    if (
      target.id === "master" &&
      this.state.act2Phase === "QUESTION"
    ) {
      this.dialogue.play(act2Dialogue("question"), () => {
        this.choices.open(
          {
            eyebrow: "封坛之后",
            title: "你真正想问什么？",
            subtitle: "这个问题会留在曲印上。"
          },
          act2Content.dialogue.choices
        );
      });
      return;
    }

    const event = this.eventForTarget(target.id);
    this.dialogue.play(act2Dialogue(target.dialogueGroup), () => {
      if (event !== null) this.dispatch(event);
      if (target.id === "hongqu_sample") {
        this.hud.showToast("获得 · 红曲样品");
      } else if (target.id === "mix_station") {
        this.hud.showToast("霜降工序完成");
      } else if (target.id === "vat_station") {
        this.hud.showToast("立冬工序完成");
      } else if (target.id === "seal_station") {
        this.hud.showToast("冬至工序完成");
      }
    });
  }

  private eventForTarget(id: string): ChapterEvent | null {
    switch (id) {
      case "master":
        return { type: "ACT2_TALK_MASTER" };
      case "hongqu_tray":
        return { type: "ACT2_INSPECT_TRAY" };
      case "clay_jar":
        return { type: "ACT2_INSPECT_JAR" };
      case "hongqu_sample":
        return { type: "ACT2_TAKE_SAMPLE" };
      case "mix_station":
        return { type: "ACT2_COMPLETE_STEP", step: "mix" };
      case "vat_station":
        return { type: "ACT2_COMPLETE_STEP", step: "vat" };
      case "seal_station":
        return { type: "ACT2_COMPLETE_STEP", step: "seal" };
      default:
        return null;
    }
  }

  private dispatch(event: ChapterEvent): void {
    const next = reduceChapter(this.state, event);
    if (next === this.state) return;
    this.state = next;
    this.saveService.save(this.state);
    this.refreshAll();
  }

  private refreshAll(): void {
    const quest = act2Quest(act2QuestId(this.state.act2Phase));
    this.hud.update({
      actLabel: "ACT 02 / 冬酿",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.inventory.length,
      progress: this.brewingProgress()
    });
    this.refreshQuestMarker();
    this.refreshStationMarks();
  }

  private brewingProgress(): string {
    const progressByPhase: Record<string, string> = {
      ARRIVE: "冬酿 0/3",
      INSPECT_TRAY: "冬酿 0/3",
      INSPECT_JAR: "冬酿 0/3",
      TAKE_SAMPLE: "冬酿 0/3",
      MIX: "冬酿 0/3",
      VAT: "冬酿 1/3",
      SEAL: "冬酿 2/3",
      QUESTION: "冬酿 3/3",
      COMPLETE: "冬酿 3/3"
    };
    return progressByPhase[this.state.act2Phase] ?? "";
  }

  private createQuestMarker(): void {
    const arrow = this.add
      .text(0, 0, "▼", {
        fontFamily: '"Cascadia Mono", Consolas, monospace',
        fontSize: "18px",
        color: "#F4C45E",
        stroke: "#211A17",
        strokeThickness: 4
      })
      .setOrigin(0.5, 1);
    this.questMarker = this.add
      .container(0, 0, [arrow])
      .setDepth(9_500);
    this.tweens.add({
      targets: arrow,
      y: "-=5",
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private refreshQuestMarker(): void {
    const targetId = act2TargetId(this.state.act2Phase);
    const target = act2Content.interactables.find(
      (item) => item.id === targetId
    );
    if (target === undefined) {
      this.questMarker.setVisible(false);
      return;
    }
    const pixel = tileToPixelCenter(
      target.tile,
      act2Content.map.tileSize
    );
    this.questMarker
      .setPosition(pixel.x, pixel.y - 46)
      .setVisible(true);
  }

  private createStationMarks(): void {
    for (const id of STATION_IDS) {
      const target = act2Content.interactables.find(
        (item) => item.id === id
      );
      if (target === undefined) continue;
      const pixel = tileToPixelCenter(
        target.tile,
        act2Content.map.tileSize
      );
      const mark = this.add
        .rectangle(pixel.x, pixel.y - 28, 12, 5, 0x6e4932)
        .setStrokeStyle(1, 0x211a17)
        .setDepth(9_000);
      this.stationMarks.set(id, mark);
    }
  }

  private refreshStationMarks(): void {
    const currentIndex = PHASE_ORDER.indexOf(this.state.act2Phase);
    const completeAt: Record<(typeof STATION_IDS)[number], number> = {
      hongqu_tray: PHASE_ORDER.indexOf("INSPECT_JAR"),
      clay_jar: PHASE_ORDER.indexOf("TAKE_SAMPLE"),
      mix_station: PHASE_ORDER.indexOf("VAT"),
      vat_station: PHASE_ORDER.indexOf("SEAL"),
      seal_station: PHASE_ORDER.indexOf("QUESTION")
    };
    for (const id of STATION_IDS) {
      const done = currentIndex >= completeAt[id];
      this.stationMarks
        .get(id)
        ?.setFillStyle(done ? 0xa83b32 : 0x6e4932);
    }
  }

  private createForegroundOccluders(
    occluders: ChapterPixelOccluder[],
    width: number,
    height: number
  ): void {
    for (const occluder of occluders) {
      const mask = this.make.graphics({ x: 0, y: 0 });
      mask.fillStyle(0xffffff, 1);
      mask.fillRect(
        occluder.x,
        occluder.y,
        occluder.width,
        occluder.height
      );
      this.add
        .image(0, 0, "map-brewery-winter")
        .setOrigin(0)
        .setDisplaySize(width, height)
        .setDepth(occluder.depth)
        .setMask(mask.createGeometryMask());
    }
  }

  private trackPlayerTile(): void {
    const tile = this.currentPlayerTile();
    if (tile.x === this.lastTile.x && tile.y === this.lastTile.y) {
      return;
    }
    this.lastTile = tile;
    this.state = reduceChapter(this.state, {
      type: "SET_CHAPTER_PLAYER_TILE",
      tile
    });
    this.saveService.save(this.state);
  }

  private currentPlayerTile(): { x: number; y: number } {
    return {
      x: Math.floor(this.player.x / act2Content.map.tileSize),
      y: Math.floor(this.player.y / act2Content.map.tileSize)
    };
  }

  private actionJustDown(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.commandKeys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.alternate) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.confirm)
    );
  }
}
