import Phaser from "phaser";
import {
  LONGJING_INSCRIPTION_CHOICES,
  LONGJING_MAPS,
  LONGJING_TRUTH_INTERACTABLES,
  longjingLines,
  longjingQuest
} from "../../content/longjing/content";
import type { ChapterInteractable } from "../../content/chapter/types";
import { cardsForEvidence } from "../domain/provenanceBoard";
import {
  reduceLongjing,
  type LongjingEvent
} from "../domain/longjingReducer";
import type {
  LongjingInscription,
  LongjingSaveV1
} from "../domain/longjingState";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { Player, type MovementKeys } from "../entities/Player";
import { activeLongjingMarker } from "../render/LongjingScenePolicy";
import { longjingActorTexture } from "../render/LongjingActorPolicy";
import { LongjingObjectLayer } from "../render/LongjingObjectLayer";
import { renderLongjingWorld } from "../render/LongjingWorldRenderer";
import { findChapterTarget } from "../systems/ChapterInteraction";
import { LongjingSaveService } from "../systems/LongjingSaveService";
import { publishActiveScene } from "../systems/SceneStatus";
import { ChapterChoicePanel } from "../ui/ChapterChoicePanel";
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

export class LongjingTruthScene extends Phaser.Scene {
  private state!: LongjingSaveV1;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: LongjingCommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private board!: ProvenanceBoard;
  private choices!: ChapterChoicePanel<LongjingInscription>;
  private marker!: LongjingQuestMarker;
  private objectLayer!: LongjingObjectLayer;
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingTruth");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null) {
      this.scene.start("ChapterComplete");
      return;
    }
    if (saved.currentAct !== "truth") {
      this.scene.start(sceneForLongjingAct(saved.currentAct));
      return;
    }
    this.state = saved;
    publishActiveScene("LongjingTruth");
    const map = LONGJING_MAPS.truth;
    renderLongjingWorld(this, "truth");
    this.objectLayer = new LongjingObjectLayer(
      this,
      map.tileSize,
      "truth"
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
    this.choices =
      new ChapterChoicePanel<LongjingInscription>(this);
    this.marker = new LongjingQuestMarker(this, map.tileSize);
    this.refreshAll();
    if (this.state.truthPhase === "ARRIVE") {
      this.dialogue.play(longjingLines("truthOpening"));
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveService.save(this.state);
    });
  }

  update(): void {
    if (!this.player) return;
    this.marker.setSuppressed(
      this.dialogue.isActive ||
        this.board.isOpen ||
        this.choices.isOpen
    );
    if (this.handleDialogue()) return;
    if (this.handleBoard()) return;
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
        this.dispatch({ type: "TRUTH_COMPLETE_BOARD" });
        this.dialogue.play(longjingLines("truthStatement"));
      }
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
    const selected = this.choices.selectedChoice();
    const inscription = this.choices.confirm();
    if (selected === null || inscription === null) return true;
    this.choices.close();
    this.dispatch({
      type: "TRUTH_CHOOSE_INSCRIPTION",
      inscription
    });
    const endingGroup: Record<LongjingInscription, string> = {
      restore_name: "endingRestoreName",
      keep_truth: "endingKeepTruth",
      pass_on: "endingPassOn"
    };
    this.dialogue.play(
      [
        {
          speakerId: "relic",
          speakerName: "题词",
          text: selected.feedback
        },
        ...longjingLines(endingGroup[inscription]),
        ...longjingLines("finalTea")
      ],
      () => {
        this.scene.start("LongjingFilm");
      }
    );
    return true;
  }

  private currentTarget(): ChapterInteractable | null {
    let items = LONGJING_TRUTH_INTERACTABLES;
    if (this.state.truthPhase === "COLLECT") {
      items = items.filter((item) => {
        if (
          item.id === "original_batch" &&
          this.state.evidence.includes("evidence_original_batch")
        ) {
          return false;
        }
        if (
          item.id === "refusal_copy" &&
          this.state.evidence.includes("evidence_refusal_copy")
        ) {
          return false;
        }
        return true;
      });
    }
    return findChapterTarget(
      currentLongjingTile(
        this.player,
        LONGJING_MAPS.truth.tileSize
      ),
      this.player.facing,
      items,
      this.state.truthPhase
    );
  }

  private interact(target: ChapterInteractable | null): void {
    if (target === null) {
      this.hud.showToast("继续核对箭头标记的记录");
      return;
    }
    if (target.id === "truth_board") {
      this.dialogue.play(longjingLines(target.dialogueGroup), () => {
        const ids = [
          "evidence_duplicate_batch",
          "evidence_date_conflict",
          "evidence_flow_record",
          "evidence_old_signature",
          "evidence_original_batch",
          "evidence_refusal_copy"
        ] as const;
        this.board.open(
          "来处板 · 完成来源声明",
          cardsForEvidence(
            ids.filter((id) => this.state.evidence.includes(id))
          )
        );
      });
      return;
    }
    if (target.id === "inscription_table") {
      this.dialogue.play(longjingLines("inscriptionIntro"), () => {
        this.choices.open(
          {
            eyebrow: "章节藏品 · 一叶来处",
            title: "你想把哪一句留在藏品上？",
            subtitle: "题词只改变表达侧重，不改变事实结论。"
          },
          LONGJING_INSCRIPTION_CHOICES
        );
      });
      return;
    }

    const event = this.eventForTarget(target.id);
    this.dialogue.play(longjingLines(target.dialogueGroup), () => {
      if (event !== null) this.dispatch(event);
      if (target.id === "original_batch") {
        this.hud.showToast("证据 · 原始批次账");
      } else if (target.id === "refusal_copy") {
        this.hud.showToast("证据 · 拒签留底");
      }
    });
  }

  private eventForTarget(id: string): LongjingEvent | null {
    switch (id) {
      case "chen_ledger":
        return { type: "TRUTH_OPEN_LEDGER" };
      case "original_batch":
        return {
          type: "TRUTH_COLLECT_EVIDENCE",
          evidence: "evidence_original_batch"
        };
      case "refusal_copy":
        return {
          type: "TRUTH_COLLECT_EVIDENCE",
          evidence: "evidence_refusal_copy"
        };
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
    const quest = longjingQuest("truth", this.state.truthPhase);
    this.hud.update({
      actLabel: "CHAPTER 02 / ACT 04 · 名字的重量",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.evidence.length,
      progress: `证据 ${this.state.evidence.length}/7`
    });
    this.marker.update(activeLongjingMarker(this.state));
    this.objectLayer.sync(this.state);
  }

  private trackTile(): void {
    const tile = currentLongjingTile(
      this.player,
      LONGJING_MAPS.truth.tileSize
    );
    if (tile.x === this.lastTile.x && tile.y === this.lastTile.y) return;
    this.lastTile = tile;
    this.dispatch({ type: "SET_LONGJING_PLAYER_TILE", tile });
  }
}
