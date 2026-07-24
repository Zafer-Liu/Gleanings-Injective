import { describe, expect, it } from "vitest";
import {
  LONGJING_FILM_DURATION_MS,
  longjingFilmSegments
} from "./longjingFilm";

describe("Longjing epilogue content", () => {
  it("covers one continuous sixty-second timeline", () => {
    expect(longjingFilmSegments).toHaveLength(6);
    expect(longjingFilmSegments[0]?.startMs).toBe(0);
    longjingFilmSegments.slice(1).forEach((segment, index) => {
      expect(segment.startMs).toBe(
        longjingFilmSegments[index]?.endMs
      );
    });
    expect(longjingFilmSegments.at(-1)?.endMs).toBe(
      LONGJING_FILM_DURATION_MS
    );
    expect(LONGJING_FILM_DURATION_MS).toBe(60_000);
  });

  it("distinguishes Longjing tea from West Lake Longjing", () => {
    const script = longjingFilmSegments
      .map((segment) => segment.subtitle)
      .join("");

    expect(script).toContain("西湖、钱塘、越州三个产区");
    expect(script).toContain("规定的西湖保护产区");
    expect(script).toContain("外形可以模仿");
  });

  it("labels the imperial tea trees as a legend", () => {
    const history = longjingFilmSegments.find(
      (segment) => segment.id === "history"
    );

    expect(history?.subtitle).toContain("那是一则传说");
    expect(history?.factLabel).toBe("十八棵御茶：相关传说");
  });

  it("names the UNESCO element precisely", () => {
    const script = JSON.stringify(longjingFilmSegments);

    expect(script).toContain("中国传统制茶技艺及其相关习俗");
    expect(script).not.toContain("西湖龙井单独申遗");
  });

  it("uses all ten named hand techniques without calling them a fixed combo", () => {
    const craft = longjingFilmSegments.find(
      (segment) => segment.id === "craft"
    );

    expect(craft?.subtitle).toContain(
      "抖、带、挤、甩、挺、拓、扣、抓、压、磨"
    );
    expect(craft?.subtitle).toContain("不是固定顺序");
  });

  it("keeps a source on every factual segment", () => {
    expect(
      longjingFilmSegments
        .slice(1)
        .every(
          (segment) =>
            segment.sourceLabel.length > 0 &&
            segment.sourceUrl.startsWith("https://")
      )
    ).toBe(true);
  });

  it("keeps every narration segment below five Han characters per second", () => {
    longjingFilmSegments.forEach((segment) => {
      const hanCount =
        segment.subtitle.match(/\p{Script=Han}/gu)?.length ?? 0;
      const seconds = (segment.endMs - segment.startMs) / 1_000;

      expect(hanCount / seconds).toBeLessThan(5);
    });
  });
});
