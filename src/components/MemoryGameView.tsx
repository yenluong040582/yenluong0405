import React, { useState, useEffect } from 'react';
import { Animal, MemoryCard } from '../types';
import { ANIMALS_DATA } from '../data/animals';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Sparkles, RefreshCw, Trophy, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MemoryGameViewProps {
  soundEnabled: boolean;
  onGameCompleted: () => void;
}

export const MemoryGameView: React.FC<MemoryGameViewProps> = ({ soundEnabled, onGameCompleted }) => {
  const [pairCount, setPairCount] = useState<number>(4); // Default 4 pairs (8 cards)
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<MemoryCard[]>([]);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);

  const startNewGame = (pairs = pairCount) => {
    setPairCount(pairs);
    setIsWon(false);
    setMatchedCount(0);
    setMoves(0);
    setFlippedCards([]);

    // Select random animals for the specified number of pairs
    const shuffledAnimals = [...ANIMALS_DATA].sort(() => 0.5 - Math.random());
    const selectedAnimals = shuffledAnimals.slice(0, pairs);

    // Duplicate each animal to make pairs
    const initialCards: MemoryCard[] = [];
    selectedAnimals.forEach((animal, index) => {
      initialCards.push({
        id: `${animal.id}-1-${index}`,
        animalId: animal.id,
        animal,
        isFlipped: false,
        isMatched: false,
      });
      initialCards.push({
        id: `${animal.id}-2-${index}`,
        animalId: animal.id,
        animal,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle the cards grid
    const shuffledGrid = initialCards.sort(() => 0.5 - Math.random());
    setCards(shuffledGrid);
  };

  useEffect(() => {
    startNewGame(4);
  }, []);

  const handleCardClick = (clickedCard: MemoryCard) => {
    if (clickedCard.isFlipped || clickedCard.isMatched || flippedCards.length >= 2) {
      return;
    }

    if (soundEnabled) {
      soundEngine.playAnimalSound(clickedCard.animal.soundType);
    }

    // Flip the card
    const updatedCards = cards.map((c) =>
      c.id === clickedCard.id ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    // Check if 2 cards are flipped
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [card1, card2] = newFlipped;

      if (card1.animalId === card2.animalId) {
        // MATCH!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.animalId === card1.animalId ? { ...c, isMatched: true, isFlipped: true } : c
            )
          );
          setFlippedCards([]);
          setMatchedCount((count) => {
            const nextCount = count + 1;
            if (nextCount === pairCount) {
              // WON GAME!
              setIsWon(true);
              if (soundEnabled) {
                soundEngine.playSuccessSound();
                setTimeout(() => soundEngine.speakWithGeminiTTS('Hoan hô các con! Con đã tìm được tất cả các cặp con vật rồi! Cô khen con rất giỏi nhé!'), 300);
              }
              confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
              onGameCompleted();
            }
            return nextCount;
          });

          if (soundEnabled) {
            soundEngine.speakWithGeminiTTS(card1.animal.name);
          }
        }, 500);
      } else {
        // NO MATCH -> Flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === card1.id || c.id === card2.id ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 1100);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Difficulty buttons & stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 p-4 rounded-3xl border-2 border-amber-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-950 text-sm">Chế độ chơi:</span>
          {[
            { count: 2, label: 'Dễ (4 lá)' },
            { count: 4, label: 'Vừa (8 lá)' },
            { count: 6, label: 'Thử thách (12 lá)' },
          ].map((mode) => (
            <button
              key={mode.count}
              onClick={() => startNewGame(mode.count)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs md:text-sm transition-all ${
                pairCount === mode.count
                  ? 'bg-emerald-500 text-white shadow-md scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm font-black text-amber-950">
          <span>🎯 Đã ghép: <strong className="text-emerald-600 text-base">{matchedCount}/{pairCount}</strong></span>
          <span>🔄 Số lần lật: <strong className="text-amber-600 text-base">{moves}</strong></span>
          <button
            onClick={() => startNewGame(pairCount)}
            className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-amber-950 px-3 py-1.5 rounded-xl border border-amber-500 text-xs shadow-sm active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Lật lại</span>
          </button>
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div
        className={`grid gap-3 md:gap-4 ${
          pairCount === 2
            ? 'grid-cols-2 max-w-md mx-auto'
            : pairCount === 4
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-3 sm:grid-cols-4'
        }`}
      >
        {cards.map((card) => {
          const isVisible = card.isFlipped || card.isMatched;

          return (
            <motion.div
              key={card.id}
              whileHover={{ scale: isVisible ? 1 : 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card)}
              className="cursor-pointer aspect-square relative perspective-1000"
            >
              <div
                className={`w-full h-full rounded-3xl border-4 shadow-md transition-all duration-300 transform flex flex-col items-center justify-center p-3 text-center ${
                  isVisible
                    ? `bg-gradient-to-b ${card.animal.bgGradient} ${card.animal.borderColor}`
                    : 'bg-gradient-to-b from-amber-400 to-amber-500 border-amber-600 hover:from-amber-300 hover:to-amber-400'
                }`}
              >
                {isVisible ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center justify-between h-full w-full"
                  >
                    <div className="w-full h-2/3 rounded-2xl overflow-hidden border-2 border-white shadow-inner">
                      <img
                        src={card.animal.imageUrl}
                        alt={card.animal.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`font-black text-sm md:text-base ${card.animal.textColor} leading-none mt-1`}>
                      {card.animal.name}
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-amber-950">
                    <HelpCircle className="w-10 h-10 md:w-12 md:h-12 animate-pulse opacity-80" />
                    <span className="font-black text-xs md:text-sm mt-1">Con gì đây?</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Victory Dialog */}
      {isWon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 rounded-3xl p-6 md:p-8 border-4 border-emerald-400 shadow-2xl text-center space-y-4"
        >
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="text-2xl md:text-3xl font-black text-emerald-950">
            Xuất Sắc! Bé Đã Hoàn Thành Trò Chơi Lật Hình!
          </h2>
          <p className="text-slate-700 font-bold text-base md:text-lg">
            Bé tìm thấy tất cả {pairCount} cặp con vật chỉ trong <span className="text-rose-600 font-black">{moves}</span> lần lật!
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => startNewGame(pairCount)}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-6 py-3 rounded-2xl border-2 border-emerald-700 shadow-md text-base md:text-lg active:scale-95"
            >
              🎮 Chơi lại ván nữa
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
