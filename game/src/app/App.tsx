import { useEffect, useState } from "react";
import { startGame } from "../game/startGame";

const chapters = [
  { number: "02", name: "茶", subtitle: "一叶渡海", mark: "茶" },
  { number: "03", name: "瓷", subtitle: "火与白土", mark: "瓷" },
  { number: "04", name: "丝", subtitle: "万里经纬", mark: "丝" }
];

function GameView({ onExit }: { onExit: () => void }) {
  useEffect(() => {
    const game = startGame("game-root");
    return () => game.destroy(true);
  }, []);

  return (
    <main className="game-shell">
      <header className="game-masthead" aria-label="游戏标题">
        <div>
          <p className="eyebrow">GLEANINGS / ACT 01</p>
          <h1 className="game-title">
            拾遗 <span>· 开坛</span>
          </h1>
        </div>
        <div className="game-masthead__aside">
          <p className="chapter-note">福建老酒 · 一段被封在坛里的家书</p>
          <button className="text-button" type="button" onClick={onExit}>
            ← 返回收藏馆
          </button>
        </div>
      </header>

      <section className="stage-wrap" aria-label="第一幕游戏画面">
        <div className="corner-mark corner-mark--top" aria-hidden="true" />
        <div id="game-root" className="game-frame" data-testid="game-root" />
        <div className="corner-mark corner-mark--bottom" aria-hidden="true" />
      </section>

      <footer className="controls-note">
        <span>移动 WASD / 方向键</span>
        <span>交互 E / 空格</span>
        <span>背包 I</span>
      </footer>
    </main>
  );
}

function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <main className="home">
      <div className="home-grain" aria-hidden="true" />
      <nav className="home-nav" aria-label="主页导航">
        <a className="brand" href="#top" aria-label="拾遗主页">
          <span className="brand-seal">拾</span>
          <span>
            <strong>拾遗</strong>
            <small>GLEANINGS</small>
          </span>
        </a>
        <div className="nav-links">
          <a href="#collection">藏馆</a>
          <a href="#story">缘起</a>
          <button className="nav-start" type="button" onClick={onStart}>
            进入第一章
          </button>
        </div>
      </nav>

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker"><span /> 中国传统事物叙事收藏游戏</p>
          <h1 className="hero-title">
            拾起被遗忘的，
            <br />
            <em>让故事再次发生。</em>
          </h1>
          <p className="hero-intro">
            穿过一件旧物的记忆，亲历它从中国走向世界的故事。
            每一次读懂，都将凝成一枚属于你的文化藏品。
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={onStart}>
              <span>开始第一章</span>
              <b aria-hidden="true">→</b>
            </button>
            <a className="secondary-action" href="#collection">
              探索收藏馆
            </a>
          </div>
          <div className="hero-meta" aria-label="游戏特性">
            <span>纯 2D RPG 探索</span>
            <span>叙事选择</span>
            <span>文化收藏</span>
          </div>
        </div>

        <div className="hero-art" aria-label="第一章福建老酒">
          <div className="orbit orbit--outer" aria-hidden="true" />
          <div className="orbit orbit--inner" aria-hidden="true" />
          <div className="chapter-disc">
            <span className="disc-index">壹</span>
            <img src="/items/it_relic_dongniang_detail_128x128.png" alt="" />
            <div className="disc-glow" aria-hidden="true" />
          </div>
          <div className="floating-note floating-note--top">
            <small>CHAPTER 01</small>
            <strong>福建老酒</strong>
          </div>
          <div className="floating-note floating-note--bottom">
            <span className="pulse-dot" />
            <small>现已开放</small>
          </div>
          <span className="art-character art-character--one">酿</span>
          <span className="art-character art-character--two">忆</span>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>向下探索</span><i />
        </div>
      </section>

      <section id="collection" className="collection-section">
        <header className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION / 藏馆</p>
            <h2>一物一章，一章一世界</h2>
          </div>
          <p>从福建老酒出发，拾起散落在时间里的中国传统事物。</p>
        </header>

        <div className="chapter-grid">
          <button className="chapter-card chapter-card--active" type="button" onClick={onStart}>
            <div className="chapter-card__image">
              <img src="/previews/preview_brewery_gameplay_640x360.png" alt="冬日福建酒坊像素场景" />
              <span>可游玩</span>
            </div>
            <div className="chapter-card__body">
              <small>CHAPTER 01</small>
              <h3>福建老酒 <em>· 冬酿</em></h3>
              <p>一坛越过重洋的家书，揭开红曲与冬日的记忆。</p>
              <b>进入故事 →</b>
            </div>
          </button>

          {chapters.map((chapter) => (
            <article className="chapter-card chapter-card--locked" key={chapter.number}>
              <div className="locked-mark">{chapter.mark}</div>
              <div className="chapter-card__body">
                <small>CHAPTER {chapter.number}</small>
                <h3>{chapter.name} <em>· {chapter.subtitle}</em></h3>
                <p>记忆尚未苏醒</p>
                <b>敬请期待</b>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="story" className="manifesto">
        <p>一件旧物不是过去。</p>
        <h2>当你走进它的故事，<br />传统便有了新的时间。</h2>
        <button type="button" onClick={onStart}>开启第一段记忆 <span>→</span></button>
      </section>

      <footer className="home-footer">
        <div className="brand brand--footer">
          <span className="brand-seal">拾</span>
          <span><strong>拾遗</strong><small>GLEANINGS</small></span>
        </div>
        <p>一部关于中国传统事物走向世界的选集式游戏</p>
        <small>ADVENTUREX 2026</small>
      </footer>
    </main>
  );
}

export function App() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [isPlaying]);

  return isPlaying
    ? <GameView onExit={() => setIsPlaying(false)} />
    : <HomeView onStart={() => setIsPlaying(true)} />;
}
