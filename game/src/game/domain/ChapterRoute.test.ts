import { describe, expect, it } from "vitest";
import { sceneForChapterAct } from "./ChapterRoute";

describe("chapter boot routing", () => {
  it.each([
    [2, "ActTwo"],
    [3, "ActThree"],
    [4, "ActFour"],
    ["film", "HuangjiuFilm"],
    ["complete", "ChapterComplete"]
  ] as const)("routes chapter %s to %s", (act, scene) => {
    expect(sceneForChapterAct(act)).toBe(scene);
  });
});
