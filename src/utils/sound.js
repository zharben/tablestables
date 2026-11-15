// Kid-friendly Web Audio API sound effects (zero external dependencies)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, delay = 0, volume = 0.15) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + delay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  playTap() {
    this.playTone(520, 'triangle', 0.06, 0, 0.1);
  }

  playSelect() {
    this.playTone(640, 'sine', 0.08, 0, 0.12);
  }

  playCorrect(streak = 1) {
    // Rising cheerful arpeggio that pitches slightly higher on streaks
    const boost = Math.min(streak - 1, 6) * 25;
    this.playTone(523.25 + boost, 'triangle', 0.11, 0, 0.16);    // C5
    this.playTone(659.25 + boost, 'triangle', 0.11, 0.07, 0.16); // E5
    this.playTone(783.99 + boost, 'triangle', 0.18, 0.14, 0.18); // G5
  }

  playWrong() {
    this.playTone(240, 'sawtooth', 0.14, 0, 0.1);
    this.playTone(195, 'sawtooth', 0.2, 0.1, 0.1);
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 'triangle', 0.22, idx * 0.09, 0.18);
    });
  }
}

export const sound = new SoundManager();
