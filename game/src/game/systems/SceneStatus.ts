export function publishActiveScene(sceneKey: string): void {
  document
    .getElementById("game-root")
    ?.setAttribute("data-active-scene", sceneKey);
  window.dispatchEvent(
    new CustomEvent("gleanings:scenechange", {
      detail: { sceneKey }
    })
  );
}
