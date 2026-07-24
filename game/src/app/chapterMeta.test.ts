import { describe, expect, it } from "vitest";
import { chapterMetaForScene } from "./chapterMeta";

describe("chapterMetaForScene", () => {
  it("shows chapter one metadata for the Huangjiu journey", () => {
    expect(chapterMetaForScene("HuangjiuFilm")).toEqual({
      eyebrow: "GLEANINGS / CHAPTER 01",
      title: "一坛回声",
      note: "福建老酒 · 四幕家族记忆与一支黄酒后记",
      stageLabel: "拾遗第一章游戏画面"
    });
  });

  it("shows chapter two metadata for every Longjing scene", () => {
    expect(chapterMetaForScene("LongjingMarket")).toEqual({
      eyebrow: "GLEANINGS / CHAPTER 02",
      title: "一叶来处",
      note: "西湖龙井 · 一片叶的来路与一双手的选择",
      stageLabel: "拾遗第二章游戏画面"
    });
    expect(chapterMetaForScene("LongjingComplete").title).toBe(
      "一叶来处"
    );
  });
});
