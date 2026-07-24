import Phaser from "phaser";
import type { ChapterMapContent } from "../../content/chapter/types";
import type { TilePosition } from "../domain/act1State";
import { Player, type MovementKeys } from "../entities/Player";
import { buildChapterGeometry } from "../render/ChapterMapGeometry";
import { tileToPixelCenter } from "../render/ApartmentRenderer";

export type LongjingCommandKeys = {
  interact: Phaser.Input.Keyboard.Key;
  alternate: Phaser.Input.Keyboard.Key;
  confirm: Phaser.Input.Keyboard.Key;
  inventory: Phaser.Input.Keyboard.Key;
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export function configureLongjingInput(scene: Phaser.Scene): {
  movementKeys: MovementKeys;
  commandKeys: LongjingCommandKeys;
} {
  const keyboard = scene.input.keyboard;
  if (keyboard === null) {
    throw new Error("Keyboard input is unavailable");
  }
  const cursors = keyboard.createCursorKeys();
  const wasd = keyboard.addKeys("W,A,S,D") as Record<
    "W" | "A" | "S" | "D",
    Phaser.Input.Keyboard.Key
  >;
  return {
    movementKeys: {
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
    },
    commandKeys: {
      interact: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      alternate: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      confirm: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER),
      inventory: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I),
      up: cursors.up,
      down: cursors.down,
      left: cursors.left,
      right: cursors.right
    }
  };
}

export function longjingActionJustDown(
  keys: LongjingCommandKeys
): boolean {
  return (
    Phaser.Input.Keyboard.JustDown(keys.interact) ||
    Phaser.Input.Keyboard.JustDown(keys.alternate) ||
    Phaser.Input.Keyboard.JustDown(keys.confirm)
  );
}

export function createLongjingPlayer(
  scene: Phaser.Scene,
  map: ChapterMapContent,
  tile: TilePosition,
  texture = "actor-yi"
): Player {
  const pixel = tileToPixelCenter(tile, map.tileSize);
  return new Player(scene, pixel.x, pixel.y, texture);
}

export function createLongjingActor(
  scene: Phaser.Scene,
  map: ChapterMapContent,
  tile: TilePosition,
  texture: string,
  name: string,
  tint?: number
): Phaser.GameObjects.Sprite {
  const pixel = tileToPixelCenter(tile, map.tileSize);
  const actor = scene.add
    .sprite(pixel.x, pixel.y, texture, 1)
    .setOrigin(0.5, 0.78)
    .setName(name)
    .setDepth(pixel.y);
  if (tint !== undefined) actor.setTint(tint);
  return actor;
}

export function installLongjingWorldPhysics(
  scene: Phaser.Scene,
  player: Player,
  map: ChapterMapContent
): { width: number; height: number } {
  const geometry = buildChapterGeometry(map);
  scene.physics.world.setBounds(
    0,
    0,
    geometry.width,
    geometry.height
  );
  geometry.collisions.forEach((collision) => {
    const zone = scene.add.zone(
      collision.x + collision.width / 2,
      collision.y + collision.height / 2,
      collision.width,
      collision.height
    );
    scene.physics.add.existing(zone, true);
    scene.physics.add.collider(player, zone);
  });
  scene.cameras.main
    .setBounds(0, 0, geometry.width, geometry.height)
    .startFollow(player, true, 1, 1)
    .setDeadzone(104, 72);
  scene.cameras.main.roundPixels = true;
  return { width: geometry.width, height: geometry.height };
}

export function currentLongjingTile(
  player: Player,
  tileSize: number
): TilePosition {
  return {
    x: Math.floor(player.x / tileSize),
    y: Math.floor(player.y / tileSize)
  };
}
