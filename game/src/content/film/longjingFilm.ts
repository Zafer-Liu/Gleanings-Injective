export const LONGJING_FILM_DURATION_MS = 60_000;

export type LongjingFilmVisual =
  | "restart-pan"
  | "three-regions"
  | "history-legend"
  | "hand-craft"
  | "trace-origin"
  | "living-heritage";

export type LongjingFilmSegment = {
  id: string;
  startMs: number;
  endMs: number;
  chapter: string;
  title: string;
  subtitle: string;
  factLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  visual: LongjingFilmVisual;
};

export const longjingFilmSegments: LongjingFilmSegment[] = [
  {
    id: "opening",
    startMs: 0,
    endMs: 8_000,
    chapter: "01 / 重新开锅",
    title: "一片叶回到掌心",
    subtitle:
      "陈守一重新点起炉火。一片茶叶落进锅里，也把我们带回它真正的来处。",
    factLabel: "剧情人物与具体案件为虚构",
    sourceLabel: "《拾遗》· 第二章剧情",
    sourceUrl:
      "https://www.ihchina.cn/project_details/14605.html",
    visual: "restart-pan"
  },
  {
    id: "regions",
    startMs: 8_000,
    endMs: 18_000,
    chapter: "02 / 名字与地方",
    title: "龙井茶，不只一个产区",
    subtitle:
      "龙井茶有西湖、钱塘、越州三个产区。来自规定的西湖保护产区、符合相应要求的茶，才能规范使用“西湖龙井”之名。",
    factLabel: "龙井茶：西湖 / 钱塘 / 越州",
    sourceLabel: "国家林草局 · 龙井茶地理标志资料",
    sourceUrl:
      "https://www.forestry.gov.cn/c/www/ggjjlcy/557530.jhtml",
    visual: "three-regions"
  },
  {
    id: "history",
    startMs: 18_000,
    endMs: 28_000,
    chapter: "03 / 一千多年的茶事",
    title: "从唐代茶事到今日茶名",
    subtitle:
      "西湖龙井源于唐，成名于宋元明，盛于清。狮峰山下“十八棵御茶”流传至今，但那是一则传说，不是龙井茶的发明时刻。",
    factLabel: "十八棵御茶：相关传说",
    sourceLabel: "中国非物质文化遗产网 · 西湖龙井",
    sourceUrl:
      "https://www.ihchina.cn/project_details/14605.html",
    visual: "history-legend"
  },
  {
    id: "craft",
    startMs: 28_000,
    endMs: 41_000,
    chapter: "04 / 一双手与一口锅",
    title: "锅里的叶子才是口令",
    subtitle:
      "鲜叶经过采摘、摊放与锅中炒制。抖、带、挤、甩、挺、拓、扣、抓、压、磨不是固定顺序；制茶人要看叶、听叶、感受温度，再决定怎样落手。",
    factLabel: "西湖龙井采制技艺 / 国家级非遗代表性项目",
    sourceLabel: "中国非物质文化遗产网 · 传统炒制手法",
    sourceUrl:
      "https://www.ihchina.cn/project_details/14605.html",
    visual: "hand-craft"
  },
  {
    id: "trace",
    startMs: 41_000,
    endMs: 49_000,
    chapter: "05 / 外形之外",
    title: "名字需要一条可核对的路",
    subtitle:
      "外形可以模仿，名字也能印在罐上；产地、原料、采制与产销记录，才能共同说明一片茶的来路。",
    factLabel: "外形不能单独证明产地",
    sourceLabel: "杭州市 · 西湖龙井茶保护管理资料",
    sourceUrl:
      "https://zfgb.hangzhou.gov.cn/11/105220253/t117220253054/518854.shtml",
    visual: "trace-origin"
  },
  {
    id: "heritage",
    startMs: 49_000,
    endMs: 60_000,
    chapter: "06 / 活着的手艺",
    title: "让后来的人还能找到来处",
    subtitle:
      "二〇二二年，“中国传统制茶技艺及其相关习俗”列入人类非物质文化遗产代表作名录。手艺活在茶园、锅台、待客和师徒之间。",
    factLabel: "2022 / UNESCO 人类非遗代表作名录",
    sourceLabel: "UNESCO · 中国传统制茶技艺及其相关习俗",
    sourceUrl:
      "https://ich.unesco.org/en/RL/traditional-tea-processing-techniques-and-associated-social-practices-in-china-01884",
    visual: "living-heritage"
  }
];

export function longjingFilmSegmentAt(
  currentMs: number
): LongjingFilmSegment {
  return (
    longjingFilmSegments.find(
      (segment) =>
        currentMs >= segment.startMs && currentMs < segment.endMs
    ) ?? longjingFilmSegments[longjingFilmSegments.length - 1]!
  );
}
