import { describe, expect, it } from "vitest";
import {
  createFilmAudioState,
  filmAudioLabel,
  reduceFilmAudio
} from "./FilmAudioControl";

describe("film audio controls", () => {
  it("adjusts volume in bounded ten-percent steps", () => {
    let state = createFilmAudioState();
    state = reduceFilmAudio(state, { type: "VOLUME_DOWN" });
    expect(state).toEqual({ volume: 0.9, muted: false });

    for (let index = 0; index < 12; index += 1) {
      state = reduceFilmAudio(state, { type: "VOLUME_DOWN" });
    }
    expect(state.volume).toBe(0);

    state = reduceFilmAudio(state, { type: "VOLUME_UP" });
    expect(state).toEqual({ volume: 0.1, muted: false });
  });

  it("toggles mute without losing the selected volume", () => {
    const state = reduceFilmAudio(
      { volume: 0.6, muted: false },
      { type: "TOGGLE_MUTE" }
    );

    expect(state).toEqual({ volume: 0.6, muted: true });
    expect(filmAudioLabel(state)).toBe("静音");
    expect(
      filmAudioLabel({ volume: 0.6, muted: false })
    ).toBe("音量 60%");
  });
});
