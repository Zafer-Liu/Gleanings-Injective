import Phaser from "phaser";
import {
  act4Content,
  act4Dialogue
} from "../../content/act4/content";
import { act1Content } from "../../content/act1/content";
import {
  generateCultureLabel,
  type CultureLabel
} from "../domain/cultureLabel";
import {
  reduceChapter,
  type ChapterEvent
} from "../domain/chapterReducer";
import type {
  Act4Explanation,
  ChapterOneSaveV2
} from "../domain/chapterState";
import { Player, type MovementKeys } from "../entities/Player";
import {
  buildApartmentGeometry,
  tileToPixelCenter
} from "../render/ApartmentRenderer";
import { findChapterTarget } from "../systems/ChapterInteraction";
import { ChapterSaveService } from "../systems/ChapterSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChapterChoicePanel } from "../ui/ChapterChoicePanel";
import { ChapterHud } from "../ui/ChapterHud";
import { CultureLabelPanel } from "../ui/CultureLabelPanel";
import { JourneyRecordPanel } from "../ui/JourneyRecordPanel";
import { DialogueBox } from "../ui/DialogueBox";
import { RelicPanel } from "../ui/RelicPanel";

type CommandKeys = {
  interact: Phaser.Input.Keyboard.Key;
  alternate: Phaser.Input.Keyboard.Key;
  confirm: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
};

const MIA_TILE = { x: 20, y: 12 };

const ACT4_QUEST = {
  ARRIVE: {
    title: "告诉米娅你看见了什么",
    hint: "米娅就在客厅右侧"
  },
  EXPLANATION: {
    title: "选择如何介绍福建老酒",
    hint: "没有唯一正确的说法"
  },
  LABEL: {
    title: "把四次选择排成酒签",
    hint: "酒签由本地模板生成"
  },
  REVIEW: {
    title: "确认双语文化酒签",
    hint: "创意表达可重试一次"
  },
  RECORD: {
    title: "收好这张文化酒签",
    hint: "确认后继续故事"
  },
  COMPLETE: {
    title: "一坛回声",
    hint: "故事已经结束，酒的故事还没有"
  }
} as const;

