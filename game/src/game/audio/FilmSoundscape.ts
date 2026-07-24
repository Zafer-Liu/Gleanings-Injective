const BASE_GAIN = 0.012;

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export class FilmSoundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private readonly oscillators: OscillatorNode[] = [];

  start(): void {
    if (this.context !== null) return;
    const AudioContextClass =
      window.AudioContext ??
      (window as WebkitAudioWindow).webkitAudioContext;
    if (AudioContextClass === undefined) return;
    try {
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = BASE_GAIN;
      this.master.connect(this.context.destination);
      [
        { frequency: 110, detune: -5 },
        { frequency: 164.81, detune: 4 }
      ].forEach(({ frequency, detune }) => {
        const oscillator = this.context!.createOscillator();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = detune;
        oscillator.connect(this.master!);
        oscillator.start();
        this.oscillators.push(oscillator);
      });
      void this.context.resume().catch(() => undefined);
    } catch {
      this.stop();
    }
  }

  setLevel(volume: number, muted: boolean): void {
    if (this.context === null || this.master === null) return;
    const value = muted ? 0 : BASE_GAIN * volume;
    this.master.gain.setTargetAtTime(
      value,
      this.context.currentTime,
      0.04
    );
  }

  setPaused(paused: boolean): void {
    if (this.context === null) return;
    const operation = paused
      ? this.context.suspend()
      : this.context.resume();
    void operation.catch(() => undefined);
  }

  stop(): void {
    this.oscillators.splice(0).forEach((oscillator) => {
      try {
        oscillator.stop();
      } catch {
        // The node may already have been stopped during scene shutdown.
      }
    });
    const context = this.context;
    this.context = null;
    this.master = null;
    if (context !== null) {
      void context.close().catch(() => undefined);
    }
  }
}
