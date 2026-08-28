import React, { useState, useEffect, useRef } from 'react';
import { Animal, AnimalCategory } from '../types';
import { ANIMALS_DATA } from '../data/animals';
import { soundEngine } from '../utils/audio';
import { checkAnimalAnswer } from '../utils/textMatcher';
import confetti from 'canvas-confetti';
import {
  Star,
  Heart,
  Trophy,
  Volume2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Send,
  HelpCircle,
  Flame,
  Award,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizGameViewProps {
  soundEnabled: boolean;
  onCorrectAnswer: () => void;
}

type QuestionMode = 'all' | 'farm' | 'wild' | 'aquatic' | 'insects';

export const QuizGameView: React.FC<QuizGameViewProps> = ({ soundEnabled, onCorrectAnswer }) => {
  // Game Setup
  const [categoryFilter, setCategoryFilter] = useState<QuestionMode>('all');
  const [totalQuestionsGoal, setTotalQuestionsGoal] = useState<number>(10); // 10, 20, or 50
  
  // Game State
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(5);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Current Question Data
  const [currentAnimal, setCurrentAnimal] = useState<Animal | null>(null);
  const [mcqOptions, setMcqOptions] = useState<Animal[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [historyAnswers, setHistoryAnswers] = useState<{ animal: Animal; isCorrect: boolean }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter animals based on active category
  const filteredAnimals = React.useMemo(() => {
    if (categoryFilter === 'all') return ANIMALS_DATA;
    return ANIMALS_DATA.filter((a) => a.category === categoryFilter);
  }, [categoryFilter]);

  // Start / Restart the entire game
  const restartGame = () => {
    setQuestionIndex(0);
    setCurrentScore(0);
    setStreak(0);
    setHearts(5);
    setIsGameOver(false);
    setHistoryAnswers([]);
    loadQuestion(0);
  };

  // Load a question by index
  const loadQuestion = (idx: number) => {
    setSelectedOptionId(null);
    setTextInput('');
    setFeedback(null);
    setShowHint(false);

    if (filteredAnimals.length === 0) return;

    // Pick target animal sequentially from shuffled or indexed pool
    const targetIdx = idx % filteredAnimals.length;
    const target = filteredAnimals[targetIdx];
    setCurrentAnimal(target);

    // Pick 3 random distractors from full ANIMALS_DATA
    const otherAnimals = ANIMALS_DATA.filter((a) => a.id !== target.id);
    const shuffledOthers = [...otherAnimals].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);

    // 4 Options: 1 correct + 3 distractors
    const allFour = [target, ...distractors].sort(() => 0.5 - Math.random());
    setMcqOptions(allFour);

    // Prompt voice intro
    if (soundEnabled) {
      setTimeout(() => {
        soundEngine.speakWithGeminiTTS(
          `Đố bé biết đây là con gì nào? Hãy chọn một trong bốn đáp án hoặc tự nhập tên con vật nhé!`
        );
      }, 250);
    }
  };

  // On initial mount or when category changes, reset & load question 0
  useEffect(() => {
    restartGame();
  }, [categoryFilter, totalQuestionsGoal]);

  // Handle playing animal speech introduction
  const handlePlayAnimalVoice = () => {
    if (!currentAnimal || !soundEnabled) return;
    setIsPlayingAudio(true);
    soundEngine.introduceAnimal(currentAnimal, () => {
      setIsPlayingAudio(false);
    });
  };

  // Fire celebratory fireworks
  const triggerFireworks = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#8B5CF6'],
    });
  };

  // Process a user answer (either via clicking MCQ button OR submitting text)
  const processAnswer = (userAnswerTextOrId: string, isFromMcq: boolean) => {
    if (!currentAnimal || feedback !== null) return; // Prevent double submit

    let isCorrect = false;
    let message = '';

    if (isFromMcq) {
      setSelectedOptionId(userAnswerTextOrId);
      isCorrect = userAnswerTextOrId === currentAnimal.id;
      message = isCorrect
        ? `Hoan hô! Bé chọn đúng rồi! Đây là ${currentAnimal.name} (${currentAnimal.englishName})! 🎉`
        : `Chưa đúng rồi! Đây không phải là bạn ấy. Bé thử lại nhé!`;
    } else {
      const matchResult = checkAnimalAnswer(userAnswerTextOrId, currentAnimal);
      isCorrect = matchResult.isCorrect;
      message = matchResult.feedbackMessage;
    }

    if (isCorrect) {
      setCurrentScore((s) => s + 10);
      setStreak((st) => st + 1);
      setFeedback({ isCorrect: true, message });
      setHistoryAnswers((prev) => [...prev, { animal: currentAnimal, isCorrect: true }]);

      if (soundEnabled) {
        soundEngine.playSuccessSound();
        const praiseList = [
          `Tuyệt vời quá! Bé trả lời đúng rồi! Đây là bạn ${currentAnimal.name}!`,
          `Hoan hô con! Bé thật là thông minh và giỏi giang!`,
          `Chính xác rồi! Cô khen bé nhé, bé giỏi lắm!`,
          `Rất xuất sắc! Bé đã nhận biết được bạn ${currentAnimal.name}!`,
        ];
        const randomPraise = praiseList[Math.floor(Math.random() * praiseList.length)];
        setTimeout(() => soundEngine.speakWithGeminiTTS(randomPraise), 350);
      }

      triggerFireworks();
      onCorrectAnswer();
    } else {
      setStreak(0);
      setHearts((h) => Math.max(0, h - 1));
      setFeedback({ isCorrect: false, message });
      setHistoryAnswers((prev) => [...prev, { animal: currentAnimal, isCorrect: false }]);

      if (soundEnabled) {
        soundEngine.playWrongSound();
        setTimeout(
          () =>
            soundEngine.speakWithGeminiTTS(
              `Không sao cả bé yêu ơi! Bé hãy nhìn kỹ đặc điểm của bạn ấy và thử lại câu tiếp theo nhé!`
            ),
          300
        );
      }
    }
  };

  // Move to next question or finish game
  const handleNextQuestion = () => {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= totalQuestionsGoal || nextIdx >= filteredAnimals.length) {
      setIsGameOver(true);
      if (soundEnabled) {
        soundEngine.playSuccessSound();
        setTimeout(() => {
          soundEngine.speakWithGeminiTTS(
            `Chúc mừng bé yêu đã hoàn thành xuất sắc vòng chơi! Bé nhận được huy chương vàng danh dự!`
          );
        }, 500);
      }
    } else {
      setQuestionIndex(nextIdx);
      loadQuestion(nextIdx);
    }
  };

  // Handle Free Text Submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    processAnswer(textInput, false);
  };

  // Category labels with counts
  const categories: { id: QuestionMode; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'Tất Cả 50 Con Vật', icon: '🌟', count: ANIMALS_DATA.length },
    {
      id: 'farm',
      label: 'Gia Súc, Gia Cầm',
      icon: '🏡',
      count: ANIMALS_DATA.filter((a) => a.category === 'farm').length,
    },
    {
      id: 'wild',
      label: 'Động Vật Hoang Dã',
      icon: '🦁',
      count: ANIMALS_DATA.filter((a) => a.category === 'wild').length,
    },
    {
      id: 'aquatic',
      label: 'Sinh Vật Biển',
      icon: '🐬',
      count: ANIMALS_DATA.filter((a) => a.category === 'aquatic').length,
    },
    {
      id: 'insects',
      label: 'Côn Trùng & Chim',
      icon: '🐝',
      count: ANIMALS_DATA.filter((a) => a.category === 'insects').length,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Category & Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 p-3 rounded-3xl border-4 border-emerald-300 shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {categories.map((cat) => {
            const isActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-black text-xs md:text-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-300 scale-105'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="bg-white/30 text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Question Goal Selector */}
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-300 text-xs md:text-sm font-bold text-amber-950">
          <span>Số câu:</span>
          {[10, 20, 50].map((num) => (
            <button
              key={num}
              onClick={() => setTotalQuestionsGoal(num)}
              className={`px-2.5 py-1 rounded-xl font-black transition-all cursor-pointer ${
                totalQuestionsGoal === num
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-amber-900 hover:bg-amber-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Top Status & HUD Bar (Stars, Question Progress, Streak, Hearts, Restart) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gradient-to-r from-emerald-500 via-green-500 to-amber-500 p-3 rounded-3xl border-4 border-emerald-600 text-white shadow-lg items-center">
        {/* Score */}
        <div className="flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/30">
          <Star className="w-5 h-5 fill-amber-300 text-amber-300 animate-spin-slow" />
          <span className="font-black text-base md:text-lg">{currentScore} ⭐</span>
        </div>

        {/* Progress */}
        <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-white/30">
          <span className="text-xs font-black text-amber-100">CÂU HỎI</span>
          <span className="font-black text-base md:text-lg">
            {questionIndex + 1} / {Math.min(totalQuestionsGoal, filteredAnimals.length)}
          </span>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/30">
          <Flame className="w-5 h-5 text-orange-300 animate-bounce" />
          <span className="font-black text-sm md:text-base">Chuỗi: {streak} 🔥</span>
        </div>

        {/* Hearts */}
        <div className="flex items-center justify-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-2xl border border-white/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 md:w-5 md:h-5 ${
                i < hearts
                  ? 'fill-rose-400 text-rose-400 animate-pulse'
                  : 'fill-slate-300/40 text-slate-300/40'
              }`}
            />
          ))}
        </div>

        {/* Restart Button */}
        <button
          onClick={restartGame}
          className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-3 py-2 rounded-2xl border-2 border-amber-600 shadow-md active:scale-95 transition-transform cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-xs md:text-sm">Chơi lại từ đầu</span>
        </button>
      </div>

      {/* Main Learning Card */}
      {!isGameOver && currentAnimal && (
        <motion.div
          key={currentAnimal.id + questionIndex}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="bg-white/95 rounded-3xl p-5 md:p-8 border-4 border-emerald-400 shadow-2xl space-y-6"
        >
          {/* Question Title & Prompt */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-4 py-1.5 rounded-full font-black text-sm border-2 border-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Chủ đề: {currentAnimal.categoryName}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
              Đố bé biết đây là bạn con vật gì nào? 🐾
            </h2>
            <p className="text-slate-600 font-semibold text-sm md:text-base">
              Bé hãy chạm vào hình để nghe tiếng cô giáo đọc, rồi chọn 1 trong 4 đáp án hoặc tự gõ tên bạn ấy nhé!
            </p>
          </div>

          {/* Animal Photo Showcase Card */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group max-w-sm w-full bg-gradient-to-b from-amber-50 to-orange-50 p-4 rounded-3xl border-4 border-amber-300 shadow-xl">
              {/* Clickable Image */}
              <div
                onClick={handlePlayAnimalVoice}
                title="Chạm vào hình để nghe cô đọc"
                className="w-full h-64 md:h-72 rounded-2xl overflow-hidden shadow-inner border-4 border-white cursor-pointer relative group-hover:scale-[1.02] transition-transform"
              >
                <img
                  src={currentAnimal.imageUrl}
                  alt={currentAnimal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />

                {/* Floating Speaker Badge */}
                <div className="absolute bottom-3 right-3 bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 font-black text-xs md:text-sm animate-bounce">
                  <Volume2 className="w-5 h-5" />
                  <span>Nghe cô đọc</span>
                </div>

                {/* Animal Emoji Top Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-2xl shadow-md border border-amber-200">
                  {currentAnimal.emoji}
                </div>
              </div>

              {/* Action Buttons under Image: Sound & Hint */}
              <div className="flex items-center justify-between gap-2 mt-3">
                <button
                  onClick={handlePlayAnimalVoice}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-2.5 px-4 rounded-2xl border-2 border-emerald-700 shadow-md active:scale-95 transition-transform text-sm cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isPlayingAudio ? 'Đang phát...' : 'Phát giọng đọc'}</span>
                </button>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-2.5 px-4 rounded-2xl border-2 border-amber-600 shadow-md active:scale-95 transition-transform text-sm cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý cô giáo'}</span>
                </button>
              </div>

              {/* Clue / Hint Box */}
              <AnimatePresence>
                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-amber-100 rounded-2xl border-2 border-amber-300 text-amber-950 text-xs md:text-sm font-bold text-left space-y-1"
                  >
                    <p>💡 <strong>Đặc điểm:</strong> {currentAnimal.specialFeature}</p>
                    <p>🍽️ <strong>Thức ăn yêu thích:</strong> {currentAnimal.food}</p>
                    <p>🏡 <strong>Nơi sống:</strong> {currentAnimal.habitat}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 1: 4 Multiple Choice Answer Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black">
                  1
                </span>
                Cách 1: Bấm chọn 1 trong 4 đáp án đúng:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {mcqOptions.map((opt, idx) => {
                const isSelected = selectedOptionId === opt.id;
                const isTarget = opt.id === currentAnimal.id;
                const letter = ['A', 'B', 'C', 'D'][idx];

                let buttonStyles =
                  'bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-100 hover:border-emerald-500 shadow-md';

                if (feedback !== null) {
                  if (isTarget) {
                    buttonStyles =
                      'bg-emerald-500 text-white border-emerald-700 ring-4 ring-emerald-300 scale-[1.02] shadow-xl';
                  } else if (isSelected && !isTarget) {
                    buttonStyles = 'bg-rose-500 text-white border-rose-700 opacity-90';
                  } else {
                    buttonStyles = 'opacity-40 bg-slate-100 border-slate-200 text-slate-500';
                  }
                }

                return (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: feedback === null ? 1.02 : 1 }}
                    whileTap={{ scale: feedback === null ? 0.97 : 1 }}
                    onClick={() => processAnswer(opt.id, true)}
                    disabled={feedback !== null}
                    className={`flex items-center justify-between p-4 rounded-3xl border-4 font-black transition-all cursor-pointer text-left ${buttonStyles}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-9 h-9 rounded-2xl bg-white text-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-base font-black shadow-sm">
                        {letter}
                      </span>
                      <div>
                        <div className="text-lg md:text-xl leading-tight font-black">
                          {opt.name}
                        </div>
                        <div className="text-xs font-bold opacity-80">
                          {opt.englishName}
                        </div>
                      </div>
                    </div>

                    <span className="text-3xl">{opt.emoji}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Free Text Input Field */}
          <div className="pt-2 border-t-2 border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800 text-base md:text-lg flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-black">
                  2
                </span>
                Cách 2: Hoặc bé tự gõ tên con vật vào đây:
              </span>
            </div>

            <form onSubmit={handleTextSubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={feedback !== null}
                  placeholder="Ví dụ: con voi, voi con, chú chó, mèo..."
                  className="w-full bg-amber-50/80 border-4 border-amber-300 focus:border-amber-500 focus:bg-white text-amber-950 font-bold text-base md:text-lg px-5 py-3.5 rounded-3xl outline-none transition-all shadow-inner placeholder:text-amber-700/50"
                />
              </div>

              <button
                type="submit"
                disabled={feedback !== null || !textInput.trim()}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-3xl font-black text-base shadow-lg transition-all active:scale-95 cursor-pointer whitespace-nowrap ${
                  textInput.trim() && feedback === null
                    ? 'bg-amber-500 hover:bg-amber-400 text-white border-2 border-amber-700'
                    : 'bg-slate-200 text-slate-400 border-2 border-slate-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Gửi đáp án</span>
              </button>
            </form>
          </div>

          {/* Feedback Result Banner & Next Button */}
          <AnimatePresence>
            {feedback !== null && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`p-4 md:p-5 rounded-3xl font-black text-base md:text-lg flex flex-col sm:flex-row items-center justify-between gap-4 border-4 shadow-xl ${
                  feedback.isCorrect
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-400'
                    : 'bg-rose-100 text-rose-950 border-rose-400'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  {feedback.isCorrect ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 animate-bounce" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <div className="font-extrabold">{feedback.message}</div>
                    <div className="text-xs md:text-sm font-semibold opacity-90 mt-0.5">
                      {currentAnimal.funFact}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-base shadow-lg border-2 border-emerald-800 active:scale-95 transition-transform cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Game Over Celebration Card */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 rounded-3xl p-6 md:p-10 border-4 border-amber-400 shadow-2xl text-center space-y-6"
        >
          <div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center border-4 border-amber-400 shadow-inner">
            <Trophy className="w-14 h-14 text-amber-500 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black text-amber-950">
              🎉 Bé Hoàn Thành Xuất Sắc! 🎉
            </h2>
            <p className="text-slate-700 font-bold text-base md:text-lg">
              Bé đã nhận biết rất nhiều người bạn động vật đáng yêu!
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="bg-amber-50 p-3.5 rounded-2xl border-2 border-amber-300">
              <div className="text-2xl md:text-3xl font-black text-amber-600">{currentScore}</div>
              <div className="text-xs font-bold text-amber-900">Điểm số ⭐</div>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-2xl border-2 border-emerald-300">
              <div className="text-2xl md:text-3xl font-black text-emerald-600">
                {historyAnswers.filter((h) => h.isCorrect).length} / {historyAnswers.length}
              </div>
              <div className="text-xs font-bold text-emerald-900">Trả lời đúng</div>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-2xl border-2 border-rose-300">
              <div className="text-2xl md:text-3xl font-black text-rose-600">{hearts} ❤️</div>
              <div className="text-xs font-bold text-rose-900">Trái tim còn lại</div>
            </div>
          </div>

          {/* Teacher Badge Recognition */}
          <div className="bg-gradient-to-r from-emerald-100 via-amber-100 to-green-100 p-4 rounded-2xl border-2 border-emerald-300 text-emerald-950 font-bold text-sm md:text-base max-w-lg mx-auto">
            🌟 <strong>Lời khen của cô giáo:</strong> Bé rất thông minh và chăm chỉ. Bé xứng đáng là <strong>Nhà Thám Hiểm Động Vật Nhí</strong> xuất sắc!
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={restartGame}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-4 rounded-3xl border-4 border-emerald-700 shadow-xl active:scale-95 transition-transform text-lg cursor-pointer"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Chơi lại từ đầu</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
