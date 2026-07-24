import type { LongjingAct } from "./longjingState";

export type LongjingSceneKey =
  | "LongjingMarket"
  | "LongjingTerrace"
  | "LongjingWorkshop"
  | "LongjingTruth"
  | "LongjingFilm"
  | "LongjingComplete";

export function sceneForLongjingAct(
  act: LongjingAct
): LongjingSceneKey {
  switch (act) {
    case "market":
      return "LongjingMarket";
    case "terrace":
      return "LongjingTerrace";
    case "workshop":
      return "LongjingWorkshop";
    case "truth":
      return "LongjingTruth";
    case "film":
      return "LongjingFilm";
    case "complete":
      return "LongjingComplete";
  }
}
