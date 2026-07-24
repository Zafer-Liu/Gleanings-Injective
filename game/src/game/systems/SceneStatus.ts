export function publishActiveScene(sceneKey: string): void {
  document
    .getElementById("game-root")
    ?.setAttribute("data-active-scene", sceneKey);
}
