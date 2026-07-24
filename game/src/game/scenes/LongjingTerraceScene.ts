import Phaser from "phaser";
import {
  LONGJING_MAPS,
  LONGJING_PICKING_LEAVES,
  longjingLines,
  longjingQuest,
  type LongjingPickingLeaf
} from "../../content/longjing/content";
import type { ChapterInteractable } from "../../content/chapter/types";
import {
  reduceLongjing,
  type LongjingEvent
} from "../domain/longjingReducer";
import type { LongjingSaveV1 } from "../domain/longjingState";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { Player, type MovementKeys } from "../entities/Player";
import { activeLongjingMarker } from "../render/LongjingScenePolicy";
import {
  createLeafMarker,
  renderLongjingWorld
} from "../render/LongjingWorldRenderer";
import { tileToPixelCenter } from "../render/ApartmentRenderer";
import { findChapterTarget } from "../systems/ChapterInteraction";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChapterChoicePanel } from "../ui/ChapterChoicePanel";
import { ChapterHud } from "../ui/ChapterHud";
import { DialogueBox } from "../ui/DialogueBox";
import { LongjingQuestMarker } from "../ui/LongjingQuestMarker";
import {
  configureLongjingInput,
  createLongjingActor,
  createLongjingPlayer,
  currentLongjingTile,
  installLongjingWorldPhysics,
  longjingActionJustDown,
  type LongjingCommandKeys
} from "./LongjingSceneSupport";

type LeafDecision = "pick" | "leave";

