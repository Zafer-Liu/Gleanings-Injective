import Phaser from "phaser";
import {
  LONGJING_MAPS,
  LONGJING_MARKET_INTERACTABLES,
  longjingLines,
  longjingQuest
} from "../../content/longjing/content";
import type { ChapterInteractable } from "../../content/chapter/types";
import { cardsForEvidence } from "../domain/provenanceBoard";
import {
  reduceLongjing,
  type LongjingEvent
} from "../domain/longjingReducer";
import type { LongjingSaveV1 } from "../domain/longjingState";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { Player, type MovementKeys } from "../entities/Player";
import { activeLongjingMarker } from "../render/LongjingScenePolicy";
import { longjingActorTexture } from "../render/LongjingActorPolicy";
import { LongjingObjectLayer } from "../render/LongjingObjectLayer";
import { renderLongjingWorld } from "../render/LongjingWorldRenderer";
import { findChapterTarget } from "../systems/ChapterInteraction";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChapterHud } from "../ui/ChapterHud";
import { DialogueBox } from "../ui/DialogueBox";
import { LongjingQuestMarker } from "../ui/LongjingQuestMarker";
import { ProvenanceBoard } from "../ui/ProvenanceBoard";
import {
  configureLongjingInput,
  createLongjingActor,
  createLongjingPlayer,
  currentLongjingTile,
  installLongjingWorldPhysics,
  longjingActionJustDown,
  type LongjingCommandKeys
} from "./LongjingSceneSupport";

