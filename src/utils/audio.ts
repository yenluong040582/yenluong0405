import { SoundType } from '../types';

// Cấu hình âm sắc giọng Nữ chuẩn: Dịu dàng, trong trẻo, ấm áp với nhịp độ rate: 0.88, pitch: 1.2
export const VOICE_CONFIG = {
  profileName: 'Giọng Nữ Việt Nam – Cô giáo mầm non',
  lang: 'vi-VN',
  pitch: 1.2,  // Dịu dàng, trong trẻo, ấm áp chuẩn phong cách cô giáo mầm non
  rate: 0.88,  // Nhịp độ 0.88: Chậm rãi, ngắt nghỉ rõ ràng, truyền cảm hứng cho các bé
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private cachedViVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedViVoice = null;
        this.initVoice();
      };
    }
  }

  // Thuật toán ưu tiên 100% chọn giọng Nữ Việt Nam chuẩn (Microsoft Hoài My, Google Wavenet-A / Neural2-A / Natural Vi)
  public initVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Lọc tất cả giọng tiếng Việt
    const viVoices = voices.filter(
      (v) => v.lang && (v.lang.toLowerCase().includes('vi') || v.lang.toLowerCase().includes('vie') || v.lang.toLowerCase() === 'vi-vn')
    );

    // Danh sách từ khóa giọng NỮ Việt Nam (Microsoft Hoài My, Google Wavenet-A, Neural2-A, Natural Vi, Mai, Linh, Hương...)
    const femaleKeywords = [
      'hoaimy', 'hoài my', 'wavenet-a', 'neural2-a', 'natural', 'online', 'wavenet-c', 'neural2-c',
      'mai', 'linh', 'huong', 'hương', 'thao', 'thảo', 'lan', 'chi', 'ngoc', 'ngọc', 
      'yen', 'yến', 'trang', 'nhung', 'hang', 'hằng', 'vy', 'female', 'nữ', 'nu', 'standard-a', 'standard-c'
    ];

    // Danh sách từ khóa giọng NAM cần LOẠI BỎ tuyệt đối
    const maleKeywords = [
      'nam', 'male', 'minh', 'nam-ha-noi', 'wavenet-b', 'wavenet-d', 
      'neural2-b', 'neural2-d', 'standard-b', 'standard-d', 'david', 'guy', 
      'george', 'paul', 'mark', 'alex', 'daniel', 'fred'
    ];

    if (viVoices.length > 0) {
      // Lọc trước: bỏ các giọng có từ khóa nam rõ ràng nếu có giọng khác
      const nonMaleViVoices = viVoices.filter((v) => {
        const nameLower = v.name.toLowerCase();
        return !maleKeywords.some((mk) => nameLower.includes(mk));
      });

      const candidatePool = nonMaleViVoices.length > 0 ? nonMaleViVoices : viVoices;

      // Chấm điểm ưu tiên các giọng nữ chất lượng cao nhất: Microsoft Hoài My > Google Wavenet-A / Neural2-A / Natural Vi
      const scoredVoices = candidatePool.map((v) => {
        let score = 10;
        const nameLower = v.name.toLowerCase();

        // 1. Giọng Microsoft Hoài My (giọng nữ tự nhiên hàng đầu trên Windows/Edge)
        if (nameLower.includes('hoaimy') || nameLower.includes('hoài my')) {
          score += 300;
        }
        // 2. Giọng Google Wavenet-A / Neural2-A / Natural Vi
        if (nameLower.includes('wavenet-a') || nameLower.includes('neural2-a')) {
          score += 250;
        }
        if (nameLower.includes('natural') && (nameLower.includes('vi') || nameLower.includes('vietnam'))) {
          score += 200;
        }
        // 3. Giọng nữ tên Việt Nam (Mai, Linh, Hương, Thảo...)
        if (femaleKeywords.some((fk) => nameLower.includes(fk))) {
          score += 100;
        }
        if (nameLower.includes('google')) {
          score += 50;
        }

        // Trừ điểm nặng nếu có dấu hiệu giọng nam
        if (maleKeywords.some((mk) => nameLower.includes(mk))) {
          score -= 500;
        }

        return { voice: v, score };
      });

      scoredVoices.sort((a, b) => b.score - a.score);
      this.cachedViVoice = scoredVoices[0]?.voice || candidatePool[0] || null;
      return this.cachedViVoice;
    }

    // Nếu thiết bị chưa cài sẵn gói giọng tiếng Việt, tìm giọng nữ bất kỳ với pitch cao để đọc
    const femaleFallback = voices.find(
      (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha')
    );
    this.cachedViVoice = femaleFallback || null;
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

  private currentPcmSource: AudioBufferSourceNode | null = null;

  /**
   * Stop any current playing audio (PCM or Web Speech)
   */
  public stopAllSpeech() {
    try {
      if (this.currentPcmSource) {
        this.currentPcmSource.stop();
        this.currentPcmSource = null;
      }
    } catch (e) {
      // ignore
    }
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      // ignore
    }
  }

  /**
   * Play 24kHz raw PCM Audio returned from Gemini TTS models
   */
  public playPcmAudio(base64Pcm: string, sampleRate = 24000, onEnd?: () => void) {
    try {
      this.stopAllSpeech();

      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const ctx = this.getContext();
      const buffer = ctx.createBuffer(1, float32Array.length, sampleRate);
      buffer.copyToChannel(float32Array, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      this.currentPcmSource = source;

      source.onended = () => {
        if (this.currentPcmSource === source) {
          this.currentPcmSource = null;
        }
        if (onEnd) onEnd();
      };
      source.start();
      return source;
    } catch (e) {
      console.warn("PCM audio playback error", e);
      return null;
    }
  }

  /**
   * Speak using Gemini TTS (gemini-2.5-flash-preview-tts) with instant Vietnamese voice fallback
   */
  public async speakWithGeminiTTS(text: string, onEnd?: () => void) {
    const cleanText = this.prepareTeacherText(text);
    if (!cleanText) return;

    this.stopAllSpeech();

    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          this.playPcmAudio(data.audioBase64, 24000, onEnd);
          return;
        }
      }
    } catch (err) {
      console.warn("Gemini TTS request fallback to Web Speech:", err);
    }

    // Fallback to Vietnamese Speech Synthesis
    this.speakVietnamese(cleanText, onEnd);
  }

  /**
   * Sweet, inspirational introduction of an animal with sound & characteristics in 100% Vietnamese
   */
  public async introduceAnimal(
    animal: {
      name: string;
      englishName?: string;
      specialFeature?: string;
      funFact?: string;
      description?: string;
      food?: string;
      habitat?: string;
      soundText?: string;
    },
    onEnd?: () => void
  ) {
    this.stopAllSpeech();

    // Try intelligent AI animal speech generation with Gemini TTS
    try {
      const res = await fetch('/api/gemini/animal-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalName: animal.name,
          specialFeature: animal.specialFeature,
          funFact: animal.funFact || animal.description,
          habitat: animal.habitat,
          food: animal.food,
          soundText: animal.soundText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          this.playPcmAudio(data.audioBase64, 24000, onEnd);
          return;
        }
        if (data.script) {
          this.speakWithGeminiTTS(data.script, onEnd);
          return;
        }
      }
    } catch (e) {
      console.warn("Animal speech request fallback:", e);
    }

    let introSpeech = `Xin chào bé yêu! Đây là bạn ${animal.name}. ${animal.description || animal.funFact || animal.specialFeature || 'Bạn ấy rất đáng yêu và ngoan ngoãn!'}`;
    if (animal.food && animal.habitat) {
      introSpeech += ` Bạn ${animal.name} thích ăn ${animal.food} và sinh sống ở ${animal.habitat}.`;
    }
    if (animal.soundText) {
      introSpeech += ` Tiếng kêu của bạn ấy là ${animal.soundText}!`;
    }
    introSpeech += ' Bé hãy yêu thương và bảo vệ bạn ấy nhé!';
    this.speakWithGeminiTTS(introSpeech, onEnd);
  }

  /**
   * Test sample speech for teacher greeting
   */
  public testTeacherVoice(onEnd?: () => void) {
    const greeting = "Xin chào các bé yêu của cô giáo Lương Thị Ngọc Yến! Chúng mình cùng học và khám phá năm mươi bạn con vật đáng yêu nhé!";
    this.speakWithGeminiTTS(greeting, onEnd);
  }

  // Pre-process Vietnamese text to optimize kindergarten teacher prosody & strictly ensure 100% pure Vietnamese
  private prepareTeacherText(text: string): string {
    let clean = text.trim();
    if (!clean) return '';

    // 1. Tự động loại bỏ hoàn toàn các từ ngữ tiếng Anh, tên phiên âm nước ngoài trong dấu ngoặc đơn (...)
    clean = clean.replace(/\([A-Za-z0-9\s_.,-]+\)/g, ' ');

    // 2. Loại bỏ toàn bộ biểu tượng emoji và ký tự đặc biệt trang trí khi phát âm
    clean = clean.replace(/[\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, '');

    // 3. Chuyển đổi chính xác các đáp án thành phát âm thuần Việt (Đáp án Á, Đáp án Bê, Đáp án Cê, Đáp án Đê)
    clean = clean
      .replace(/\bĐáp án A\b(?!\w)/gi, 'Đáp án Á')
      .replace(/\bĐáp án B\b(?!\w)/gi, 'Đáp án Bê')
      .replace(/\bĐáp án C\b(?!\w)/gi, 'Đáp án Cê')
      .replace(/\bĐáp án D\b(?!\w)/gi, 'Đáp án Đê')
      .replace(/\bCâu A\b(?!\w)/gi, 'Đáp án Á')
      .replace(/\bCâu B\b(?!\w)/gi, 'Đáp án Bê')
      .replace(/\bCâu C\b(?!\w)/gi, 'Đáp án Cê')
      .replace(/\bCâu D\b(?!\w)/gi, 'Đáp án Đê')
      .replace(/\bLựa chọn A\b(?!\w)/gi, 'Đáp án Á')
      .replace(/\bLựa chọn B\b(?!\w)/gi, 'Đáp án Bê')
      .replace(/\bLựa chọn C\b(?!\w)/gi, 'Đáp án Cê')
      .replace(/\bLựa chọn D\b(?!\w)/gi, 'Đáp án Đê')
      .replace(/\bA\s*:\s*/g, 'Đáp án Á: ')
      .replace(/\bB\s*:\s*/g, 'Đáp án Bê: ')
      .replace(/\bC\s*:\s*/g, 'Đáp án Cê: ')
      .replace(/\bD\s*:\s*/g, 'Đáp án Đê: ')
      .replace(/(^|[.\n;])\s*A\.\s*/gi, '$1 Đáp án Á: ')
      .replace(/(^|[.\n;])\s*B\.\s*/gi, '$1 Đáp án Bê: ')
      .replace(/(^|[.\n;])\s*C\.\s*/gi, '$1 Đáp án Cê: ')
      .replace(/(^|[.\n;])\s*D\.\s*/gi, '$1 Đáp án Đê: ');

    // 4. Chuyển đổi chính xác các ký hiệu, điểm số và từ viết tắt sang tiếng Việt tự nhiên
    clean = clean
      .replace(/\bAI\b/gi, 'trí tuệ nhân tạo')
      .replace(/\bTTS\b/gi, 'giọng đọc')
      .replace(/\bFlashcard(s)?\b/gi, 'thẻ hình')
      .replace(/\bQuiz\b/gi, 'câu đố vui')
      .replace(/\bMemory\b/gi, 'luyện trí nhớ')
      .replace(/\bTeacher\b/gi, 'cô giáo')
      .replace(/\bGame\b/gi, 'trò chơi')
      .replace(/\bScore\b/gi, 'điểm')
      .replace(/\bStar(s)?\b/gi, 'ngôi sao')
      .replace(/\bLevel\b/gi, 'cấp độ')
      .replace(/\bHearts\b/gi, 'trái tim')
      .replace(/\b16:9\b/g, 'mười sáu chia chín')
      .replace(/(\d+)\s*%/g, '$1 phần trăm')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 trên $2')
      .replace(/\bCô Lương Thị Ngọc Yến AI\b/gi, 'Cô giáo Lương Thị Ngọc Yến')
      .replace(/\bCô Lương Thị Ngọc Yến\b/gi, 'Cô giáo Lương Thị Ngọc Yến')
      .replace(/\s*•\s*/g, '. ')
      .replace(/\s*—\s*/g, ', ')
      .replace(/\s*–\s*/g, ', ')
      .replace(/\s*:\s*/g, ': ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Speak Vietnamese text using the default "Nữ Việt Nam – Cô giáo mầm non" voice profile
   */
  public speakVietnamese(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any overlapping speech
    } catch (e) {
      // ignore
    }

    const cleanText = this.prepareTeacherText(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = VOICE_CONFIG.lang;
    utterance.rate = VOICE_CONFIG.rate; // 0.88: Gentle, slow and clear for preschoolers
    utterance.pitch = VOICE_CONFIG.pitch; // 1.2: Sweet, caring, gentle female teacher tone

    const voice = this.initVoice() || this.cachedViVoice;
    if (voice) {
      utterance.voice = voice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
    }

    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis speak error", e);
    }
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
