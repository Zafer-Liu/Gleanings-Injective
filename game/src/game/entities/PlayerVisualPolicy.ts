import type { Facing } from "./Player";

export const PLAYER_WORLD_DEPTH = 9_400;

export type PlayerAnimationSpec = {
  frameStart: number;
  frameEnd: number;
  idleFrame: number;
  flipX: boolean;
};

const SPECS: Record<Facing, PlayerAnimationSpec> = {
  down: {
    frameStart: 0,
    frameEnd: 2,
    idleFrame: 1,
    flipX: false
  },
  left: {
    frameStart: 3,
    frameEnd: 5,
    idleFrame: 4,
    flipX: false
  },
  right: {
    frameStart: 3,
    frameEnd: 5,
    idleFrame: 4,
    flipX: true
  },
  up: {
    frameStart: 9,
    frameEnd: 11,
    idleFrame: 10,
    flipX: false
  }
};

export function playerAnimationSpec(
  facing: Facing
): PlayerAnimationSpec {
  return { ...SPECS[facing] };
}

export function playerAnimationKey(
  texture: string,
  facing: Facing
): string {
  return `${texture}-${facing}`;
}
