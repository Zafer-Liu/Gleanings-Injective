import Phaser from "phaser";
import { createGameConfig } from "./config";
import { installDebugTools } from "./debug/DebugTools";

export function startGame(parent: string): Phaser.Game {
  const game = new Phaser.Game(createGameConfig(parent));
  installDebugTools(game);
  return game;
}
