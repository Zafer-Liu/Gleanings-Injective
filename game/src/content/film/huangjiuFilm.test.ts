import { describe, expect, it } from "vitest";
import {
  HUANGJIU_FILM_DURATION_MS,
  huangjiuFilmSegments
} from "./huangjiuFilm";

describe("huangjiu epilogue content", () => {
  it("covers one continuous eighty-second timeline", () => {
    expect(huangjiuFilmSegments[0]?.startMs).toBe(0);
    for (let index = 1; index < huangjiuFilmSegments.length; index += 1) {
      expect(huangjiuFilmSegments[index]?.startMs).toBe(
        huangjiuFilmSegments[index - 1]?.endMs
      );
    }
    expect(huangjiuFilmSegments.at(-1)?.endMs).toBe(
      HUANGJIU_FILM_DURATION_MS
    );
    expect(HUANGJIU_FILM_DURATION_MS).toBe(80_000);
  });

  it("makes the Jiahu boundary explicit", () => {
    const script = huangjiuFilmSegments
      .map((segment) => segment.subtitle)
      .join("");

    expect(script).toContain("它并不是今天的黄酒");
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
});
