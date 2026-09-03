/**
 * Web Audio API Sound Synthesizer for Pissing Spot
 * Generates realistic flush, water stream and droplet sounds purely in code.
 */

class SoundController {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.isEnabled) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Přehrát zvuk spláchnutí toalety (whoosh / flush + bubble sweep)
   */
  public playFlush(): void {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. White Noise Buffer for water torrent
      const bufferSize = ctx.sampleRate * 2.2; // 2.2 seconds
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Bandpass filter to simulate rushing water pipe
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 1.8);
      filter.Q.setValueAtTime(3, now);

      // Lowpass filter for heavy drainage
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(800, now);
      lowpass.frequency.exponentialRampToValueAtTime(250, now + 2.0);

      // Gain Envelope
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.7, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.2);

      whiteNoise.connect(filter);
      filter.connect(lowpass);
      lowpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 2.2);

      // 2. Drainage Gurgle Sine Wave
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now + 0.8);
      osc.frequency.linearRampToValueAtTime(65, now + 1.9);

      oscGain.gain.setValueAtTime(0.01, now + 0.8);
      oscGain.gain.linearRampToValueAtTime(0.3, now + 1.2);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.1);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now + 0.8);
      osc.stop(now + 2.1);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  /**
   * Zvuk kapky vody (při volbě kapek hodnocení nebo přidání bodu)
   */
  public playDroplet(): void {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch goes up rapidly (classic water droplet "bloink")
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore audio error
    }
  }
}

export const soundFx = new SoundController();
