import type {
  ChapterDialogueChoice,
  ChapterDialogueLine,
  ChapterInteractable,
  ChapterMapContent,
  ChapterQuestContent
} from "../chapter/types";
import type {
  Act3Inscription,
  Act3Material
} from "../../game/domain/chapterState";
import mapJson from "./kitchen-map.json";
import dialogueJson from "./dialogue.zh-CN.json";
import interactablesJson from "./interactables.json";
import questsJson from "./quests.json";

export type Act3Interactable = ChapterInteractable & {
  material?: Act3Material;
};

export const act3Content = {
  map: mapJson as ChapterMapContent,
  dialogue: dialogueJson as {
    groups: Record<string, ChapterDialogueLine[]>;
    choices: ChapterDialogueChoice<Act3Inscription>[];
  },
  interactables: interactablesJson as Act3Interactable[],
  quests: questsJson as ChapterQuestContent[]
};

export function act3Dialogue(id: string): ChapterDialogueLine[] {
  return act3Content.dialogue.groups[id] ?? [];
}

export function act3Quest(id: string): ChapterQuestContent {
  return (
    act3Content.quests.find((quest) => quest.id === id) ?? {
      id,
      title: "任务更新",
      hint: ""
    }
  );
}
