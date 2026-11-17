class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delaySec = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio errors on restricted autoplay browsers
    }
  }

  playTap() {
    this.playTone(540, 0.06, 'triangle', 0.06);
  }

  playTick() {
    this.playTone(880, 0.04, 'sine', 0.035);
  }

  playSuccess() {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.08, 0.08);
    this.playTone(783.99, 0.22, 'triangle', 0.09, 0.16);
  }

  playCombo() {
    this.playTone(587.33, 0.1, 'sine', 0.08, 0);
    this.playTone(739.99, 0.1, 'sine', 0.08, 0.07);
    this.playTone(880, 0.12, 'sine', 0.09, 0.14);
    this.playTone(1174.66, 0.26, 'triangle', 0.1, 0.21);
  }

  playFail() {
    this.playTone(260, 0.16, 'sawtooth', 0.06, 0);
    this.playTone(185, 0.26, 'sawtooth', 0.06, 0.13);
  }

  playDuelStart() {
    this.playTone(440, 0.1, 'triangle', 0.07, 0);
    this.playTone(554.37, 0.1, 'triangle', 0.07, 0.09);
    this.playTone(659.25, 0.18, 'triangle', 0.08, 0.18);
  }
}

export const soundFX = new SoundEngine();
