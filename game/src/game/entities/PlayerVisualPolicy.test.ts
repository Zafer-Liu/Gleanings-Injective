import { describe, expect, it } from "vitest";
import {
  PLAYER_WORLD_DEPTH,
  playerAnimationKey,
  playerAnimationSpec
} from "./PlayerVisualPolicy";

describe("PlayerVisualPolicy", () => {
  it("keeps the player above world sprites and below HUD overlays", () => {
    expect(PLAYER_WORLD_DEPTH).toBeGreaterThan(9_000);
    expect(PLAYER_WORLD_DEPTH).toBeLessThan(9_500);
  });

  it("mirrors the full-size left frames when 林怡 faces right", () => {
    expect(playerAnimationSpec("right")).toEqual({
      frameStart: 3,
      frameEnd: 5,
      idleFrame: 4,
      flipX: true
    });
  });

  it("keeps the original full-size rows for the other directions", () => {
    expect(playerAnimationSpec("down")).toEqual({
      frameStart: 0,
      frameEnd: 2,
      idleFrame: 1,
      flipX: false
    });
    expect(playerAnimationSpec("left")).toEqual({
      frameStart: 3,
      frameEnd: 5,
      idleFrame: 4,
      flipX: false
    });
    expect(playerAnimationSpec("up")).toEqual({
      frameStart: 9,
      frameEnd: 11,
      idleFrame: 10,
      flipX: false
    });
  });

  it("names animations by texture so multiple generations can coexist", () => {
    expect(playerAnimationKey("actor-yi", "down")).toBe(
      "actor-yi-down"
    );
    expect(playerAnimationKey("actor-taipo-middle", "up")).toBe(
      "actor-taipo-middle-up"
    );
  });
});
