import React from 'react';
import { Badge } from '../types';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Award, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface BadgesViewProps {
  badges: Badge[];
  soundEnabled: boolean;
}

export const BadgesView: React.FC<BadgesViewProps> = ({ badges, soundEnabled }) => {
  const handleBadgeClick = (badge: Badge) => {
    if (badge.unlocked) {
      if (soundEnabled) {
        soundEngine.playSuccessSound();
        soundEngine.speakVietnamese(`Chúc mừng con! Con đã nhận được Huy hiệu ${badge.title}. ${badge.description}`);
      }
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      if (soundEnabled) {
        soundEngine.speakVietnamese(`Huy hiệu ${badge.title}. Con hãy ${badge.description} để mở khóa nhé!`);
      }
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-4 border-purple-300">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-inner shrink-0 border border-white/30">
            🏅
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black drop-shadow-md">
              Bộ Sưu Tập Huy Hiệu Bé Giỏi
            </h2>
            <p className="text-purple-100 font-bold text-sm sm:text-base">
              Bé đã xuất sắc mở khóa <strong className="text-yellow-300 text-lg">{unlockedCount}/{badges.length}</strong> huy hiệu!
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/30 font-black text-yellow-300 text-base">
          ⭐ Bé Chăm Ngoan
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {badges.map((badge) => {
          const progressPercent = Math.min(100, Math.round((badge.currentCount / badge.requiredCount) * 100));

          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleBadgeClick(badge)}
              className={`cursor-pointer rounded-3xl p-5 border-4 shadow-md transition-all relative flex flex-col justify-between overflow-hidden ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-amber-100 via-orange-100 to-rose-100 border-amber-400'
                  : 'bg-slate-100 border-slate-300 opacity-80'
              }`}
            >
              {/* Badge Icon & Lock */}
              <div className="flex items-center justify-between">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 ${
                    badge.unlocked ? 'bg-amber-300 border-amber-500' : 'bg-slate-200 border-slate-300 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>

                <div>
                  {badge.unlocked ? (
                    <span className="bg-emerald-500 text-white p-1.5 rounded-full inline-block shadow-md">
                      <CheckCircle2 className="w-6 h-6" />
                    </span>
                  ) : (
                    <span className="bg-slate-400 text-white p-1.5 rounded-full inline-block">
                      <Lock className="w-5 h-5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-4 space-y-1">
                <h3 className={`text-lg font-black ${badge.unlocked ? 'text-amber-950' : 'text-slate-700'}`}>
                  {badge.title}
                </h3>
                <p className="text-xs font-bold text-slate-600">
                  {badge.description}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs font-black text-slate-600">
                  <span>Tiến độ</span>
                  <span>{badge.currentCount}/{badge.requiredCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                  <div
                    className={`h-full transition-all duration-500 ${
                      badge.unlocked ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
