export class FilmTimeline {
  private elapsedMs = 0;
  private isPaused = false;
  private isEnded = false;
  private wasSkipped = false;

  constructor(readonly durationMs: number) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error("Film duration must be positive");
    }
  }

  get currentMs(): number {
    return this.elapsedMs;
  }

  get progress(): number {
    return this.elapsedMs / this.durationMs;
  }

  get paused(): boolean {
    return this.isPaused;
  }

  get ended(): boolean {
    return this.isEnded;
  }

  get skipped(): boolean {
    return this.wasSkipped;
  }

  tick(deltaMs: number): void {
    if (
      this.isPaused ||
      this.isEnded ||
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0
    ) {
      return;
    }
    this.elapsedMs = Math.min(
      this.durationMs,
      this.elapsedMs + deltaMs
    );
    if (this.elapsedMs >= this.durationMs) {
      this.isEnded = true;
    }
  }

  togglePause(): void {
    if (this.isEnded) return;
    this.isPaused = !this.isPaused;
  }

  skip(): void {
    if (this.isEnded) return;
    this.elapsedMs = this.durationMs;
    this.isEnded = true;
    this.wasSkipped = true;
  }
}
