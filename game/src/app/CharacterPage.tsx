import { useState, type CSSProperties } from "react";

type CharacterProfile = {
  id: string;
  name: string;
  englishName: string;
  role: string;
  era: string;
  chapter: string;
  region: string;
  quote: string;
  story: string;
  belief: string;
  culture: string[];
  sprite?: string;
  seal: string;
  accent: string;
};

const CHARACTER_PROFILES: CharacterProfile[] = [
  {
    id: "nianan",
    name: "林念安",
    englishName: "NIAN'AN LIN",
    role: "拾遗人 / Yi · 记忆见证人",
    era: "当代",
    chapter: "贯穿人物",
    region: "福建家族 / 海外生活",
    quote: "我想先听它把来处讲完。",
    story:
      "念安在海外长大，是家族迁徙后的第三代。她的中文不算流利，对福建老酒最深的印象，只是太婆灶台边那股温热的红色气味。太婆过世后，她把最后一箱遗物搁置了三个月，也把想家这件事搁置了更久。直到一张字条和一坛封着红布的老酒重新打开家族记忆，她才开始以“拾遗人 / Yi”的身份，整理散落在民间的旧物与来处。",
    belief: "记忆可以指路，但不能代替求证。",
    culture: ["海外华人", "家族迁徙", "旧物记忆"],
    sprite: "/sprites/spr_yi_walk_96x192.png",
    seal: "念",
    accent: "#b94a3e"
  },
  {
    id: "mia",
    name: "米娅",
    englishName: "MIA",
    role: "海外室友 · 出海的镜子",
    era: "当代",
    chapter: "第一、二章",
    region: "拾遗馆",
    quote: "你去看记忆，我替你守住现在。",
    story:
      "Mia 是念安在海外的室友和朋友。她对那坛“奇怪的红色的酒”充满好奇，却不只是负责惊叹的旁观者。念安第一次试着向她解释老酒、太婆与家族记忆，也第一次主动把自己的文化讲给另一个经验世界。后来，她成为拾遗馆的同行者：提出自然的问题、核对现代记录，并在念安进入旧物记忆时守住现实现场。",
    belief: "好的问题，比抢先给出的答案更重要。",
    culture: ["公众视角", "档案核对", "跨文化沟通"],
    sprite: "/sprites/spr_mia_walk_96x192.png",
    seal: "米",
    accent: "#6c8b8a"
  },
  {
    id: "taipo",
    name: "林阿嫲",
    englishName: "LIN AMA",
    role: "太婆 · 酿造者与守坛人",
    era: "二十世纪",
    chapter: "第一章 · 福建老酒",
    region: "福建",
    quote: "等你想家了，就开。",
    story:
      "林阿嫲是福建老酒的酿造者与守坛人，也是贯穿第一章数十年记忆的灵魂人物。少女时，她跟着阿凤师学红曲与冬酿；成为母亲后，她用红糟与老酒维持一家人的日常；女儿阿珍生产时，她又在灶前煮下一碗长长的老酒面线。她话不多、手很稳，把爱酿进酒里、炖进汤里。埋下的那坛酒，最终成为写给后人的一封信。",
    belief: "传统不是被保存的姿势，而是继续照料人的方法。",
    culture: ["古田红曲", "福建冬酿", "三代家书"],
    sprite: "/sprites/spr_taipo_middle_walk_96x192.png",
    seal: "婆",
    accent: "#a83b32"
  },
  {
    id: "afeng",
    name: "阿凤师",
    englishName: "MASTER AFENG",
    role: "冬酿师傅 · 手艺引路人",
    era: "太婆青年时期",
    chapter: "第一章 · 酒坊记忆",
    region: "福建酒坊",
    quote: "等不及的人，酿不出老酒。",
    story:
      "阿凤师是太婆年轻时的酿酒师傅，也是熟悉古田红曲的老手艺人。他严、直，教少女阿嫲辨红曲、看陶坛，从霜降拌曲、立冬下缸一直等到冬至封坛。他代表的不是神秘配方，而是工艺与耐心：红曲是活的，闽地的冬天有多冷，它就睡得有多沉。那枚冬酿曲印，后来成为跨越几代人的文化坐标。",
    belief: "手艺有步骤，味道却属于地方。",
    culture: ["红曲", "冬酿工序", "地方风土"],
    sprite: "/sprites/spr_afeng_walk_96x192.png",
    seal: "凤",
    accent: "#c18445"
  },
  {
    id: "azhen",
    name: "阿珍",
    englishName: "AZHEN",
    role: "太婆之女 · 家族中的新母亲",
    era: "太婆中年时期",
    chapter: "第一章 · 灶火记忆",
    region: "福建家中",
    quote: "这碗面里的酒味，和小时候一样。",
    story:
      "阿珍是林阿嫲的女儿，也是念安的祖母。她刚生产不久，太婆在灶台前为她准备老酒面线：碗、长面线和一勺老酒，一样样收拢成一顿温热的照料。被这碗汤喂养的婴儿，正是念安的父亲或母亲。她让“一坛酒”与主角自己的存在直接相连，也让传统落回家人真正需要被照顾的时刻。",
    belief: "被照料过的人，会把温度继续传下去。",
    culture: ["月子食俗", "老酒面线", "女性记忆"],
    sprite: "/sprites/spr_azhen_walk_96x192.png",
    seal: "珍",
    accent: "#b66f62"
  },
  {
    id: "shouyi",
    name: "陈守一",
    englishName: "CHEN SHOUYI",
    role: "老茶师 · 来处守护人",
    era: "当代 / 青年记忆",
    chapter: "第二章 · 一叶来处",
    region: "杭州茶坊",
    quote: "叶子能压成一样的形，来处压不出来。",
    story:
      "陈守一曾以为摘下招牌、封住炒锅，就能让被冒用的姓名和旧签样随时间消失。十二年前，他拒绝为来路不明的原料签字，却没能阻止旧批号继续流传。念安与米娅带来的两只同号茶罐迫使他重新面对沉默的后果。故事最后，他擦净铁锅，决定把第一堂公开课留给“如何追问一片叶的来处”。",
    belief: "形状可以模仿，名称必须对来处负责。",
    culture: ["龙井茶", "手工炒制", "地理来源"],
    seal: "守",
    accent: "#71865a"
  },
  {
    id: "master-he",
    name: "何师傅",
    englishName: "MASTER HE",
    role: "炒茶师傅 · 观察的老师",
    era: "陈守一青年时期",
    chapter: "第二章 · 茶园记忆",
    region: "杭州茶园",
    quote: "先问这一片叶，该不该在今天离开枝头。",
    story:
      "何师傅教青年陈守一采摘与炒制，却很少直接说出标准答案。他让徒弟看天气、摸叶片、听锅里的声音，再决定下一双手该做什么。严格并不等于刻板，他真正传下去的不是招式，而是一种对材料、时令和命名保持敬畏的判断方式。",
    belief: "真正的技艺，是在变化中作出有根据的判断。",
    culture: ["采摘时令", "十大手法", "师徒传承"],
    seal: "何",
    accent: "#8a7650"
  }
];

