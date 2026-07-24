import type { InteractableContent } from "../../content/act1/content";
import type { Act1Event } from "../domain/act1Reducer";
import type {
  Act1Phase,
  Act1State,
  TilePosition
} from "../domain/act1State";
import type { Facing } from "../entities/Player";

export type InteractionKind =
  | "box"
  | "jar-early"
  | "jar-ready"
  | "optional";

export type InteractionResolution = {
  kind: InteractionKind;
  dialogueGroup: string;
  completionEvents: Act1Event[];
  openChoice: boolean;
};

type HintTiming = {
  now: number;
  lastProgressAt: number;
  invalidInteractions: number;
};

const FACING_VECTOR: Record<Facing, TilePosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function directionalDistance(
  playerTile: TilePosition,
  facing: Facing,
  targetTile: TilePosition,
  sidewaysRange: number
): number | null {
  const dx = targetTile.x - playerTile.x;
  const dy = targetTile.y - playerTile.y;
  const manhattan = Math.abs(dx) + Math.abs(dy);
  if (manhattan === 0) return 0;

  const vector = FACING_VECTOR[facing];
  const forward = dx * vector.x + dy * vector.y;
  const sideways = Math.abs(dx * vector.y - dy * vector.x);
  if (forward <= 0 || sideways > sidewaysRange) return null;
  return manhattan;
}

export function findInteractionTarget(
  playerTile: TilePosition,
  facing: Facing,
  interactables: InteractableContent[],
  phase: Act1Phase
): InteractableContent | null {
  const candidates = interactables
    .filter(
      (interactable) =>
        interactable.enabledPhases === undefined ||
        interactable.enabledPhases.includes(phase)
    )
    .map((interactable) => ({
      interactable,
      distance: directionalDistance(
        playerTile,
        facing,
        interactable.tile,
        interactable.sidewaysRange ?? 0
      )
    }))
    .filter(
      (
        candidate
      ): candidate is {
        interactable: InteractableContent;
        distance: number;
      } =>
        candidate.distance !== null &&
        candidate.distance <= candidate.interactable.range
    )
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        a.interactable.id.localeCompare(b.interactable.id)
    );

  return candidates[0]?.interactable ?? null;
}

export function resolveInteraction(
  state: Act1State,
  target: InteractableContent
): InteractionResolution {
  if (target.id === "obj_cardboard_box") {
    return {
      kind: "box",
      dialogueGroup: target.dialogueGroup,
      completionEvents:
        state.phase === "EXPLORE" ? [{ type: "ACQUIRE_NOTE" }] : [],
      openChoice: false
    };
  }

  if (target.id === "obj_laojiu_jar") {
    const jarIsReady = [
      "NOTE_READ",
      "MIA_ENTERED",
      "JAR_INSPECTED"
    ].includes(state.phase);
    return {
      kind: jarIsReady ? "jar-ready" : "jar-early",
      dialogueGroup: jarIsReady ? target.dialogueGroup : "jarEarly",
      completionEvents:
        state.phase === "NOTE_READ" || state.phase === "MIA_ENTERED"
          ? [{ type: "INSPECT_JAR" }]
          : [],
      openChoice: jarIsReady
    };
  }

  return {
    kind: "optional",
    dialogueGroup: target.dialogueGroup,
    completionEvents: [
      { type: "INSPECT_OBJECT", objectId: target.id }
    ],
    openChoice: false
  };
}

export function canBeginJarOpening(
  state: Act1State,
  target: InteractableContent | null
): boolean {
  return (
    target?.id === "obj_laojiu_jar" &&
    state.phase === "SENSE_CHOSEN" &&
    state.senseChoice !== null &&
    !state.movementLocked
  );
}

export function shouldShowContextHint({
  now,
  lastProgressAt,
  invalidInteractions
}: HintTiming): boolean {
  return now - lastProgressAt >= 8_000 || invalidInteractions >= 2;
}
