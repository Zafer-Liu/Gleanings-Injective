import type { ChapterInteractable } from "../../content/chapter/types";
import type { TilePosition } from "../domain/act1State";
import type { Facing } from "../entities/Player";

const FACING_VECTOR: Record<Facing, TilePosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function forwardDistance(
  playerTile: TilePosition,
  facing: Facing,
  targetTile: TilePosition
): number | null {
  const dx = targetTile.x - playerTile.x;
  const dy = targetTile.y - playerTile.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  if (distance === 0) return 0;

  const vector = FACING_VECTOR[facing];
  const forward = dx * vector.x + dy * vector.y;
  const sideways = Math.abs(dx * vector.y - dy * vector.x);
  return forward > 0 && sideways === 0 ? distance : null;
}

export function findChapterTarget(
  playerTile: TilePosition,
  facing: Facing,
  interactables: ChapterInteractable[],
  phase: string
): ChapterInteractable | null {
  return (
    interactables
      .filter(
        (item) =>
          item.enabledPhases === undefined ||
          item.enabledPhases.includes(phase)
      )
      .map((item) => ({
        item,
        distance: forwardDistance(playerTile, facing, item.tile)
      }))
      .filter(
        (
          candidate
        ): candidate is {
          item: ChapterInteractable;
          distance: number;
        } =>
          candidate.distance !== null &&
          candidate.distance <= candidate.item.range
      )
      .sort(
        (a, b) =>
          a.distance - b.distance ||
          a.item.id.localeCompare(b.item.id)
      )[0]?.item ?? null
  );
}
