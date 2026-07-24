import { describe, expect, it } from "vitest";
import type { DialogueLine } from "../../content/act1/content";
import { DialogueSystem } from "./DialogueSystem";

const lines: DialogueLine[] = [
  { speakerId: "narrator", speakerName: "旁白", text: "第一句。" },
  { speakerId: "actor_yi", speakerName: "林念安", text: "第二句。" }
];

describe("DialogueSystem", () => {
  it("advances in order and reports completion exactly once", () => {
    const dialogue = new DialogueSystem();

    expect(dialogue.start(lines)).toEqual(lines[0]);
    expect(dialogue.advance()).toEqual({
      line: lines[1],
      completed: false
    });
    expect(dialogue.advance()).toEqual({
      line: null,
      completed: true
    });
    expect(dialogue.advance()).toEqual({
      line: null,
      completed: false
    });
  });
});
