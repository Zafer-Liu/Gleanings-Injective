import Phaser from "phaser";
import {
  act1Content,
  dialogueGroup,
  type DialogueLine,
  type InteractableContent
} from "../../content/act1/content";
import {
  reduceAct1,
  type Act1Event
} from "../domain/act1Reducer";
import type { Act1State, TilePosition } from "../domain/act1State";
import { Player, type MovementKeys } from "../entities/Player";
import {
  buildApartmentGeometry,
  tileToPixelCenter,
  type PixelOccluder
} from "../render/ApartmentRenderer";
import {
  apartmentBackgroundPolicy,
  questMarkerTargetForPhase,
  shouldRenderInteractableOverlay
} from "../render/SceneVisualPolicy";
import {
  canBeginJarOpening,
  findInteractionTarget,
  resolveInteraction,
  shouldShowContextHint
} from "../systems/InteractionSystem";
import { SaveService } from "../systems/SaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChoicePanel } from "../ui/ChoicePanel";
import { DialogueBox } from "../ui/DialogueBox";
import { InventoryPanel } from "../ui/InventoryPanel";
import { PixelHud } from "../ui/PixelHud";

type CommandKeys = {
  interact: Phaser.Input.Keyboard.Key;
  alternate: Phaser.Input.Keyboard.Key;
  confirm: Phaser.Input.Keyboard.Key;
  inventory: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
};

const JAR_HOLD_MS = 650;

function sameTile(a: TilePosition, b: TilePosition): boolean {
  return a.x === b.x && a.y === b.y;
}

function phaseAtLeastMia(phase: Act1State["phase"]): boolean {
  return [
    "MIA_ENTERED",
    "JAR_INSPECTED",
    "SENSE_CHOSEN",
    "JAR_OPENING",
    "COMPLETE"
  ].includes(phase);
}

export class ApartmentScene extends Phaser.Scene {
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: CommandKeys;
  private state!: Act1State;
  private lastTile!: TilePosition;
  private hud!: PixelHud;
  private dialogue!: DialogueBox;
  private inventoryPanel!: InventoryPanel;
  private choicePanel!: ChoicePanel;
  private questMarker!: Phaser.GameObjects.Container;
  private jarSprite?: Phaser.GameObjects.Image;
  private holdElapsed = 0;
  private lastProgressAt = 0;
  private invalidInteractions = 0;
  private readonly saveService = new SaveService(window.localStorage);

  constructor() {
    super("Apartment");
  }

  create(): void {
    publishActiveScene("Apartment");
    const geometry = buildApartmentGeometry(
      act1Content.map,
      act1Content.interactables
    );
    this.state = this.saveService.load();
    this.physics.world.setBounds(0, 0, geometry.width, geometry.height);

    const background = apartmentBackgroundPolicy();
    this.add
      .image(0, 0, "map-apartment")
      .setOrigin(0)
      .setDisplaySize(
        background.worldSize.width,
        background.worldSize.height
      )
      .setDepth(0);
    this.createForegroundOccluders(
      geometry.occluders,
      background.worldSize
    );
    this.createInteractionObjects();

    const spawn = tileToPixelCenter(
      this.state.playerTile,
      act1Content.map.tileSize
    );
    this.player = new Player(this, spawn.x, spawn.y);
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

    this.createMiaIfNeeded();
    this.createQuestMarker();
    this.configureInput();
    this.cameras.main
      .setBounds(0, 0, geometry.width, 17 * act1Content.map.tileSize)
      .startFollow(this.player, true, 1, 1);
    this.cameras.main.roundPixels = true;
    this.cameras.main.setDeadzone(96, 64);

    this.hud = new PixelHud(this);
    this.dialogue = new DialogueBox(this);
    this.inventoryPanel = new InventoryPanel(this);
    this.choicePanel = new ChoicePanel(this);
    this.lastProgressAt = this.time.now;
    this.refreshHud();

    if (this.state.phase === "ARRIVE") {
      this.dialogue.play(dialogueGroup("opening"));
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(_time: number, delta: number): void {
    if (this.handleDialogueInput()) return;
    if (this.handleInventoryInput()) return;
    if (this.handleChoiceInput()) return;

    const moved = this.player.updateMovement(
      this.movementKeys,
      this.state.movementLocked
    );
    if (moved) {
      this.trackPlayerTile();
    }

    const target = this.currentTarget();
    this.refreshPrompt(target);
    if (this.handleJarHold(target, delta)) return;

    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.inventory)) {
      this.inventoryPanel.open(this.state);
      this.hud.setPrompt(null);
      return;
    }

    if (this.actionJustDown()) {
      this.handleInteraction(target);
    }
  }

