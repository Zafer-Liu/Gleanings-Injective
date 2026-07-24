export type ChapterMeta = {
  eyebrow: string;
  title: string;
  note: string;
  stageLabel: string;
};

const CHAPTER_ONE_META: ChapterMeta = {
  eyebrow: "GLEANINGS / CHAPTER 01",
  title: "一坛回声",
  note: "福建老酒 · 四幕家族记忆与一支黄酒后记",
  stageLabel: "拾遗第一章游戏画面"
};

const CHAPTER_TWO_META: ChapterMeta = {
  eyebrow: "GLEANINGS / CHAPTER 02",
  title: "一叶来处",
  note: "西湖龙井 · 一片叶的来路与一双手的选择",
  stageLabel: "拾遗第二章游戏画面"
};

export function chapterMetaForScene(sceneKey: string): ChapterMeta {
  return sceneKey.startsWith("Longjing")
    ? { ...CHAPTER_TWO_META }
    : { ...CHAPTER_ONE_META };
}