export class LongjingMarketScene extends Phaser.Scene {
  private state!: LongjingSaveV1;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: LongjingCommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private board!: ProvenanceBoard;
  private marker!: LongjingQuestMarker;
  private objectLayer!: LongjingObjectLayer;
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingMarket");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null) {
      this.scene.start("ChapterComplete");
      return;
    }
    if (saved.currentAct !== "market") {
      this.scene.start(sceneForLongjingAct(saved.currentAct));
      return;
    }
    this.state = saved;
    publishActiveScene("LongjingMarket");
    const map = LONGJING_MAPS.market;
    renderLongjingWorld(this, "market");
    this.objectLayer = new LongjingObjectLayer(
      this,
      map.tileSize,
      "market"
    );
    this.objectLayer.sync(this.state);
    this.player = createLongjingPlayer(
      this,
      map,
      this.state.playerTile
    );
    this.lastTile = { ...this.state.playerTile };
    installLongjingWorldPhysics(this, this.player, map);

    createLongjingActor(
      this,
      map,
      map.npcSpawns.mia,
      longjingActorTexture("mia"),
      "longjing_mia"
    );
    createLongjingActor(
      this,
      map,
      map.npcSpawns.vendor,
      longjingActorTexture("market_vendor"),
      "market_vendor"
    );
    createLongjingActor(
      this,
      map,
      map.npcSpawns.chen,
      longjingActorTexture("chen_old"),
      "chen_shouyi"
    );

    const input = configureLongjingInput(this);
    this.movementKeys = input.movementKeys;
    this.commandKeys = input.commandKeys;
    this.hud = new ChapterHud(this);
    this.dialogue = new DialogueBox(this);
    this.board = new ProvenanceBoard(this);
    this.marker = new LongjingQuestMarker(this, map.tileSize);
    this.refreshAll();

    if (this.state.marketPhase === "ARRIVE") {
      this.dialogue.play(longjingLines("marketOpening"));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(): void {
    if (!this.player) return;
    this.marker.setSuppressed(
      this.dialogue.isActive || this.board.isOpen
    );
    if (this.handleDialogue()) return;
    if (this.handleBoard()) return;

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

  private handleDialogue(): boolean {
    if (!this.dialogue.isActive) return false;
    this.player.updateMovement(this.movementKeys, true);
    this.hud.setPrompt(null);
    if (longjingActionJustDown(this.commandKeys)) {
      this.dialogue.advance();
    }
    return true;
  }

  private handleBoard(): boolean {
    if (!this.board.isOpen) return false;
    this.player.updateMovement(this.movementKeys, true);
    this.hud.setPrompt(null);
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.left)) {
      this.board.move(-1);
    }
    if (Phaser.Input.Keyboard.JustDown(this.commandKeys.right)) {
      this.board.move(1);
    }
    if (longjingActionJustDown(this.commandKeys)) {
      const result = this.board.confirm();
      if (result.complete) {
        this.board.close();
        this.dispatch({ type: "MARKET_COMPLETE_BOARD" });
        this.hud.showToast("来处板第一层已完成");
      }
    }
    return true;
  }

  private currentTarget(): ChapterInteractable | null {
    return findChapterTarget(
      currentLongjingTile(
        this.player,
        LONGJING_MAPS.market.tileSize
      ),
      this.player.facing,
      LONGJING_MARKET_INTERACTABLES,
      this.state.marketPhase
    );
  }

  private interact(target: ChapterInteractable | null): void {
    if (target === null) {
      this.hud.showToast("这里没有当前要核对的线索");
      return;
    }
    if (target.id === "provenance_board") {
      this.dialogue.play(longjingLines(target.dialogueGroup), () => {
        const cards = cardsForEvidence(
          this.state.evidence.filter((id) =>
            [
              "evidence_tin_a",
              "evidence_duplicate_batch",
              "evidence_date_conflict",
              "evidence_flow_record"
            ].includes(id)
          )
        );
        this.board.open("来处板 · 声明与记录", cards);
      });
      return;
    }

    const event = this.eventForTarget(target.id);
    this.dialogue.play(longjingLines(target.dialogueGroup), () => {
      if (event !== null) this.dispatch(event);
      if (target.id === "tea_tin_a") {
        this.hud.showToast("记录 · 罐甲包装声明");
      } else if (target.id === "tea_tin_b") {
        this.hud.showToast("发现 · 重复批次与日期矛盾");
      } else if (target.id === "market_records") {
        this.hud.showToast("记录 · 无法互证的流通票据");
      } else if (target.id === "old_tea_scoop") {
        this.cameras.main.fadeOut(420, 23, 21, 22);
        this.time.delayedCall(440, () => {
          this.scene.start("LongjingTerrace");
        });
      }
    });
  }

  private eventForTarget(id: string): LongjingEvent | null {
    switch (id) {
      case "market_vendor":
        return { type: "MARKET_TALK_VENDOR" };
      case "tea_tin_a":
        return { type: "MARKET_INSPECT_TIN_A" };
      case "tea_tin_b":
        return { type: "MARKET_INSPECT_TIN_B" };
      case "market_records":
        return { type: "MARKET_CHECK_RECORDS" };
      case "old_tea_scoop":
        return { type: "MARKET_TOUCH_TEA_SCOOP" };
      default:
        return null;
    }
  }

  private dispatch(event: LongjingEvent): void {
    const next = reduceLongjing(this.state, event);
    if (next === this.state) return;
    this.state = next;
    this.saveService.save(this.state);
    this.refreshAll();
  }

  private refreshAll(): void {
    const quest = longjingQuest("market", this.state.marketPhase);
    this.hud.update({
      actLabel: "CHAPTER 02 / ACT 01 · 同号茶罐",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.evidence.length,
      progress: `线索 ${this.state.evidence.length}/7`
    });
    this.marker.update(activeLongjingMarker(this.state));
    this.objectLayer.sync(this.state);
  }

  private trackTile(): void {
    const tile = currentLongjingTile(
      this.player,
      LONGJING_MAPS.market.tileSize
    );
    if (tile.x === this.lastTile.x && tile.y === this.lastTile.y) return;
    this.lastTile = tile;
    this.dispatch({ type: "SET_LONGJING_PLAYER_TILE", tile });
  }
}
