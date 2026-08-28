import React, { useState, useEffect } from 'react';
import { AppTab, Badge } from './types';
import { INITIAL_BADGES } from './data/badges';
import { Header } from './components/Header';
import { ReviewQuizView } from './components/ReviewQuizView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizGameView } from './components/QuizGameView';
import { MemoryGameView } from './components/MemoryGameView';
import { AiTeacherView } from './components/AiTeacherView';
import { BadgesView } from './components/BadgesView';
import { Heart } from 'lucide-react';

export default function App() {
  const [currentTab, setTab] = useState<AppTab>('quiz');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [classNameVal, setClassNameVal] = useState<string>('Chồi 1');
  const [stars, setStars] = useState<number>(50); // Start with 50 stars gift for kids!

  // Tracking progress for badges
  const [exploredAnimalIds, setExploredAnimalIds] = useState<string[]>([]);
  const [quizCorrectCount, setQuizCorrectCount] = useState<number>(0);
  const [soundQuizCorrectCount, setSoundQuizCorrectCount] = useState<number>(0);
  const [memoryGamesWon, setMemoryGamesWon] = useState<number>(0);
  const [askedOwlCount, setAskedOwlCount] = useState<number>(0);

  const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedStars = localStorage.getItem('be_nhan_biet_stars');
      if (savedStars) setStars(parseInt(savedStars, 10));

      const savedExplored = localStorage.getItem('be_nhan_biet_explored');
      if (savedExplored) setExploredAnimalIds(JSON.parse(savedExplored));

      const savedQuiz = localStorage.getItem('be_nhan_biet_quiz_count');
      if (savedQuiz) setQuizCorrectCount(parseInt(savedQuiz, 10));

      const savedClass = localStorage.getItem('be_nhan_biet_class');
      if (savedClass) setClassNameVal(savedClass);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('be_nhan_biet_stars', stars.toString());
      localStorage.setItem('be_nhan_biet_explored', JSON.stringify(exploredAnimalIds));
      localStorage.setItem('be_nhan_biet_quiz_count', quizCorrectCount.toString());
      localStorage.setItem('be_nhan_biet_class', classNameVal);
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [stars, exploredAnimalIds, quizCorrectCount, classNameVal]);

  // Update badges dynamically based on progress
  useEffect(() => {
    setBadges((prevBadges) =>
      prevBadges.map((badge) => {
        let count = 0;
        if (badge.id === 'first_card' || badge.id === 'animal_explorer') {
          count = exploredAnimalIds.length;
        } else if (badge.id === 'quiz_master_5') {
          count = quizCorrectCount;
        } else if (badge.id === 'sound_detective') {
          count = soundQuizCorrectCount;
        } else if (badge.id === 'memory_star') {
          count = memoryGamesWon;
        } else if (badge.id === 'friend_owl') {
          count = askedOwlCount;
        }

        const isUnlocked = badge.unlocked || count >= badge.requiredCount;
        return {
          ...badge,
          currentCount: count,
          unlocked: isUnlocked,
        };
      })
    );
  }, [exploredAnimalIds, quizCorrectCount, soundQuizCorrectCount, memoryGamesWon, askedOwlCount]);

  const handleCardExplored = (animalId: string) => {
    if (!exploredAnimalIds.includes(animalId)) {
      setExploredAnimalIds((prev) => [...prev, animalId]);
      setStars((s) => s + 5);
    }
  };

  const handleQuizCorrect = () => {
    setStars((s) => s + 10);
    setQuizCorrectCount((c) => c + 1);
    setSoundQuizCorrectCount((c) => c + 1);
  };

  const handleReviewCompleted = (score: number) => {
    setStars((s) => s + score * 5);
    setQuizCorrectCount((c) => c + score);
  };

  const handleMemoryGameCompleted = () => {
    setStars((s) => s + 20);
    setMemoryGamesWon((c) => c + 1);
  };

  const handleAskedOwl = () => {
    setStars((s) => s + 5);
    setAskedOwlCount((c) => c + 1);
  };

  const unlockedBadgeCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/70 via-lime-50/40 to-amber-50/70 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Header */}
      <Header
        currentTab={currentTab}
        setTab={setTab}
        stars={stars}
        unlockedBadgeCount={unlockedBadgeCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        classNameVal={classNameVal}
      />

      {/* Main Content View */}
      <main className="max-w-6xl mx-auto px-4 pt-6 pb-12">
        {currentTab === 'quiz' && (
          <QuizGameView
            soundEnabled={soundEnabled}
            onCorrectAnswer={handleQuizCorrect}
          />
        )}

        {currentTab === 'review' && (
          <ReviewQuizView
            soundEnabled={soundEnabled}
            classNameVal={classNameVal}
            setClassNameVal={setClassNameVal}
            onQuizCompleted={handleReviewCompleted}
          />
        )}

        {currentTab === 'learn' && (
          <FlashcardsView
            soundEnabled={soundEnabled}
            onCardExplored={handleCardExplored}
          />
        )}

        {currentTab === 'memory' && (
          <MemoryGameView
            soundEnabled={soundEnabled}
            onGameCompleted={handleMemoryGameCompleted}
          />
        )}

        {currentTab === 'ai-owl' && (
          <AiTeacherView
            soundEnabled={soundEnabled}
            onAskedOwl={handleAskedOwl}
          />
        )}

        {currentTab === 'badges' && (
          <BadgesView
            badges={badges}
            soundEnabled={soundEnabled}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white py-6 text-center text-sm px-4 border-t-4 border-emerald-700 shadow-inner">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-300">
            <Heart className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
            <span className="text-base font-black">
              Ứng Dụng Học Tập 50 Con Vật Cho Trẻ Em — Cô Giáo Lương Thị Ngọc Yến AI
            </span>
          </div>
          <p className="text-emerald-200 text-xs font-semibold">
            Bộ dữ liệu 50 loài động vật • 4 nút trắc nghiệm & Ô nhập tự do • Gemini AI TTS Phát âm tiếng Việt • Pháo hoa ăn mừng & Tặng sao
          </p>
        </div>
      </footer>
    </div>
  );
}