  private createInteractionObjects(): void {
    const boxPixel = tileToPixelCenter(
      { x: 6, y: 12 },
      act1Content.map.tileSize
    );
    if (shouldRenderInteractableOverlay("obj_cardboard_box")) {
      this.add
        .image(boxPixel.x, boxPixel.y, "obj-box")
        .setName("obj_cardboard_box")
        .setDepth(boxPixel.y);
    }

    const jarPixel = tileToPixelCenter(
      { x: 25, y: 8 },
      act1Content.map.tileSize
    );
    const texture =
      this.state.phase === "COMPLETE" ? "obj-jar-open" : "obj-jar-sealed";
    if (shouldRenderInteractableOverlay("obj_laojiu_jar")) {
      this.jarSprite = this.add
        .image(jarPixel.x, jarPixel.y + 16, texture)
        .setOrigin(0.5, 1)
        .setName("obj_laojiu_jar")
        .setDepth(jarPixel.y);
    }
  }

  private createForegroundOccluders(
    occluders: PixelOccluder[],
    worldSize: { width: number; height: number }
  ): void {
    const rectanglesByDepth = new Map<number, PixelOccluder[]>();
    for (const occluder of occluders) {
      const group = rectanglesByDepth.get(occluder.depth) ?? [];
      group.push(occluder);
      rectanglesByDepth.set(occluder.depth, group);
    }

    for (const [depth, rectangles] of rectanglesByDepth) {
      const maskSource = this.make.graphics({ x: 0, y: 0 });
      maskSource.fillStyle(0xffffff, 1);
      for (const rectangle of rectangles) {
        maskSource.fillRect(
          rectangle.x,
          rectangle.y,
          rectangle.width,
          rectangle.height
        );
      }

      this.add
        .image(0, 0, "map-apartment")
        .setOrigin(0)
        .setDisplaySize(worldSize.width, worldSize.height)
        .setDepth(depth)
        .setMask(maskSource.createGeometryMask());
    }
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
    this.refreshQuestMarker();
  }

  private refreshQuestMarker(): void {
    const target = questMarkerTargetForPhase(this.state.phase);
    if (target === null) {
      this.questMarker.setVisible(false);
      return;
    }

    const position = tileToPixelCenter(
      target.tile,
      act1Content.map.tileSize
    );
    this.questMarker
      .setPosition(position.x, position.y + target.offsetY)
      .setVisible(true);
  }

