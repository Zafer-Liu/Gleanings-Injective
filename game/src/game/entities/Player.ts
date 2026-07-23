import Phaser from "phaser";
import {
  playerAnimationKey,
  playerAnimationSpec
} from "./PlayerVisualPolicy";

export type Facing = "down" | "left" | "right" | "up";

export type MovementKeys = {
  up: { readonly isDown: boolean };
  down: { readonly isDown: boolean };
  left: { readonly isDown: boolean };
  right: { readonly isDown: boolean };
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly speed = 92;
  private currentFacing: Facing = "down";
  private readonly textureKey: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture = "actor-yi"
  ) {
    super(scene, x, y, texture, playerAnimationSpec("down").idleFrame);
    this.textureKey = texture;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.78);
    this.setDepth(20);
    this.setCollideWorldBounds(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 16);
    body.setOffset(7, 29);
    this.createAnimations(texture);
  }

  get facing(): Facing {
    return this.currentFacing;
  }

  updateMovement(keys: MovementKeys, locked: boolean): boolean {
    if (locked) {
      this.stopAtIdle();
      return false;
    }

    let velocityX = 0;
    let velocityY = 0;
    if (keys.left.isDown) velocityX -= 1;
    if (keys.right.isDown) velocityX += 1;
    if (keys.up.isDown) velocityY -= 1;
    if (keys.down.isDown) velocityY += 1;

    const moving = velocityX !== 0 || velocityY !== 0;
    if (!moving) {
      this.stopAtIdle();
      return false;
    }

    const length = Math.hypot(velocityX, velocityY);
    this.setVelocity(
      Math.round((velocityX / length) * this.speed),
      Math.round((velocityY / length) * this.speed)
    );

    if (Math.abs(velocityX) > Math.abs(velocityY)) {
      this.currentFacing = velocityX < 0 ? "left" : "right";
    } else {
      this.currentFacing = velocityY < 0 ? "up" : "down";
    }
    this.setFlipX(playerAnimationSpec(this.currentFacing).flipX);
    this.play(
      playerAnimationKey(this.textureKey, this.currentFacing),
      true
    );
    return true;
  }

  private stopAtIdle(): void {
    this.setVelocity(0, 0);
    this.stop();
    const spec = playerAnimationSpec(this.currentFacing);
    this.setFlipX(spec.flipX);
    this.setFrame(spec.idleFrame);
  }

  private createAnimations(texture: string): void {
    const facings: Facing[] = ["down", "left", "right", "up"];
    facings.forEach((facing) => {
      const key = playerAnimationKey(texture, facing);
      if (this.scene.anims.exists(key)) return;
      const spec = playerAnimationSpec(facing);
      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNumbers(texture, {
          start: spec.frameStart,
          end: spec.frameEnd
        }),
        frameRate: 7,
        repeat: -1
      });
    });
  }
}
