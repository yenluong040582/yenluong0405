import { SoundType } from '../types';

export const VOICE_CONFIG = {
  profileName: 'Nữ Việt Nam – Dịu dàng, dễ thương',
  lang: 'vi-VN',
  pitch: 1.18, // Sweet, warm, natural gentle feminine pitch
  rate: 0.88,  // Clear, natural cadence for preschoolers
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private cachedViVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.initVoice();
      };
    }
  }

  // Algorithm to select the best natural Vietnamese female voice available on the device
  public initVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Filter all Vietnamese voices
    const viVoices = voices.filter(
      (v) => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.toLowerCase().includes('vie'))
    );

    if (viVoices.length === 0) return null;

    // Score voices to prioritize natural Vietnamese Female voices
    const scoredVoices = viVoices.map((v) => {
      let score = 10;
      const nameLower = v.name.toLowerCase();

      // Top tier: Female named Vietnamese voices across Windows, Edge, Mac, iOS, Android, Chrome
      if (nameLower.includes('hoaimy') || nameLower.includes('hoài my')) {
        score += 100;
      }
      if (nameLower.includes('linh') || nameLower.includes('mai') || nameLower.includes('huong') || nameLower.includes('thao') || nameLower.includes('lan')) {
        score += 85;
      }
      if (nameLower.includes('female') || nameLower.includes('nữ') || nameLower.includes('nu')) {
        score += 60;
      }
      if (nameLower.includes('wavenet-a') || nameLower.includes('neural2-a') || nameLower.includes('standard-a')) {
        score += 70; // Google Vietnamese Female voices
      }
      if (nameLower.includes('natural') || nameLower.includes('online')) {
        score += 40;
      }
      if (nameLower.includes('google')) {
        score += 30;
      }

      // Penalize Male voices (nam, male, minh, wavenet-b, neural2-b)
      if (
        nameLower.includes('nam') ||
        nameLower.includes('male') ||
        nameLower.includes('minh') ||
        nameLower.includes('wavenet-b') ||
        nameLower.includes('neural2-b') ||
        nameLower.includes('standard-b')
      ) {
        score -= 150;
      }

      return { voice: v, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    this.cachedViVoice = scoredVoices[0]?.voice || viVoices[0] || null;
    return this.cachedViVoice;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Pre-process Vietnamese text to optimize kindergarten teacher prosody & remove English
  private prepareTeacherText(text: string): string {
    let clean = text.trim();
    if (!clean) return '';

    // Replace English words & abbreviations with natural Vietnamese
    clean = clean
      .replace(/\bAI\b/g, 'trí tuệ nhân tạo')
      .replace(/\bFlashcard(s)?\b/gi, 'thẻ hình')
      .replace(/\bQuiz\b/gi, 'câu đố vui')
      .replace(/\bMemory\b/gi, 'luyện trí nhớ')
      .replace(/\b16:9\b/g, 'mười sáu chia chín')
      .replace(/(\d+)%/g, '$1 phần trăm')
      .replace(/(\d+)\/(\d+)/g, '$1 trên $2')
      .replace(/\bĐáp án A:/gi, 'Đáp án Á: ')
      .replace(/\bĐáp án B:/gi, 'Đáp án Bê: ')
      .replace(/\bĐáp án C:/gi, 'Đáp án Cê: ')
      .replace(/\bĐáp án D:/gi, 'Đáp án Đê: ')
      .replace(/\(A\)/gi, 'Đáp án Á')
      .replace(/\(B\)/gi, 'Đáp án Bê')
      .replace(/\(C\)/gi, 'Đáp án Cê')
      .replace(/\(D\)/gi, 'Đáp án Đê')
      .replace(/\bCô Lương Thị Ngọc Yến AI\b/gi, 'Cô giáo Lương Thị Ngọc Yến')
      .replace(/\bCô Lương Thị Ngọc Yến\b/gi, 'Cô giáo Lương Thị Ngọc Yến')
      .replace(/\s*•\s*/g, '. ')
      .replace(/\s*—\s*/g, ', ')
      .replace(/\s*–\s*/g, ', ')
      .replace(/\s*:\s*/g, ': ');

    return clean;
  }

  /**
   * Speak Vietnamese text using the default "Nữ Hà Nội – Cô giáo mầm non" voice profile
   */
  public speakVietnamese(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancel any overlapping speech

    const cleanText = this.prepareTeacherText(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate; // 0.85: Gentle, slow and clear for preschoolers
    utterance.pitch = VOICE_CONFIG.pitch; // 1.22: Sweet, caring, gentle Hanoi female teacher tone

    const voice = this.cachedViVoice || this.initVoice();
    if (voice) {
      utterance.voice = voice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  }

  // Synthesize realistic cute animal sounds
  public playAnimalSound(type: SoundType) {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'meow': {
          // Meow: frequency slide from ~600Hz down to ~350Hz with pitch bend up then down
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.5);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        }

        case 'bark': {
          // Woof/Bark: 2 quick low pitches with noise pop
          for (let i = 0; i < 2; i++) {
            const t = now + i * 0.18;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.14);
          }
          break;
        }

        case 'rooster': {
          // Ó ó o o: 3 distinct pitch bursts
          const pitches = [400, 650, 520, 380];
          const times = [0, 0.2, 0.45, 0.75];
          pitches.forEach((freq, idx) => {
            const t = now + times[idx];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.linearRampToValueAtTime(freq * 1.1, t + 0.15);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.23);
          });
          break;
        }

        case 'quack': {
          // Cạc cạc: nasal squawk
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.linearRampToValueAtTime(180, now + 0.25);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.26);
          break;
        }

        case 'moo': {
          // Moo: low resonant pitch hold ~150Hz
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.linearRampToValueAtTime(170, now + 0.3);
          osc.frequency.linearRampToValueAtTime(120, now + 0.9);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.96);
          break;
        }

        case 'oink': {
          // Oink: quick low guttural sound
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.linearRampToValueAtTime(130, now + 0.2);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.23);
          break;
        }

        case 'roar': {
          // Low roaring rumble
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.linearRampToValueAtTime(180, now + 0.3);
          osc.frequency.linearRampToValueAtTime(80, now + 0.8);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.45, now + 0.2);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.88);
          break;
        }

        case 'trumpet': {
          // Elephant trumpet
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(650, now + 0.25);
          osc.frequency.linearRampToValueAtTime(500, now + 0.6);

          gain.gain.setValueAtTime(0.05, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.68);
          break;
        }

        case 'ribbit': {
          // Frog croak
          for (let i = 0; i < 2; i++) {
            const t = now + i * 0.12;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.linearRampToValueAtTime(240, t + 0.08);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
          }
          break;
        }

        case 'buzz': {
          // Bee buzzing
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(240, now);
          osc.frequency.linearRampToValueAtTime(260, now + 0.4);

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.46);
          break;
        }

        default: {
          // Chirp / Squeak default
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1400, now + 0.15);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.22);
          break;
        }
      }
    } catch (e) {
      console.warn("Audio Context playback error", e);
    }
  }

  // Victory / Success Chime for kids (Grand Fanfare & Celebration)
  public playSuccessSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Grand fanfare chords: C5-E5-G5-C6 followed by high celebratory chord arpeggios
      const notes = [
        { freq: 523.25, time: 0.0, duration: 0.2 }, // C5
        { freq: 659.25, time: 0.12, duration: 0.2 }, // E5
        { freq: 783.99, time: 0.24, duration: 0.2 }, // G5
        { freq: 1046.50, time: 0.36, duration: 0.5 }, // C6
        { freq: 1318.51, time: 0.50, duration: 0.6 }, // E6
      ];

      notes.forEach(({ freq, time, duration }) => {
        const t = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + duration + 0.05);
      });

      // Harmonic brassy accent note
      const brass = ctx.createOscillator();
      const brassGain = ctx.createGain();
      brass.type = 'sawtooth';
      brass.frequency.setValueAtTime(1046.50, now + 0.36);
      brassGain.gain.setValueAtTime(0.15, now + 0.36);
      brassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      brass.connect(brassGain);
      brassGain.connect(ctx.destination);
      brass.start(now + 0.36);
      brass.stop(now + 0.95);
    } catch (e) {
      console.warn("Success sound error", e);
    }
  }

  // Wrong Answer Soft & Gentle Encouraging Chime
  public playWrongSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Soft warm dual note chime (F4 to D4)
      const notes = [349.23, 293.66];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch (e) {
      console.warn("Wrong sound error", e);
    }
  }
}

export const soundEngine = new SoundEngine();
