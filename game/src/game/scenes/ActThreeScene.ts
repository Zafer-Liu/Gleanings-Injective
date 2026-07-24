import Phaser from "phaser";
import {
  act3Content,
  act3Dialogue,
  act3Quest,
  type Act3Interactable
} from "../../content/act3/content";
import {
  act3Progress,
  act3QuestId,
  act3RelicView,
  act3TargetId
} from "../domain/act3Flow";
import {
  reduceChapter,
  type ChapterEvent
} from "../domain/chapterReducer";
import type {
  Act3Inscription,
  Act3Material,
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

const MATERIAL_TEXTURE: Record<Act3Material, string> = {
  bowl: "obj-bowl",
  noodles: "obj-noodles",
  laojiu: "obj-laojiu-scoop"
};

export class ActThreeScene extends Phaser.Scene {
  private state!: ChapterOneSaveV2;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: CommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private choices!: ChapterChoicePanel<Act3Inscription>;
  private relic!: RelicPanel;
  private questMarker!: Phaser.GameObjects.Container;
  private cookedBowl!: Phaser.GameObjects.Image;
  private readonly materialSprites = new Map<
    Act3Material,
    Phaser.GameObjects.Image
  >();
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new ChapterSaveService(
    window.localStorage
  );

  constructor() {
    super("ActThree");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null || saved.currentAct !== 3) {
      this.scene.start("ActTwo");
      return;
    }
    this.state = saved;
    publishActiveScene("ActThree");

    const geometry = buildChapterGeometry(act3Content.map);
    this.physics.world.setBounds(
      0,
      0,
      geometry.width,
      geometry.height
    );
    this.add
      .image(0, 0, "map-postpartum-kitchen")
      .setOrigin(0)
      .setDisplaySize(geometry.width, geometry.height)
      .setDepth(0);
    this.createForegroundOccluders(
      geometry.occluders,
      geometry.width,
      geometry.height
    );
    this.createActors();
    this.createMaterialSprites();

    const spawn = tileToPixelCenter(
      this.state.playerTile,
      act3Content.map.tileSize
    );
    this.player = new Player(
      this,
      spawn.x,
      spawn.y,
      "actor-taipo-middle"
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
    this.choices = new ChapterChoicePanel<Act3Inscription>(this);
    this.relic = new RelicPanel(this);
    this.createQuestMarker();
    this.refreshAll();

    if (this.state.act3Phase === "ARRIVE") {
      this.dialogue.play(act3Dialogue("opening"));
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

  private createActors(): void {
    const family = tileToPixelCenter(
      act3Content.map.npcSpawns.family,
      act3Content.map.tileSize
    );
    this.add
      .sprite(family.x, family.y, "actor-family", 1)
      .setOrigin(0.5, 0.78)
      .setTint(0xd4b46a)
      .setDepth(family.y);

    const azhen = tileToPixelCenter(
      act3Content.map.npcSpawns.azhen,
      act3Content.map.tileSize
    );
    this.add
      .sprite(azhen.x, azhen.y, "actor-azhen", 1)
      .setOrigin(0.5, 0.78)
      .setDepth(azhen.y);
  }

  private createMaterialSprites(): void {
    for (const material of [
      "bowl",
      "noodles",
      "laojiu"
    ] as const) {
      const target = act3Content.interactables.find(
        (item) => item.material === material
      );
      if (target === undefined) continue;
      const pixel = tileToPixelCenter(
        target.tile,
        act3Content.map.tileSize
      );
      const sprite = this.add
        .image(pixel.x, pixel.y - 14, MATERIAL_TEXTURE[material])
        .setDisplaySize(28, 28)
        .setDepth(pixel.y - 12)
        .setVisible(!this.state.act3Materials.includes(material));
      this.materialSprites.set(material, sprite);
    }

    const stove = act3Content.interactables.find(
      (item) => item.id === "stove"
    );
    const pixel = tileToPixelCenter(
      stove?.tile ?? { x: 10, y: 16 },
      act3Content.map.tileSize
    );
    this.cookedBowl = this.add
      .image(pixel.x + 12, pixel.y - 20, "obj-cooked-noodles")
      .setDisplaySize(30, 30)
      .setDepth(pixel.y)
      .setVisible(
        this.state.act3Phase === "COOKED" ||
          this.state.act3Phase === "INSCRIPTION" ||
          this.state.act3Phase === "COMPLETE"
      );
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
      type: "ACT3_CHOOSE_INSCRIPTION",
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
      () => this.relic.show(act3RelicView(choice))
    );
    return true;
  }

  private handleRelicInput(): boolean {
    if (!this.relic.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (this.actionJustDown()) {
      this.relic.close();
      this.scene.start("ActFour");
    }
    return true;
  }

  private currentTarget(): Act3Interactable | null {
    const available = act3Content.interactables.filter(
      (item) =>
        item.material === undefined ||
        !this.state.act3Materials.includes(item.material)
    );
    return findChapterTarget(
      this.currentPlayerTile(),
      this.player.facing,
      available,
      this.state.act3Phase
    ) as Act3Interactable | null;
  }

  private handleInteraction(target: Act3Interactable | null): void {
    if (target === null) {
      this.hud.showToast("这里暂时没有要拿的东西");
      return;
    }
    if (target.optional) {
      this.dialogue.play(act3Dialogue(target.dialogueGroup));
      return;
    }

    this.dialogue.play(act3Dialogue(target.dialogueGroup), () => {
      if (target.material !== undefined) {
        this.dispatch({
          type: "ACT3_COLLECT_MATERIAL",
          material: target.material
        });
        this.materialSprites.get(target.material)?.setVisible(false);
        this.hud.showToast(`备料完成 · ${this.materialName(target.material)}`);
        return;
      }
      const event = this.eventForTarget(target.id);
      if (event !== null) this.dispatch(event);
      if (target.id === "stove") {
        this.cookedBowl.setVisible(true);
        this.hud.showToast("老酒面线煮好了");
      }
      if (target.id === "azhen") {
        this.cookedBowl.setVisible(false);
        this.choices.open(
          {
            eyebrow: "递碗之间",
            title: "你从这双手里看见什么？",
            subtitle: "这个字会留在青花酒盏上。"
          },
          act3Content.dialogue.choices
        );
      }
    });
  }

  private eventForTarget(id: string): ChapterEvent | null {
    switch (id) {
      case "family":
        return { type: "ACT3_TALK_FAMILY" };
      case "stove":
        return { type: "ACT3_COOK" };
      case "azhen":
        return { type: "ACT3_SERVE" };
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
    const quest = act3Quest(act3QuestId(this.state.act3Phase));
    this.hud.update({
      actLabel: "ACT 03 / 月子酒",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.inventory.length,
      progress: act3Progress(this.state.act3Materials)
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
    const targetId = act3TargetId(
      this.state.act3Phase,
      this.state.act3Materials
    );
    const target = act3Content.interactables.find(
      (item) => item.id === targetId
    );
    if (target === undefined) {
      this.questMarker.setVisible(false);
      return;
    }
    const pixel = tileToPixelCenter(
      target.tile,
      act3Content.map.tileSize
    );
    this.questMarker
      .setPosition(pixel.x, pixel.y - 46)
      .setVisible(true);
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
        .image(0, 0, "map-postpartum-kitchen")
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
      x: Math.floor(this.player.x / act3Content.map.tileSize),
      y: Math.floor(this.player.y / act3Content.map.tileSize)
    };
  }

  private materialName(material: Act3Material): string {
    return {
      bowl: "瓷碗",
      noodles: "面线",
      laojiu: "福建老酒"
    }[material];
  }

  private actionJustDown(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.commandKeys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.alternate) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.confirm)
    );
  }
}
