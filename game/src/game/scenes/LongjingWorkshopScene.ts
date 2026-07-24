import Phaser from "phaser";
import {
  LONGJING_MAPS,
  longjingLines,
  longjingQuest
} from "../../content/longjing/content";
import type { ChapterInteractable } from "../../content/chapter/types";
import {
  LONGJING_FIRING_ROUNDS,
  type LongjingFiringAction,
  type LongjingSaveV1
} from "../domain/longjingState";
import {
  reduceLongjing,
  type LongjingEvent
} from "../domain/longjingReducer";
import { sceneForLongjingAct } from "../domain/LongjingRoute";
import { Player, type MovementKeys } from "../entities/Player";
import { activeLongjingMarker } from "../render/LongjingScenePolicy";
import { renderLongjingWorld } from "../render/LongjingWorldRenderer";
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

export class LongjingWorkshopScene extends Phaser.Scene {
  private state!: LongjingSaveV1;
  private player!: Player;
  private movementKeys!: MovementKeys;
  private commandKeys!: LongjingCommandKeys;
  private hud!: ChapterHud;
  private dialogue!: DialogueBox;
  private choices!: ChapterChoicePanel<LongjingFiringAction>;
  private marker!: LongjingQuestMarker;
  private lastTile = { x: -1, y: -1 };
  private readonly saveService = new LongjingSaveService(
    window.localStorage
  );

  constructor() {
    super("LongjingWorkshop");
  }

  create(): void {
    const saved = this.saveService.load();
    if (saved === null) {
      this.scene.start("ChapterComplete");
      return;
    }
    if (saved.currentAct !== "workshop") {
      this.scene.start(sceneForLongjingAct(saved.currentAct));
      return;
    }
    this.state = saved;
    publishActiveScene("LongjingWorkshop");
    const map = LONGJING_MAPS.workshop;
    renderLongjingWorld(this, "workshop");
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
    this.choices = new ChapterChoicePanel<LongjingFiringAction>(this);
    this.marker = new LongjingQuestMarker(this, map.tileSize);
    this.refreshAll();
    if (this.state.workshopPhase === "FIRING") {
      this.time.delayedCall(180, () => this.openFiringRound());
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
    const action = this.choices.confirm();
    if (action === null) return true;
    const beforeStep = this.state.firingStep;
    const round = LONGJING_FIRING_ROUNDS[beforeStep];
    const correct =
      (
        round?.idealActions as
          | readonly LongjingFiringAction[]
          | undefined
      )?.includes(action) ?? false;
    this.choices.close();
    this.dispatch({
      type: "WORKSHOP_CHOOSE_ACTION",
      action
    });
    const advanced = this.state.firingStep > beforeStep;
    const text = correct
      ? `${action}。叶片的状态回应了这一手。`
      : advanced
        ? `何师傅扶住你的手，把这一段带了过去。${round?.hint ?? ""}`
        : `先停一下。${round?.hint ?? "再看一眼锅里的叶子。"}你还有一次调整机会。`;
    this.dialogue.play(
      [
        {
          speakerId: correct ? "young_chen" : "master_he",
          speakerName: correct ? "青年陈守一" : "何师傅",
          text
        }
      ],
      () => {
        if (this.state.workshopPhase === "FIRING") {
          this.openFiringRound();
        } else if (this.state.workshopPhase === "MEMORY") {
          this.hud.showToast("获得 · 掌火纹");
        }
      }
    );
    return true;
  }

  private openFiringRound(): void {
    const round = LONGJING_FIRING_ROUNDS[this.state.firingStep];
    if (
      round === undefined ||
      this.state.workshopPhase !== "FIRING"
    ) {
      return;
    }
    this.choices.open(
      {
        eyebrow: `${round.stage} · ${this.state.firingStep + 1}/${LONGJING_FIRING_ROUNDS.length}`,
        title: `${round.cue}${this.sensoryStateHint()}`,
        subtitle:
          this.state.pickCorrect >= 10
            ? "原料较匀齐。观察叶色、声音和手心温度，再决定动作。"
            : "原料不够匀齐，何师傅会多给一层感官提示。"
      },
      round.choices.map((action) => ({
        value: action,
        label: action,
        feedback: round.hint
      }))
    );
  }

  private sensoryStateHint(): string {
    if (this.state.firingHeat >= 4) {
      return " 手心热得太快，要先顾住受热。";
    }
    if (this.state.firingMoisture >= 4) {
      return " 叶边仍湿，锅里的声音还重。";
    }
    if (this.state.firingShape <= 1 && this.state.firingStep >= 3) {
      return " 叶条仍松，要边观察边整理。";
    }
    return " 锅里的声音正在变轻。";
  }

  private currentTarget(): ChapterInteractable | null {
    const map = LONGJING_MAPS.workshop;
    const items: ChapterInteractable[] =
      this.state.workshopPhase === "ARRIVE"
        ? [
            {
              id: "workshop_pan",
              tile: { x: 20, y: 17 },
              range: 1,
              prompt: "E · 观察锅里的叶子",
              dialogueGroup: "workshopOpening",
              enabledPhases: ["ARRIVE"]
            }
          ]
        : this.state.workshopPhase === "MEMORY"
          ? [
              {
                id: "old_signature",
                tile: { x: 31, y: 14 },
                range: 1,
                prompt: "E · 查看被压住的旧签样",
                dialogueGroup: "workshopMemory",
                enabledPhases: ["MEMORY"]
              }
            ]
          : [];
    return findChapterTarget(
      currentLongjingTile(this.player, map.tileSize),
      this.player.facing,
      items,
      this.state.workshopPhase
    );
  }

  private interact(target: ChapterInteractable | null): void {
    if (target === null) {
      this.hud.showToast("先找到箭头标记的锅台或旧签样");
      return;
    }
    if (target.id === "workshop_pan") {
      this.dialogue.play(longjingLines("workshopOpening"), () => {
        this.dispatch({ type: "WORKSHOP_BEGIN_FIRING" });
        this.openFiringRound();
      });
      return;
    }
    this.dialogue.play(longjingLines("workshopMemory"), () => {
      this.dispatch({ type: "WORKSHOP_REVEAL_REFUSAL" });
      this.cameras.main.fadeOut(420, 23, 21, 22);
      this.time.delayedCall(440, () => {
        this.scene.start("LongjingTruth");
      });
    });
  }

  private dispatch(event: LongjingEvent): void {
    const next = reduceLongjing(this.state, event);
    if (next === this.state) return;
    this.state = next;
    this.saveService.save(this.state);
    this.refreshAll();
  }

  private refreshAll(): void {
    const quest = longjingQuest("workshop", this.state.workshopPhase);
    this.hud.update({
      actLabel: "CHAPTER 02 / ACT 03 · 一掌春火",
      questTitle: quest.title,
      hint: quest.hint,
      inventoryCount: this.state.relics.length,
      progress: `掌火 ${this.state.firingStep}/${LONGJING_FIRING_ROUNDS.length}`
    });
    this.marker.update(activeLongjingMarker(this.state));
  }

  private trackTile(): void {
    const tile = currentLongjingTile(
      this.player,
      LONGJING_MAPS.workshop.tileSize
    );
    if (tile.x === this.lastTile.x && tile.y === this.lastTile.y) return;
    this.lastTile = tile;
    this.dispatch({ type: "SET_LONGJING_PLAYER_TILE", tile });
  }
}
