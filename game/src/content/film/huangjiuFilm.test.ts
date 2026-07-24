import { describe, expect, it } from "vitest";
import {
  HUANGJIU_FILM_DURATION_MS,
  huangjiuFilmSegments
} from "./huangjiuFilm";

describe("huangjiu epilogue content", () => {
  it("covers one continuous sixty-second timeline", () => {
    expect(huangjiuFilmSegments[0]?.startMs).toBe(0);
    for (let index = 1; index < huangjiuFilmSegments.length; index += 1) {
      expect(huangjiuFilmSegments[index]?.startMs).toBe(
        huangjiuFilmSegments[index - 1]?.endMs
      );
    }
    expect(huangjiuFilmSegments.at(-1)?.endMs).toBe(
      HUANGJIU_FILM_DURATION_MS
    );
    expect(HUANGJIU_FILM_DURATION_MS).toBe(60_000);
  });

  it("makes the Jiahu boundary explicit", () => {
    const script = huangjiuFilmSegments
      .map((segment) => segment.subtitle)
      .join("");

    expect(script).toContain("它并不是今天的黄酒");
  });

  it("uses the approved production narration", () => {
    const script = huangjiuFilmSegments
      .map((segment) => segment.subtitle)
      .join("");

    expect(script).toContain(
      "故事从太婆留下的一坛福建老酒开始"
    );
    expect(script).toContain("谷物与微生物共同完成的酿造酒");
    expect(script).toContain("宋代仍同时酿制清酒与浊酒");
    expect(script).toContain("到元代，发酵酒全面进入黄酒阶段");
    expect(script).toContain("酿酒的人和他们的故事，不该消失");
  });

  it("avoids the rejected absolute claims", () => {
    const script = JSON.stringify(huangjiuFilmSegments);

    expect(script).not.toMatch(
      /最早的黄酒|世界三大古酒|唯一源自中国|由浊转清/
    );
  });

  it("keeps a source label on every factual segment", () => {
    expect(
      huangjiuFilmSegments.every(
        (segment) => segment.sourceLabel.length > 0
      )
    ).toBe(true);
  });

  it("keeps every narration segment below five Han characters per second", () => {
    huangjiuFilmSegments.forEach((segment) => {
      const hanCount =
        segment.subtitle.match(/\p{Script=Han}/gu)?.length ?? 0;
      const seconds = (segment.endMs - segment.startMs) / 1_000;

      expect(hanCount / seconds).toBeLessThan(5);
    });
  });
});
