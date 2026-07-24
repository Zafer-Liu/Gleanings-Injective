import { describe, expect, it } from "vitest";
import { FilmTimeline } from "./FilmTimeline";

describe("FilmTimeline", () => {
  it("advances and clamps at the declared duration", () => {
    const timeline = new FilmTimeline(80_000);

    timeline.tick(12_000);
    timeline.tick(100_000);

    expect(timeline.currentMs).toBe(80_000);
    expect(timeline.progress).toBe(1);
    expect(timeline.ended).toBe(true);
  });

  it("does not advance while paused", () => {
    const timeline = new FilmTimeline(80_000);
    timeline.tick(5_000);
    timeline.togglePause();
    timeline.tick(20_000);

    expect(timeline.currentMs).toBe(5_000);
    expect(timeline.paused).toBe(true);
  });

  it("resumes after a second pause toggle", () => {
    const timeline = new FilmTimeline(80_000);
    timeline.togglePause();
    timeline.togglePause();
    timeline.tick(1_500);

    expect(timeline.currentMs).toBe(1_500);
    expect(timeline.paused).toBe(false);
  });

  it("skips directly to the end", () => {
    const timeline = new FilmTimeline(80_000);

    timeline.skip();

    expect(timeline.currentMs).toBe(80_000);
    expect(timeline.ended).toBe(true);
    expect(timeline.skipped).toBe(true);
  });
});