export class ActFourScene extends Phaser.Scene {
  private state!: ChapterOneSaveV2;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: CommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private choices!: ChapterChoicePanel<Act4Explanation>;
  private labelPanel!: CultureLabelPanel;
  private journeyRecord!: JourneyRecordPanel;
  private relic!: RelicPanel;
  private questMarker!: Phaser.GameObjects.Container;
  private currentLabel?: CultureLabel;
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("ActFour");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null || saved.currentAct !== 4) {
      this.scene.start("ActThree");
      return;
    }
    this.state = saved;
    publishActiveScene("ActFour");
    const geometry = buildApartmentGeometry(
      act1Content.map,
      act1Content.interactables
    );
    this.physics.world.setBounds(0, 0, geometry.width, geometry.height);
    this.add
      .image(0, 0, "map-apartment")
      .setOrigin(0)
      .setDisplaySize(geometry.width, geometry.height)
      .setDepth(0);

    const jar = tileToPixelCenter(
      { x: 26, y: 8 },
      act1Content.map.tileSize
    );
    this.add
      .image(jar.x, jar.y + 18, "obj-jar-open")
      .setOrigin(0.5, 1)
      .setDepth(jar.y);

    const mia = tileToPixelCenter(
      MIA_TILE,
      act1Content.map.tileSize
    );
    this.add
      .sprite(mia.x, mia.y, "actor-mia", 4)
      .setOrigin(0.5, 0.78)
      .setDepth(mia.y);

    const spawn = tileToPixelCenter(
      this.state.playerTile,
      act1Content.map.tileSize
    );
    this.player = new Player(this, spawn.x, spawn.y, "actor-yi");
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
      17 * act1Content.map.tileSize
    );
    this.cameras.main
      .startFollow(this.player, true, 1, 1)
      .setDeadzone(96, 64);
    this.cameras.main.roundPixels = true;

    this.hud = new ChapterHud(this);
    this.dialogue = new DialogueBox(this);
    this.choices = new ChapterChoicePanel<Act4Explanation>(this);
    this.labelPanel = new CultureLabelPanel(this);
    this.journeyRecord = new JourneyRecordPanel(this);
    this.relic = new RelicPanel(this);
    this.createQuestMarker();
    this.refreshAll();

    if (this.state.act4Phase === "ARRIVE") {
      this.dialogue.play(act4Dialogue("opening"));
    } else {
      this.resumeOverlay();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(): void {
    if (!this.player) return;
    if (this.handleDialogueInput()) return;
    if (this.handleChoiceInput()) return;
    if (this.handleLabelInput()) return;
    if (this.handleJourneyRecordInput()) return;
    if (this.handleRelicInput()) return;

    const moved = this.player.updateMovement(
      this.movementKeys,
      false
    );
    this.player.setDepth(Math.round(this.player.y));
    if (moved) this.trackPlayerTile();
    const target = this.currentMiaTarget();
    this.hud.setPrompt(
      target === null ? null : "E / 空格 · 与米娅交谈"
    );
    if (this.actionJustDown() && target !== null) {
      this.beginMiaConversation();
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

  private beginMiaConversation(): void {
    this.dialogue.play(act4Dialogue("miaBridge"), () => {
      this.dispatch({ type: "ACT4_TALK_MIA" });
      this.openExplanationChoices();
    });
  }

  private openExplanationChoices(): void {
    this.choices.open(
      {
        eyebrow: "说给远方的人听",
        title: "你会怎样介绍这坛酒？",
        subtitle: "选择表达角度，不改变文化事实。"
      },
      act4Content.dialogue.choices
    );
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
      type: "ACT4_CHOOSE_EXPLANATION",
      choice
    });
    this.dialogue.play(
      [
        {
          speakerId: "yi",
          speakerName: "林怡",
          text: selected.feedback
        }
      ],
      () => {
        this.dispatch({ type: "ACT4_GENERATE_LABEL" });
        this.currentLabel = generateCultureLabel(this.state);
        this.labelPanel.open(
          this.currentLabel,
          !this.state.labelRetryUsed
        );
      }
    );
    return true;
  }

  private handleLabelInput(): boolean {
    if (!this.labelPanel.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.up)) {
      this.labelPanel.move(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.down)) {
      this.labelPanel.move(1);
    }
    if (!this.actionJustDown()) return true;

    if (this.labelPanel.selectedAction() === "retry") {
      this.dispatch({ type: "ACT4_RETRY_LABEL" });
      this.currentLabel = generateCultureLabel(this.state);
      this.labelPanel.open(this.currentLabel, false);
      return true;
    }

    this.dispatch({ type: "ACT4_ACCEPT_LABEL" });
    this.labelPanel.close();
    const label =
      this.currentLabel ?? generateCultureLabel(this.state);
    this.dialogue.play(act4Dialogue("mintIntro"), () => {
      this.journeyRecord.show(label);
    });
    return true;
  }

  private handleJourneyRecordInput(): boolean {
    if (!this.journeyRecord.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (this.actionJustDown()) {
      this.dispatch({ type: "ACT4_SAVE_LABEL" });
      this.journeyRecord.close();
      this.relic.show({
        eyebrow: "章节徽章",
        name: "一坛回声",
        rarity: "章节完成",
        description:
          "酒签没有替故事盖棺定论。它只是把四次选择和三代人的回声留在了一起。",
        texture: "item-dongniang-relic"
      });
    }
    return true;
  }

  private handleRelicInput(): boolean {
    if (!this.relic.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (this.actionJustDown()) {
      this.relic.close();
      this.scene.start("HuangjiuFilm");
    }
    return true;
  }

  private resumeOverlay(): void {
    this.time.delayedCall(0, () => {
      if (this.state.act4Phase === "EXPLANATION") {
        this.openExplanationChoices();
      } else if (
        this.state.act4Phase === "LABEL" ||
        this.state.act4Phase === "REVIEW"
      ) {
        if (this.state.act4Phase === "LABEL") {
          this.dispatch({ type: "ACT4_GENERATE_LABEL" });
        }
        this.currentLabel = generateCultureLabel(this.state);
        this.labelPanel.open(
          this.currentLabel,
          !this.state.labelRetryUsed
        );
      } else if (this.state.act4Phase === "RECORD") {
        const label = generateCultureLabel(this.state);
        this.currentLabel = label;
        this.journeyRecord.show(label);
      }
    });
  }

  private currentMiaTarget(): { id: string } | null {
    if (this.state.act4Phase !== "ARRIVE") return null;
    return findChapterTarget(
      this.currentPlayerTile(),
      this.player.facing,
      [
        {
          id: "mia",
          tile: MIA_TILE,
          range: 1,
          prompt: "与米娅交谈",
          dialogueGroup: "miaBridge",
          enabledPhases: ["ARRIVE"]
        }
      ],
      this.state.act4Phase
    );
  }

  private dispatch(event: ChapterEvent): void {
    const next = reduceChapter(this.state, event);
    if (next === this.state) return;
    this.state = next;
    this.saveService.save(this.state);
    this.refreshAll();
  }

  private refreshAll(): void {
    const quest = ACT4_QUEST[this.state.act4Phase];
    this.hud.update({
      actLabel: "ACT 04 / 归",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.inventory.length,
      progress: "四次选择已回收"
    });
    this.refreshQuestMarker();
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
    if (this.state.act4Phase !== "ARRIVE") {
      this.questMarker.setVisible(false);
      return;
    }
    const pixel = tileToPixelCenter(
      MIA_TILE,
      act1Content.map.tileSize
    );
    this.questMarker
      .setPosition(pixel.x, pixel.y - 52)
      .setVisible(true);
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
      x: Math.floor(this.player.x / act1Content.map.tileSize),
      y: Math.floor(this.player.y / act1Content.map.tileSize)
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
