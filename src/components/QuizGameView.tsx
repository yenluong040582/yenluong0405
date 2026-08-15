import React, { useState, useEffect } from 'react';
import { Animal, QuizType } from '../types';
import { ANIMALS_DATA } from '../data/animals';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, RefreshCw, CheckCircle, HelpCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizGameViewProps {
  soundEnabled: boolean;
  onCorrectAnswer: () => void;
}

export const QuizGameView: React.FC<QuizGameViewProps> = ({ soundEnabled, onCorrectAnswer }) => {
  const [quizType, setQuizType] = useState<QuizType>('sound');
  const [targetAnimal, setTargetAnimal] = useState<Animal | null>(null);
  const [options, setOptions] = useState<Animal[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState<number>(0);

  // Generate a new quiz question
  const generateQuestion = () => {
    setSelectedOption(null);
    setIsCorrect(null);

    // Pick 1 target animal randomly
    const randomIndex = Math.floor(Math.random() * ANIMALS_DATA.length);
    const target = ANIMALS_DATA[randomIndex];
    setTargetAnimal(target);

    // Pick 3 distractor animals
    const otherAnimals = ANIMALS_DATA.filter((a) => a.id !== target.id);
    const shuffledOthers = [...otherAnimals].sort(() => 0.5 - Math.random());
    const distractors = shuffledOthers.slice(0, 3);

    // Combine & shuffle options
    const allOptions = [target, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOptions);

    // Prompt for the question
    if (soundEnabled) {
      setTimeout(() => {
        if (quizType === 'sound') {
          soundEngine.playAnimalSound(target.soundType);
        } else if (quizType === 'name') {
          soundEngine.speakVietnamese(`Các con hãy quan sát thật kỹ và tìm bạn ${target.name} nhé!`);
        } else {
          soundEngine.speakVietnamese(`Đố các con biết đây là bóng của bạn con vật nào nào?`);
        }
      }, 200);
    }
  };

  useEffect(() => {
    generateQuestion();
  }, [quizType]);

  const handlePlayPromptSound = () => {
    if (!targetAnimal || !soundEnabled) return;

    if (quizType === 'sound') {
      soundEngine.playAnimalSound(targetAnimal.soundType);
    } else if (quizType === 'name') {
      soundEngine.speakVietnamese(`Các con hãy quan sát thật kỹ và tìm bạn ${targetAnimal.name} nhé!`);
    } else {
      soundEngine.speakVietnamese(`Đố các con biết đây là bóng của bạn con vật nào nào?`);
    }
  };

  const handleSelectOption = (animal: Animal) => {
    if (selectedOption !== null) return; // Prevent double taps

    setSelectedOption(animal.id);
    const correct = animal.id === targetAnimal?.id;
    setIsCorrect(correct);

    if (correct) {
      setStreak((prev) => prev + 1);
      if (soundEnabled) {
        soundEngine.playSuccessSound();
        const praiseList = [
          'Giỏi quá! Con đã trả lời chính xác rồi! Cô khen con!',
          'Rất giỏi! Con thông minh quá, cô khen con nhé!',
          'Chính xác rồi! Con làm bài rất là cừ!',
          'Hoan hô con! Con trả lời đúng rồi nè!',
        ];
        const randomPraise = praiseList[Math.floor(Math.random() * praiseList.length)];
        setTimeout(() => soundEngine.speakVietnamese(randomPraise), 300);
      }

      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      onCorrectAnswer();
    } else {
      setStreak(0);
      if (soundEnabled) {
        soundEngine.playWrongSound();
        setTimeout(() => soundEngine.speakVietnamese('Không sao đâu! Con thử suy nghĩ lại một chút nhé!'), 300);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Quiz Mode Selector */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 bg-white/90 p-2 rounded-3xl border-2 border-amber-200 shadow-sm">
        <button
          onClick={() => setQuizType('sound')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm md:text-base transition-all ${
            quizType === 'sound'
              ? 'bg-rose-500 text-white shadow-md scale-105 ring-2 ring-rose-300'
              : 'text-slate-700 hover:bg-rose-50'
          }`}
        >
          <Volume2 className="w-5 h-5" />
          <span>Đoán Tiếng Kêu</span>
        </button>

        <button
          onClick={() => setQuizType('name')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm md:text-base transition-all ${
            quizType === 'name'
              ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
              : 'text-slate-700 hover:bg-amber-50'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Tìm Con Vật</span>
        </button>

        <button
          onClick={() => setQuizType('shadow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-sm md:text-base transition-all ${
            quizType === 'shadow'
              ? 'bg-indigo-500 text-white shadow-md scale-105 ring-2 ring-indigo-300'
              : 'text-slate-700 hover:bg-indigo-50'
          }`}
        >
          <Eye className="w-5 h-5" />
          <span>Đoán Bóng Đen</span>
        </button>
      </div>

      {/* Streak Badge */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-4 py-2 rounded-2xl border-2 border-amber-300">
        <div className="flex items-center gap-2 font-black text-amber-950 text-sm md:text-base">
          <span className="text-xl">🔥</span>
          <span>Chuỗi trả lời đúng: <strong className="text-rose-600 text-lg">{streak}</strong> câu</span>
        </div>

        <button
          onClick={generateQuestion}
          className="flex items-center gap-1 bg-white hover:bg-amber-50 text-amber-900 font-bold px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm text-xs md:text-sm active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Đổi câu hỏi</span>
        </button>
      </div>

      {/* Main Question Card */}
      {targetAnimal && (
        <motion.div
          key={targetAnimal.id + quizType}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 rounded-3xl p-6 md:p-8 border-4 border-amber-300 shadow-xl text-center relative overflow-hidden"
        >
          {/* Question Prompt */}
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-black text-amber-950">
              {quizType === 'sound' && '📣 Lắng nghe tiếng kêu và đoán con vật:'}
              {quizType === 'name' && `🎯 Bé hãy bấm vào: ${targetAnimal.name}`}
              {quizType === 'shadow' && '👤 Đây là bóng dáng của con vật nào?'}
            </h2>

            {/* Interactive Sound Trigger or Silhouette display */}
            <div className="flex justify-center my-4">
              {quizType === 'sound' && (
                <button
                  onClick={handlePlayPromptSound}
                  className="group flex flex-col items-center gap-2 bg-rose-500 hover:bg-rose-400 text-white font-black px-8 py-5 rounded-3xl border-4 border-rose-700 shadow-lg active:scale-95 transition-transform"
                >
                  <Volume2 className="w-12 h-12 animate-pulse" />
                  <span className="text-lg">🔊 Nghe lại tiếng kêu</span>
                </button>
              )}

              {quizType === 'name' && (
                <button
                  onClick={handlePlayPromptSound}
                  className="group flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-white font-black px-6 py-4 rounded-3xl border-4 border-amber-700 shadow-lg active:scale-95 transition-transform"
                >
                  <Volume2 className="w-8 h-8" />
                  <span className="text-xl">{targetAnimal.name}</span>
                </button>
              )}

              {quizType === 'shadow' && (
                <div className="relative w-48 h-48 rounded-3xl bg-slate-900 border-4 border-slate-700 p-3 shadow-inner flex items-center justify-center overflow-hidden">
                  <img
                    src={targetAnimal.imageUrl}
                    alt="Silhouette"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover brightness-0 contrast-200 invert-0"
                  />
                  <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                    <HelpCircle className="w-16 h-16 text-amber-400 opacity-60 animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Option Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {options.map((animal) => {
              const isSelected = selectedOption === animal.id;
              const isTarget = animal.id === targetAnimal.id;

              let btnStyle = 'bg-white border-amber-300 text-amber-950 hover:border-amber-500 hover:bg-amber-50';
              if (selectedOption !== null) {
                if (isTarget) {
                  btnStyle = 'bg-emerald-500 text-white border-emerald-700 ring-4 ring-emerald-300 scale-105';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-500 text-white border-rose-700 opacity-80';
                } else {
                  btnStyle = 'opacity-40 bg-slate-100 border-slate-200';
                }
              }

              return (
                <motion.button
                  key={animal.id}
                  whileHover={{ scale: selectedOption === null ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelectOption(animal)}
                  disabled={selectedOption !== null}
                  className={`flex flex-col items-center p-4 rounded-3xl border-4 shadow-md transition-all relative ${btnStyle}`}
                >
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-white shadow-inner mb-3">
                    <img
                      src={animal.imageUrl}
                      alt={animal.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <span className="font-black text-lg md:text-xl leading-tight">
                    {animal.name}
                  </span>

                  {selectedOption !== null && isTarget && (
                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Result Banner */}
          <AnimatePresence>
            {isCorrect !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={`mt-6 p-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 ${
                  isCorrect
                    ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-400'
                    : 'bg-rose-100 text-rose-950 border-2 border-rose-400'
                }`}
              >
                <span>{isCorrect ? '🎉 Hoan hô! Bé trả lời chính xác xuất sắc! (+10 ⭐)' : '😅 Ôi chưa đúng rồi, bé hãy thử lại câu khác nhé!'}</span>

                <button
                  onClick={generateQuestion}
                  className="ml-2 bg-amber-500 hover:bg-amber-400 text-white px-5 py-2 rounded-xl text-base shadow-md active:scale-95"
                >
                  Câu tiếp theo ➡️
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
