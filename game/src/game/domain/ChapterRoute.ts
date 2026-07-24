import type { ChapterAct } from "./chapterState";

export type ChapterSceneKey =
  | "ActTwo"
  | "ActThree"
  | "ActFour"
  | "HuangjiuFilm"
  | "ChapterComplete";

export function sceneForChapterAct(
  act: ChapterAct
): ChapterSceneKey {
  switch (act) {
    case 2:
      return "ActTwo";
    case 3:
      return "ActThree";
    case 4:
      return "ActFour";
    case "film":
      return "HuangjiuFilm";
    case "complete":
      return "ChapterComplete";
  }
}