  private createMiaIfNeeded(): void {
    if (
      !phaseAtLeastMia(this.state.phase) ||
      this.children.getByName("actor_mia") !== null
    ) {
      return;
    }
    const spawn = tileToPixelCenter(
      act1Content.map.miaSpawn,
      act1Content.map.tileSize
    );
    this.add
      .sprite(spawn.x, spawn.y, "actor-mia", 4)
      .setOrigin(0.5, 0.78)
      .setName("actor_mia")
      .setDepth(spawn.y);
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
      inventory: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      up: cursors.up,
      down: cursors.down
    };
  }

  private handleDialogueInput(): boolean {
    if (!this.dialogue.isActive) return false;
    this.player.updateMovement(this.movementKeys, true);
    this.hud.setPrompt(null);
    if (this.actionJustDown()) {
      this.dialogue.advance();
    }
    return true;
  }

  private handleInventoryInput(): boolean {
    if (!this.inventoryPanel.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.inventory)) {
      this.inventoryPanel.close();
      return true;
    }
    if (this.actionJustDown()) {
      const action = this.inventoryPanel.activate();
      if (action === "read-note") {
        this.beginReadNote();
      } else {
        this.hud.showToast("背包还是空的");
      }
    }
    return true;
  }

  private handleChoiceInput(): boolean {
    if (!this.choicePanel.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.up)) {
      this.choicePanel.move(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.down)) {
      this.choicePanel.move(1);
    }
    if (this.actionJustDown()) {
      const selected = this.choicePanel.selectedChoice();
      const choice = this.choicePanel.confirm();
      if (choice === null || selected === null) return true;
      this.choicePanel.close();
      this.dispatch({ type: "CHOOSE_SENSE", choice });
      const feedback: DialogueLine = {
        speakerId: "narrator",
        speakerName: `感知 · ${selected.motif}`,
        text: selected.feedback
      };
      this.dialogue.play([feedback]);
    }
    return true;
  }

  private beginReadNote(): void {
    this.inventoryPanel.close();
    const shouldAdvance = this.state.phase === "NOTE_ACQUIRED";
    this.dialogue.play(dialogueGroup("note"), () => {
      if (!shouldAdvance) return;
      this.dispatch({ type: "READ_NOTE" });
      this.dispatch({ type: "MIA_ENTERED" });
      this.createMiaIfNeeded();
      this.dialogue.play(dialogueGroup("mia"));
    });
  }

  private handleInteraction(target: InteractableContent | null): void {
    if (target === null) {
      this.invalidInteractions += 1;
      this.refreshHud();
      if (this.invalidInteractions >= 2) {
        this.hud.showToast("这里没有可调查的东西");
      }
      return;
    }

    const resolution = resolveInteraction(this.state, target);
    this.dialogue.play(
      dialogueGroup(resolution.dialogueGroup),
      () => {
        resolution.completionEvents.forEach((event) =>
          this.dispatch(event)
        );
        if (
          resolution.kind === "box" &&
          resolution.completionEvents.length > 0
        ) {
          this.hud.showToast("获得 · 太婆的字条");
        }
        if (resolution.openChoice) {
          this.choicePanel.open(act1Content.dialogue.choices);
        }
      }
    );
  }

  private handleJarHold(
    target: InteractableContent | null,
    delta: number
  ): boolean {
    if (!canBeginJarOpening(this.state, target)) {
      this.holdElapsed = 0;
      this.hud.setHoldProgress(0);
      return false;
    }

    if (!this.commandKeys.interact.isDown) {
      this.holdElapsed = 0;
      this.hud.setHoldProgress(0);
      return true;
    }

    this.player.updateMovement(this.movementKeys, true);
    this.holdElapsed += delta;
    const progress = this.holdElapsed / JAR_HOLD_MS;
    this.hud.setHoldProgress(progress);
    if (progress >= 1) {
      this.beginJarOpening();
    }
    return true;
  }

  private beginJarOpening(): void {
    if (this.state.phase !== "SENSE_CHOSEN") return;
    this.dispatch({ type: "START_OPEN_JAR" });
    this.hud.setPrompt(null);
    this.hud.setHoldProgress(0);
    this.jarSprite?.setTexture("obj-jar-open");
    this.cameras.main.stopFollow();
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: Math.min(
        this.cameras.main.scrollX + act1Content.map.tileSize,
        act1Content.map.size.width * act1Content.map.tileSize - 640
      ),
      duration: 420,
      ease: "Cubic.easeOut"
    });
    this.dialogue.play(dialogueGroup("transition"), () => {
      this.dispatch({ type: "COMPLETE" });
      this.hud.setVisible(false);
      this.scene.launch("MemoryTransition", {
        choice: this.state.senseChoice
      });
      this.scene.pause();
    });
  }

  private currentTarget(): InteractableContent | null {
    return findInteractionTarget(
      this.currentPlayerTile(),
      this.player.facing,
      act1Content.interactables,
      this.state.phase
    );
  }

  private currentPlayerTile(): TilePosition {
    return {
      x: Math.floor(this.player.x / act1Content.map.tileSize),
      y: Math.floor(this.player.y / act1Content.map.tileSize)
    };
  }

  private refreshPrompt(target: InteractableContent | null): void {
    if (target === null) {
      this.hud.setPrompt(null);
      this.refreshHud();
      return;
    }
    if (canBeginJarOpening(this.state, target)) {
      this.hud.setPrompt("长按 E · 揭开红布");
      return;
    }
    const message =
      target.id === "obj_cardboard_box"
        ? "E / 空格 · 调查纸箱"
        : target.id === "obj_laojiu_jar"
          ? "E / 空格 · 查看酒坛"
          : "E / 空格 · 查看";
    this.hud.setPrompt(message);
  }

  private refreshHud(): void {
    this.hud.updateState(
      this.state,
      shouldShowContextHint({
        now: this.time.now,
        lastProgressAt: this.lastProgressAt,
        invalidInteractions: this.invalidInteractions
      })
    );
  }

  private dispatch(event: Act1Event): void {
    const before = this.state;
    this.state = reduceAct1(this.state, event);
    if (this.state === before) return;
    this.lastProgressAt = this.time.now;
    this.invalidInteractions = 0;
    this.refreshHud();
    this.refreshQuestMarker();
    this.saveService.save(this.state);
  }

  private actionJustDown(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.commandKeys.interact) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.alternate) ||
      Phaser.Input.Keyboard.JustDown(this.commandKeys.confirm)
    );
  }

  private trackPlayerTile(): void {
    const tile = this.currentPlayerTile();
    if (sameTile(tile, this.lastTile)) return;

    const distance =
      Math.abs(tile.x - this.lastTile.x) +
      Math.abs(tile.y - this.lastTile.y);
    const priorPhase = this.state.phase;
    this.state = reduceAct1(this.state, {
      type: "MOVED",
      distanceTiles: distance
    });
    this.state = reduceAct1(this.state, {
      type: "SET_PLAYER_TILE",
      tile
    });
    this.lastTile = tile;

    if (this.state.phase !== priorPhase) {
      this.lastProgressAt = this.time.now;
      this.invalidInteractions = 0;
      this.saveService.save(this.state);
    }
    this.refreshHud();
    this.refreshQuestMarker();
  }
}
