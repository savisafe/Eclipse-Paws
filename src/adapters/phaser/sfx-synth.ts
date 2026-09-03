export class SfxSynth {
  #context: AudioContext | null = null;
  #volume = 0.08;

  setVolume(volume: number): void {
    this.#volume = Math.max(0, Math.min(1, volume)) * 0.1;
  }

  play(frequency: number, durationMs: number, type: OscillatorType = 'sine'): void {
    const context = this.#context ?? new AudioContext();
    this.#context = context;
    void context
      .resume()
      .then(() => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, this.#volume),
          context.currentTime + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + durationMs / 1000 + 0.02);
      })
      .catch(() => undefined);
  }

  close(): void {
    if (this.#context) void this.#context.close();
    this.#context = null;
  }
}
