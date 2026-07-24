export const HUANGJIU_FILM_DURATION_MS = 60_000;

export type HuangjiuFilmVisual =
  | "family-jar"
  | "grain-wine"
  | "jiahu-vessel"
  | "qu-fermentation"
  | "song-yuan"
  | "fujian-hongqu";

export type HuangjiuFilmSegment = {
  id: string;
  startMs: number;
  endMs: number;
  chapter: string;
  title: string;
  subtitle: string;
  sourceLabel: string;
  sourceUrl?: string;
  visual: HuangjiuFilmVisual;
};

export const huangjiuFilmSegments: HuangjiuFilmSegment[] = [
  {
    id: "family",
    startMs: 0,
    endMs: 8_000,
    chapter: "01 / 一坛之外",
    title: "从一坛福建老酒开始",
    subtitle:
      "故事从太婆留下的一坛福建老酒开始。酒会饮尽，迁徙、照料和记忆，却留在坛边。",
    sourceLabel: "《拾遗》家族剧情",
    visual: "family-jar"
  },
  {
    id: "grain",
    startMs: 8_000,
    endMs: 18_000,
    chapter: "02 / 谷物与时间",
    title: "中国代表性的谷物酿造酒",
    subtitle:
      "黄酒以稻米、黍米等谷物为原料，经蒸煮、加曲、糖化发酵、压榨和贮存酿成，是谷物与微生物共同完成的酿造酒。",
    sourceLabel: "国家市场监督管理总局 · 黄酒生产许可审查细则",
    sourceUrl:
      "https://www.samr.gov.cn/spscs/tzgg/art/2023/art_c7f0624fa4fe46daa509549b5ba85ab3.html",
    visual: "grain-wine"
  },
  {
    id: "jiahu",
    startMs: 18_000,
    endMs: 28_000,
    chapter: "03 / 九千年前",
    title: "贾湖的早期发酵饮料",
    subtitle:
      "约九千年前，贾湖先民已制作含稻米、蜂蜜和果实的混合发酵饮料。它并不是今天的黄酒，却留下早期酿造的踪迹。",
    sourceLabel: "PNAS 2004 · Fermented beverages of China",
    sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15590771/",
    visual: "jiahu-vessel"
  },
  {
    id: "qu",
    startMs: 28_000,
    endMs: 39_000,
    chapter: "04 / 酒曲",
    title: "边糖化，边发酵",
    subtitle:
      "黄酒的关键在酒曲。微生物让淀粉转化为糖，再继续生成酒精；糖化与发酵协同推进，形成独特的中国谷物酿造道路。",
    sourceLabel: "Huangjiu microbial diversity and flavor review",
    sourceUrl:
      "https://www.sciencedirect.com/science/article/abs/pii/S2214799321000394",
    visual: "qu-fermentation"
  },
  {
    id: "song-yuan",
    startMs: 39_000,
    endMs: 49_000,
    chapter: "05 / 宋元明清",
    title: "工艺继续发展，形态逐渐稳定",
    subtitle:
      "宋代仍同时酿制清酒与浊酒，工艺继续改进。到元代，发酵酒全面进入黄酒阶段；明清两代继续沿这一体系发展。",
    sourceLabel: "江南大学传统酿造研究中心 · 黄酒的发展历程",
    sourceUrl:
      "https://rctff.jiangnan.edu.cn/info/1071/1652.htm",
    visual: "song-yuan"
  },
  {
    id: "fujian",
    startMs: 49_000,
    endMs: 60_000,
    chapter: "06 / 回到福建",
    title: "红曲写下地方的一支",
    subtitle:
      "回到福建，红曲写下黄酒地方传统的一支，也把颜色、滋味和家的记忆留进酒里。酒会饮尽，酿酒的人和他们的故事，不该消失。",
    sourceLabel: "福建省人民政府 · 福建红曲黄酒传统",
    sourceUrl:
      "https://www.fujian.gov.cn/zwgk/ztzl/sxzygwzxsgzx/flsxkmh/202501/t20250109_6620349.htm",
    visual: "fujian-hongqu"
  }
];

export function filmSegmentAt(
  currentMs: number
): HuangjiuFilmSegment {
  return (
    huangjiuFilmSegments.find(
      (segment) =>
        currentMs >= segment.startMs && currentMs < segment.endMs
    ) ?? huangjiuFilmSegments[huangjiuFilmSegments.length - 1]!
  );
}
