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
  | 'monkey_chat';

export interface Animal {
  id: string;
  name: string;
  englishName: string;
  category: AnimalCategory;
  emoji: string;
  imageUrl: string;
  soundType: SoundType;
  soundText: string; // e.g. "Meo meo~"
  funFact: string;
  food: string;
  habitat: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  shadowPathD?: string; // Custom SVG silhouette path or shape type
}

export type AppTab = 'review' | 'learn' | 'quiz' | 'memory' | 'ai-owl' | 'badges';

export type QuizType = 'sound' | 'name' | 'shadow';

export type DifficultyLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'tong_hop';

export type LessonId = 'bai_1' | 'bai_2' | 'bai_3' | 'bai_all';

export interface QuizQuestion {
  id: string;
  lessonId: LessonId;
  level: 'nhan_biet' | 'thong_hieu' | 'van_dung';
  prompt: string;
  options: {
    text: string;
    animalId?: string;
    imageUrl?: string;
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
  id: string; // Unique instance ID
  animalId: string;
  animal: Animal;
  isFlipped: boolean;
  isMatched: boolean;
}

