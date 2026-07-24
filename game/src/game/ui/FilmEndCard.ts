import Phaser from "phaser";
import { advancedWrap } from "./textWrap";

export type FilmSourceLink = {
  label: string;
  url: string;
};

type FilmEndCardOptions = {
  title: string;
  subtitle: string;
  disclaimer: string;
  accent: number;
  accentCss: string;
  sources: FilmSourceLink[];
  onComplete: () => void;
  onReplay: () => void;
};

export function openFilmSource(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function showFilmEndCard(
  scene: Phaser.Scene,
  options: FilmEndCardOptions
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0).setDepth(20_000);
  const back = scene.add
    .rectangle(0, 0, 640, 360, 0x171516, 1)
    .setOrigin(0);
  const panel = scene.add
    .rectangle(28, 22, 584, 316, 0x262223, 1)
    .setOrigin(0)
    .setStrokeStyle(2, options.accent);
  const eyebrow = scene.add.text(50, 40, "FILM / SOURCES", {
    fontFamily: '"Cascadia Mono", Consolas, monospace',
    fontSize: "8px",
    color: options.accentCss
  });
  const title = scene.add.text(50, 61, options.title, {
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: "20px",
    color: "#F0E4CA",
    ...advancedWrap(536)
  });
  const subtitle = scene.add.text(50, 91, options.subtitle, {
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: "9px",
    color: "#AFC3BD",
    ...advancedWrap(536)
  });
  container.add([back, panel, eyebrow, title, subtitle]);

  let sourceY = 122;
  options.sources.slice(0, 5).forEach((source, index) => {
    const sourceText = scene.add
      .text(50, sourceY, `${index + 1}. ${source.label}`, {
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", sans-serif',
        fontSize: "8px",
        color: "#D6E1D5",
        backgroundColor: "#3A302B",
        padding: { x: 7, y: 4 },
        fixedWidth: 540,
        lineSpacing: 1,
        ...advancedWrap(526)
      })
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => sourceText.setColor(options.accentCss))
      .on("pointerout", () => sourceText.setColor("#D6E1D5"))
      .on("pointerup", () => openFilmSource(source.url));
    container.add(sourceText);
    sourceY += Math.max(23, sourceText.height + 3);
  });

  const complete = scene.add
    .text(50, 263, "ENTER  完成章节", {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "10px",
      color: "#F0E4CA",
      backgroundColor: options.accentCss,
      padding: { x: 11, y: 7 }
    })
    .setInteractive({ useHandCursor: true })
    .on("pointerup", options.onComplete);
  const replay = scene.add
    .text(194, 269, "R  重看片段", {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "9px",
      color: "#D6E1D5"
    })
    .setInteractive({ useHandCursor: true })
    .on("pointerup", options.onReplay);
  const sourceHint = scene.add.text(
    314,
    269,
    "O  打开首条资料来源",
    {
      fontFamily: '"Microsoft YaHei", sans-serif',
      fontSize: "9px",
      color: "#D6E1D5"
    }
  );
  const disclaimer = scene.add.text(50, 307, options.disclaimer, {
    fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: "8px",
    color: "#839CA0",
    lineSpacing: 1,
    ...advancedWrap(536)
  });
  container.add([
    complete,
    replay,
    sourceHint,
    disclaimer
  ]);
  return container;
}
