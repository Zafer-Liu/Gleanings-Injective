import { describe, expect, it } from "vitest";
import { act4Content, act4Dialogue } from "./content";

describe("act four content", () => {
  it("uses Chinese character names", () => {
    const names = Object.values(act4Content.dialogue.groups)
      .flat()
      .map((line) => line.speakerName);

    expect(names).toContain("林念安");
    expect(names).toContain("米娅");
    expect(names).not.toContain("林怡");
  });

  it("bridges the family story into the longer huangjiu tradition", () => {
    const bridge = act4Dialogue("miaBridge")
      .map((line) => line.text)
      .join("");

    expect(bridge).toContain("这是你们家的酒");
    expect(bridge).toContain("一条更长的黄酒传统");
  });

  it("offers three explanation angles without claiming a real AI call", () => {
    expect(act4Content.dialogue.choices).toHaveLength(3);
    expect(JSON.stringify(act4Content)).not.toContain("OpenAI");
  });
});