export class LongjingTerraceScene extends Phaser.Scene {
  private state!: LongjingSaveV1;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: LongjingCommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private choices!: ChapterChoicePanel<LeafDecision>;
  private marker!: LongjingQuestMarker;
  private currentLeaf: LongjingPickingLeaf | null = null;
  private readonly leafSprites: Phaser.GameObjects.Graphics[] = [];
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingTerrace");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null) {
      this.scene.start("ChapterComplete");
      return;
    }
    if (saved.currentAct !== "terrace") {
      this.scene.start(sceneForLongjingAct(saved.currentAct));
      return;
    }
    this.state = saved;
    publishActiveScene("LongjingTerrace");
    const map = LONGJING_MAPS.terrace;
    renderLongjingWorld(this, "terrace");
    this.createLeaves();
    this.player = createLongjingPlayer(
      this,
      map,
      this.state.playerTile,
      "actor-taipo-young"
    );
    this.lastTile = { ...this.state.playerTile };
    installLongjingWorldPhysics(this, this.player, map);
    createLongjingActor(
      this,
      map,
      map.npcSpawns.masterHe,
      "actor-afeng",
      "master_he",
      0xd6e1d5
    );
    createLongjingActor(
      this,
      map,
      map.npcSpawns.merchant,
      "actor-azhen",
      "tea_merchant",
      0xc4a883
    );

    const input = configureLongjingInput(this);
    this.movementKeys = input.movementKeys;
    this.commandKeys = input.commandKeys;
    this.hud = new ChapterHud(this);
    this.dialogue = new DialogueBox(this);
    this.choices = new ChapterChoicePanel<LeafDecision>(this);
    this.marker = new LongjingQuestMarker(this, map.tileSize);
    this.refreshAll();
    if (this.state.terracePhase === "ARRIVE") {
      this.dialogue.play(longjingLines("terraceOpening"));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(): void {
    if (!this.player) return;
    this.marker.setSuppressed(
      this.dialogue.isActive || this.choices.isOpen
    );
    if (this.handleDialogue()) return;
    if (this.handleChoice()) return;

    const moved = this.player.updateMovement(
      this.movementKeys,
      false
    );
    this.player.setDepth(Math.round(this.player.y));
    if (moved) this.trackTile();
    const target = this.currentTarget();
    this.hud.setPrompt(target?.prompt ?? null);
    if (longjingActionJustDown(this.commandKeys)) {
      this.interact(target);
    }
  }

  private createLeaves(): void {
    const map = LONGJING_MAPS.terrace;
    LONGJING_PICKING_LEAVES.forEach((leaf, index) => {
      const pixel = tileToPixelCenter(leaf.tile, map.tileSize);
      const sprite = createLeafMarker(
        this,
        pixel.x,
        pixel.y,
        leaf.kind,
        index === this.state.pickAttempts
      );
      sprite.setVisible(index >= this.state.pickAttempts);
      this.leafSprites.push(sprite);
    });
  }

  private handleDialogue(): boolean {
    if (!this.dialogue.isActive) return false;
    this.player.updateMovement(this.movementKeys, true);
    this.hud.setPrompt(null);
    if (longjingActionJustDown(this.commandKeys)) {
      this.dialogue.advance();
    }
    return true;
  }

  private handleChoice(): boolean {
    if (!this.choices.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.up)) {
      this.choices.move(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.down)) {
      this.choices.move(1);
    }
    if (!longjingActionJustDown(this.commandKeys)) return true;

    const decision = this.choices.confirm();
    const leaf = this.currentLeaf;
    if (decision === null || leaf === null) return true;
    this.choices.close();
    const correct =
      (leaf.kind === "tender" && decision === "pick") ||
      (leaf.kind !== "tender" && decision === "leave");
    this.dispatch({
      type: "TERRACE_JUDGE_LEAF",
      leaf: leaf.kind,
      decision
    });
    this.currentLeaf = null;
    this.dialogue.play(
      [
        {
          speakerId: "master_he",
          speakerName: "何师傅",
          text: `${correct ? "判断得好。" : "这次先记住。" }${leaf.feedback}`
        }
      ],
      () => {
        if (this.state.currentAct === "workshop") {
          const evaluation =
            this.state.pickCorrect >= 10
              ? "这篓叶子匀齐。你已经懂得先看叶，再动手了。"
              : "这篓叶子不够匀齐。进锅以后要看得更细，手不能只凭习惯。";
          this.dialogue.play([
            {
              speakerId: "master_he",
              speakerName: "何师傅",
              text: evaluation
            },
            ...longjingLines("terraceEnd")
          ], () => {
            this.cameras.main.fadeOut(420, 23, 21, 22);
            this.time.delayedCall(440, () => {
              this.scene.start("LongjingWorkshop");
            });
          });
        }
      }
    );
    return true;
  }

  private currentTarget(): ChapterInteractable | null {
    const map = LONGJING_MAPS.terrace;
    const items: ChapterInteractable[] =
      this.state.terracePhase === "ARRIVE"
        ? [
            {
              id: "master_he",
              tile: map.npcSpawns.masterHe,
              range: 1,
              prompt: "E · 听何师傅说明采摘要求",
              dialogueGroup: "terraceStart",
              enabledPhases: ["ARRIVE"]
            }
          ]
        : this.state.terracePhase === "PICKING"
          ? [
              {
                id:
                  LONGJING_PICKING_LEAVES[this.state.pickAttempts]?.id ??
                  "",
                tile:
                  LONGJING_PICKING_LEAVES[this.state.pickAttempts]?.tile ??
                  { x: -10, y: -10 },
                range: 1,
                prompt: "E · 观察这片芽叶",
                dialogueGroup: "leaf",
                enabledPhases: ["PICKING"]
              }
            ]
          : [];
    return findChapterTarget(
      currentLongjingTile(this.player, map.tileSize),
      this.player.facing,
      items,
      this.state.terracePhase
    );
  }

  private interact(target: ChapterInteractable | null): void {
    if (target === null) {
      this.hud.showToast("沿着石径寻找箭头标记的芽叶");
      return;
    }
    if (target.id === "master_he") {
      this.dialogue.play(longjingLines("terraceStart"), () => {
        this.dispatch({ type: "TERRACE_START_PICKING" });
      });
      return;
    }
    const leaf = LONGJING_PICKING_LEAVES[this.state.pickAttempts];
    if (leaf === undefined || target.id !== leaf.id) return;
    this.currentLeaf = leaf;
    this.choices.open(
      {
        eyebrow: `芽叶判断 ${this.state.pickAttempts + 1}/12`,
        title: leaf.label,
        subtitle: "这次只判断它是否适合今天这一锅。"
      },
      [
        {
          value: "pick",
          label: "轻轻采下",
          feedback: leaf.feedback
        },
        {
          value: "leave",
          label: "留在枝头",
          feedback: leaf.feedback
        }
      ]
    );
  }

  private dispatch(event: LongjingEvent): void {
    const next = reduceLongjing(this.state, event);
    if (next === this.state) return;
    this.state = next;
    this.saveService.save(this.state);
    this.refreshAll();
  }

  private refreshAll(): void {
    const quest = longjingQuest("terrace", this.state.terracePhase);
    this.hud.update({
      actLabel: "CHAPTER 02 / ACT 02 · 清明之前",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.relics.length,
      progress: `判断 ${this.state.pickAttempts}/12`
    });
    this.leafSprites.forEach((leaf, index) => {
      leaf.setVisible(index >= this.state.pickAttempts);
    });
    this.marker.update(activeLongjingMarker(this.state));
  }

  private trackTile(): void {
    const tile = currentLongjingTile(
      this.player,
      LONGJING_MAPS.terrace.tileSize
    );
    if (tile.x === this.lastTile.x && tile.y === this.lastTile.y) return;
    this.lastTile = tile;
    this.dispatch({ type: "SET_LONGJING_PLAYER_TILE", tile });
  }
}
