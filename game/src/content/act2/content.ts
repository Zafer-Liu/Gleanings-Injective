import type {
  ChapterDialogueChoice,
  ChapterDialogueLine,
  ChapterInteractable,
  ChapterMapContent,
  ChapterQuestContent
} from "../chapter/types";
import type { Act2Question } from "../../game/domain/chapterState";
import mapJson from "./brewery-map.json";
import dialogueJson from "./dialogue.zh-CN.json";
import interactablesJson from "./interactables.json";
import questsJson from "./quests.json";

export const act2Content = {
  map: mapJson as ChapterMapContent,
  dialogue: dialogueJson as {
    groups: Record<string, ChapterDialogueLine[]>;
    choices: ChapterDialogueChoice<Act2Question>[];
  },
  interactables: interactablesJson as ChapterInteractable[],
  quests: questsJson as ChapterQuestContent[]
};

export function act2Dialogue(id: string): ChapterDialogueLine[] {
  return act2Content.dialogue.groups[id] ?? [];
}

export function act2Quest(id: string): ChapterQuestContent {
  return (
    act2Content.quests.find((quest) => quest.id === id) ?? {
      id,
      title: "任务更新",
      hint: ""
    }
  );
}
