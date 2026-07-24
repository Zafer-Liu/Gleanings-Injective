export type FilmAudioState = {
  volume: number;
  muted: boolean;
};

export type FilmAudioAction =
  | { type: "VOLUME_UP" }
  | { type: "VOLUME_DOWN" }
  | { type: "TOGGLE_MUTE" };

const VOLUME_STEP = 0.1;

function clampVolume(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 10) / 10;
}

export function createFilmAudioState(): FilmAudioState {
  return { volume: 1, muted: false };
}

export function reduceFilmAudio(
  state: FilmAudioState,
  action: FilmAudioAction
): FilmAudioState {
  switch (action.type) {
    case "VOLUME_UP":
      return {
        volume: clampVolume(state.volume + VOLUME_STEP),
        muted: false
      };
    case "VOLUME_DOWN":
      return {
        volume: clampVolume(state.volume - VOLUME_STEP),
        muted: false
      };
    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted };
  }
}

export function filmAudioLabel(state: FilmAudioState): string {
  return state.muted
    ? "静音"
    : `音量 ${Math.round(state.volume * 100)}%`;
}
