import Phaser from "phaser";
import { ActOneCompleteScene } from "./scenes/ActOneCompleteScene";
import { ApartmentScene } from "./scenes/ApartmentScene";
import { BootScene } from "./scenes/BootScene";
import { MemoryTransitionScene } from "./scenes/MemoryTransitionScene";
import { ActTwoScene } from "./scenes/ActTwoScene";
import { ActThreeScene } from "./scenes/ActThreeScene";
import { ActFourScene } from "./scenes/ActFourScene";
import { HuangjiuFilmScene } from "./scenes/HuangjiuFilmScene";
import { ChapterCompleteScene } from "./scenes/ChapterCompleteScene";

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

export function createGameConfig(
  parent: string
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#211A17",
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: "arcade",
      arcade: {
        debug: false,
        gravity: { x: 0, y: 0 }
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT
    },
    render: {
      antialias: false,
      antialiasGL: false,
      roundPixels: true,
      pixelArt: true
    },
    scene: [
      BootScene,
      ApartmentScene,
      MemoryTransitionScene,
      ActOneCompleteScene,
      ActTwoScene,
      ActThreeScene,
      ActFourScene,
      HuangjiuFilmScene,
      ChapterCompleteScene
    ]
  };
}
