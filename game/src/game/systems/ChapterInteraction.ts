import type { ChapterInteractable } from "../../content/chapter/types";
import type { TilePosition } from "../domain/act1State";
import type { Facing } from "../entities/Player";

const FACING_VECTOR: Record<Facing, TilePosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OBJECTIVE_TRIGGER_RADIUS = 1;

function squareDistance(
  playerTile: TilePosition,
  targetTile: TilePosition
): number {
  return Math.max(
    Math.abs(targetTile.x - playerTile.x),
    Math.abs(targetTile.y - playerTile.y)
  );
}

function forwardDistance(
  playerTile: TilePosition,
  facing: Facing,
  targetTile: TilePosition,
  sidewaysRange: number
): number | null {
  const dx = targetTile.x - playerTile.x;
  const dy = targetTile.y - playerTile.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  if (distance === 0) return 0;

  const vector = FACING_VECTOR[facing];
  const forward = dx * vector.x + dy * vector.y;
  const sideways = Math.abs(dx * vector.y - dy * vector.x);
  return forward > 0 && sideways <= sidewaysRange ? distance : null;
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
      .map((item) => {
        const isActiveObjective =
          item.optional !== true &&
          item.enabledPhases?.includes(phase) === true;
        return {
          item,
          distance: isActiveObjective
            ? squareDistance(playerTile, item.tile)
            : forwardDistance(
                playerTile,
                facing,
                item.tile,
                item.sidewaysRange ?? 0
              ),
          range: isActiveObjective
            ? OBJECTIVE_TRIGGER_RADIUS
            : item.range
        };
      })
      .filter(
        (
          candidate
        ): candidate is {
          item: ChapterInteractable;
          distance: number;
          range: number;
        } =>
          candidate.distance !== null &&
          candidate.distance <= candidate.range
      )
      .sort(
        (a, b) =>
          a.distance - b.distance ||
          a.item.id.localeCompare(b.item.id)
      )[0]?.item ?? null
  );
}
