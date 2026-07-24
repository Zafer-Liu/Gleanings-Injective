import type {
  ChapterDialogueChoice,
  ChapterDialogueLine
} from "../chapter/types";
import type { Act4Explanation } from "../../game/domain/chapterState";
import dialogueJson from "./dialogue.zh-CN.json";

export const act4Content = {
  dialogue: dialogueJson as {
    groups: Record<string, ChapterDialogueLine[]>;
    choices: ChapterDialogueChoice<Act4Explanation>[];
  }
};

export function act4Dialogue(id: string): ChapterDialogueLine[] {
  return act4Content.dialogue.groups[id] ?? [];
}
