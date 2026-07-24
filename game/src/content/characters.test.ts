import { describe, expect, it } from "vitest";
import { act1Content } from "./act1/content";
import { act4Content } from "./act4/content";
import { CHARACTERS } from "./characters";

describe("shared character identities", () => {
  it("keeps the legacy actor id while displaying 林念安 everywhere", () => {
    expect(CHARACTERS.protagonist).toEqual({
      id: "actor_yi",
      displayName: "林念安",
      englishName: "Nian'an Lin"
    });
  });

  it("keeps the returning companion and Longjing characters named", () => {
    expect(CHARACTERS.mia.displayName).toBe("米娅");
    expect(CHARACTERS.chenShouyi.displayName).toBe("陈守一");
    expect(CHARACTERS.masterHe.displayName).toBe("何师傅");
  });

  it("removes the former display name from chapter-one dialogue", () => {
    const dialogue = JSON.stringify([
      act1Content.dialogue,
      act4Content.dialogue
    ]);

    expect(dialogue).toContain("林念安");
    expect(dialogue).not.toContain("林怡");
  });
});
