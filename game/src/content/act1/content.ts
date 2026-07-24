import type {
  Act1Phase,
  SenseChoice,
  TilePosition
} from "../../game/domain/act1State";
import dialogueJson from "./dialogue.zh-CN.json";
import questsJson from "./quests.json";
import interactablesJson from "./interactables.json";
import mapJson from "./apartment-map.json";

export type DialogueLine = {
  speakerId: string;
  speakerName: string;
  text: string;
};

export type DialogueChoice = {
  value: SenseChoice;
  label: string;
  feedback: string;
  motif: string;
};

export type QuestContent = {
  id: string;
  title: string;
  hint: string;
};

export type InteractableContent = {
  id: string;
  kind: "main" | "optional";
  tile: TilePosition;
  range: number;
  sidewaysRange?: number;
  enabledPhases?: Act1Phase[];
  dialogueGroup: string;
};

export type TileRectangle = {
  id: string;
  kind?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ApartmentMapContent = {
  size: { width: number; height: number };
  tileSize: number;
  playerSpawn: TilePosition;
  miaSpawn: TilePosition;
  furniture: TileRectangle[];
  collisions: TileRectangle[];
  occluders: TileRectangle[];
};

export const act1Content = {
  dialogue: dialogueJson as {
    groups: Record<string, DialogueLine[]>;
    choices: DialogueChoice[];
  },
  quests: questsJson as QuestContent[],
  interactables: interactablesJson as InteractableContent[],
  map: mapJson as ApartmentMapContent
};

export function dialogueGroup(id: string): DialogueLine[] {
  return act1Content.dialogue.groups[id] ?? [];
}

export function questContent(id: string): QuestContent {
  return (
    act1Content.quests.find((quest) => quest.id === id) ?? {
      id,
      title: "任务更新",
      hint: ""
    }
  );
}