export function CharacterPage() {
  const [selectedId, setSelectedId] = useState(CHARACTER_PROFILES[0].id);
  const selected =
    CHARACTER_PROFILES.find((profile) => profile.id === selectedId) ??
    CHARACTER_PROFILES[0];

  return (
    <main className="character-page" style={{ "--character-accent": selected.accent } as CSSProperties}>
      <div className="character-page__grain" aria-hidden="true" />
      <nav className="character-nav" aria-label="人物志导航">
        <a className="brand" href="/" aria-label="返回拾遗主页">
          <span className="brand-seal">拾</span>
          <span><strong>拾遗</strong><small>GLEANINGS</small></span>
        </a>
        <p>CHARACTER ARCHIVE / 人物志</p>
        <a className="character-nav__back" href="/">← 返回主页</a>
      </nav>

      <section className="character-hero" aria-live="polite">
        <div className="character-portrait" aria-label={`${selected.name}角色像素肖像`}>
          <span className="character-portrait__index">人物 · {String(CHARACTER_PROFILES.indexOf(selected) + 1).padStart(2, "0")}</span>
          {selected.sprite ? (
            <span
              className="character-sprite"
              style={{ backgroundImage: `url(${selected.sprite})` }}
              role="img"
              aria-label={selected.name}
            />
          ) : (
            <span className="character-portrait__seal">{selected.seal}</span>
          )}
          <span className="character-portrait__name" aria-hidden="true">{selected.name}</span>
        </div>

        <article className="character-profile">
          <p className="character-profile__chapter">{selected.chapter}</p>
          <div className="character-profile__title">
            <span className="character-profile__seal">{selected.seal}</span>
            <div>
              <h1>{selected.name}</h1>
              <p>{selected.englishName}</p>
            </div>
          </div>
          <p className="character-profile__role">{selected.role}</p>
          <blockquote>“{selected.quote}”</blockquote>
          <p className="character-profile__story">{selected.story}</p>
          <dl className="character-facts">
            <div><dt>时代</dt><dd>{selected.era}</dd></div>
            <div><dt>地域</dt><dd>{selected.region}</dd></div>
            <div><dt>核心信念</dt><dd>{selected.belief}</dd></div>
          </dl>
          <div className="character-tags" aria-label="文化关键词">
            {selected.culture.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <p className="character-profile__verification">
            文化设定依据项目内容设计；涉及红曲、冬酿、月子面线等史实的正式文案，发布前需完成品牌与文化口径核对。
          </p>
        </article>
      </section>

      <section className="character-roster" aria-labelledby="character-roster-title">
        <header>
          <p>THE PEOPLE BEHIND THE OBJECTS</p>
          <h2 id="character-roster-title">物件背后，是一代代具体的人</h2>
        </header>
        <div className="character-roster__list">
          {CHARACTER_PROFILES.map((profile, index) => (
            <button
              className={profile.id === selected.id ? "is-active" : ""}
              type="button"
              key={profile.id}
              onClick={() => setSelectedId(profile.id)}
              aria-pressed={profile.id === selected.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{profile.name}</strong>
              <small>{profile.role}</small>
              <em>{profile.chapter}</em>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
