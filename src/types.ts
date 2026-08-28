export type AnimalCategory = 'farm' | 'wild' | 'aquatic' | 'insects';

export type SoundType = 
  | 'meow' 
  | 'bark' 
  | 'rooster' 
  | 'quack' 
  | 'moo' 
  | 'oink' 
  | 'squeak' 
  | 'roar' 
  | 'trumpet' 
  | 'chirp' 
  | 'ribbit' 
  | 'buzz'
  | 'horse_neigh'
  | 'goat_bleat'
  | 'bear_growl'
  | 'monkey_chat'
  | 'howl'
  | 'splash'
  | 'hiss'
  | 'general';

export interface Animal {
  id: string;
  name: string;
  englishName: string;
  category: AnimalCategory;
  categoryName: string; // e.g. "Gia súc, gia cầm", "Động vật hoang dã", "Sinh vật biển", "Côn trùng & Chim"
  emoji: string;
  imageUrl: string;
  soundType: SoundType;
  soundText: string; // e.g. "Meo meo~"
  funFact: string;
  description: string; // Inspiring, kid-friendly description for speech
  food: string;
  habitat: string;
  specialFeature: string;
  synonyms: string[]; // Keywords and aliases for flexible text input validation
  bgGradient: string;
  borderColor: string;
  textColor: string;
  shadowPathD?: string;
}

export type AppTab = 'quiz' | 'review' | 'learn' | 'memory' | 'ai-owl' | 'badges';

export type QuizType = 'multi_choice' | 'text_input' | 'mixed';

export type DifficultyLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'tong_hop';

export type LessonId = 'bai_1' | 'bai_2' | 'bai_3' | 'bai_all';

export interface QuizQuestion {
  id: string;
  lessonId?: LessonId;
  level?: 'nhan_biet' | 'thong_hieu' | 'van_dung';
  prompt: string;
  animal?: Animal;
  options: {
    text: string;
    animalId?: string;
    imageUrl?: string;
    emoji?: string;
    soundType?: SoundType;
  }[];
  correctIndex: number;
  explanation: string;
  audioPromptText?: string;
  soundTypeToPlay?: SoundType;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requiredCount: number;
  currentCount: number;
}

export interface MemoryCard {
  id: string;
  animalId: string;
  animal: Animal;
  isFlipped: boolean;
  isMatched: boolean;
}


