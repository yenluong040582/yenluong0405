import React, { useState } from 'react';
import { Animal, AnimalCategory } from '../types';
import { ANIMALS_DATA } from '../data/animals';
import { soundEngine } from '../utils/audio';
import { Volume2, Music, Sparkles, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsViewProps {
  soundEnabled: boolean;
  onCardExplored: (animalId: string) => void;
}

const CATEGORY_MAP: Record<AnimalCategory | 'all', { label: string; emoji: string; color: string }> = {
  all: { label: 'Tất Cả 50 Con Vật', emoji: '🌟', color: 'bg-emerald-500 text-white' },
  farm: { label: 'Gia Súc, Gia Cầm', emoji: '🏡', color: 'bg-amber-500 text-white' },
  wild: { label: 'Rừng Xanh Hoang Dã', emoji: '🦁', color: 'bg-orange-500 text-white' },
  aquatic: { label: 'Sinh Vật Biển', emoji: '🐬', color: 'bg-sky-500 text-white' },
  insects: { label: 'Côn Trùng & Chim', emoji: '🐝', color: 'bg-teal-500 text-white' },
};

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ soundEnabled, onCardExplored }) => {
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAnimal, setActiveAnimal] = useState<Animal | null>(null);

  const filteredAnimals = ANIMALS_DATA.filter((animal) => {
    const matchesCategory = selectedCategory === 'all' || animal.category === selectedCategory;
    const matchesSearch =
      animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      animal.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (animal.synonyms && animal.synonyms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handlePlayVoice = (animal: Animal) => {
    if (soundEnabled) {
      soundEngine.introduceAnimal(animal);
    }
    onCardExplored(animal.id);
  };

  const handlePlaySound = (animal: Animal) => {
    if (soundEnabled) {
      soundEngine.playAnimalSound(animal.soundType);
    }
    onCardExplored(animal.id);
  };

  const handleOpenDetail = (animal: Animal) => {
    setActiveAnimal(animal);
    if (soundEnabled) {
      soundEngine.introduceAnimal(animal);
    }
    onCardExplored(animal.id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 bg-white/90 p-3 rounded-3xl border-4 border-emerald-300 shadow-md">
        {(Object.keys(CATEGORY_MAP) as (AnimalCategory | 'all')[]).map((cat) => {
          const isSelected = selectedCategory === cat;
          const info = CATEGORY_MAP[cat];
          const count = cat === 'all' ? ANIMALS_DATA.length : ANIMALS_DATA.filter((a) => a.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs md:text-sm transition-all transform active:scale-95 shadow-sm border-2 cursor-pointer ${
                isSelected
                  ? `${info.color} border-slate-900 scale-105 ring-2 ring-emerald-300`
                  : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="text-lg">{info.emoji}</span>
              <span>{info.label}</span>
              <span className="bg-black/10 text-xs px-1.5 py-0.2 rounded-full font-bold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative px-2">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm trong 50 con vật (Ví dụ: Voi, Chó, Mèo, Cá voi...)"
          className="w-full pl-14 pr-10 py-3.5 rounded-full border-4 border-emerald-300 bg-white text-emerald-950 font-bold placeholder-emerald-700/50 focus:outline-none focus:ring-4 focus:ring-emerald-200 shadow-md text-base"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Animals Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {filteredAnimals.map((animal) => (
          <motion.div
            key={animal.id}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`bg-gradient-to-b ${animal.bgGradient} rounded-3xl p-3.5 md:p-4 border-4 ${animal.borderColor} shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative group`}
          >
            {/* Animal Image & Emoji */}
            <div
              onClick={() => handleOpenDetail(animal)}
              className="cursor-pointer relative rounded-2xl overflow-hidden aspect-square border-2 border-white shadow-inner group-hover:scale-102 transition-transform bg-white"
            >
              <img
                src={animal.imageUrl}
                alt={animal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-xl shadow-md border border-white">
                {animal.emoji}
              </div>
            </div>

            {/* Name & English name */}
            <div className="mt-3 text-center cursor-pointer" onClick={() => handleOpenDetail(animal)}>
              <h3 className={`text-lg md:text-xl font-black ${animal.textColor} leading-tight`}>
                {animal.name}
              </h3>
              <p className="text-xs font-bold text-slate-600 tracking-wide uppercase mt-0.5">
                {animal.englishName}
              </p>
            </div>

            {/* Action Buttons: Voice & Sound */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePlayVoice(animal)}
                title="Nghe cô giáo đọc tên & đặc điểm"
                className="flex items-center justify-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-2 px-2 rounded-xl border border-emerald-700 text-xs md:text-sm active:scale-95 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>Giới thiệu</span>
              </button>

              <button
                onClick={() => handlePlaySound(animal)}
                title="Nghe tiếng kêu"
                className="flex items-center justify-center gap-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-2 px-2 rounded-xl border border-amber-600 text-xs md:text-sm active:scale-95 shadow-sm cursor-pointer"
              >
                <Music className="w-4 h-4 shrink-0" />
                <span>Tiếng kêu</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAnimals.length === 0 && (
        <div className="text-center py-12 bg-white/90 rounded-3xl border-4 border-dashed border-emerald-300 p-6">
          <span className="text-5xl block mb-2">🔍</span>
          <h3 className="text-xl font-black text-emerald-950">Không tìm thấy con vật nào!</h3>
          <p className="text-slate-600 font-semibold text-sm mt-1">Bé hãy thử tìm kiếm với từ khóa khác nhé.</p>
        </div>
      )}

      {/* Animal Detail Modal */}
      <AnimatePresence>
        {activeAnimal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className={`bg-gradient-to-b ${activeAnimal.bgGradient} max-w-lg w-full rounded-3xl border-4 ${activeAnimal.borderColor} p-5 md:p-6 shadow-2xl relative overflow-hidden`}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveAnimal(null)}
                className="absolute top-4 right-4 bg-white hover:bg-slate-100 text-slate-800 p-2 rounded-full shadow-md z-10 border border-slate-300 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Top Banner Image */}
              <div className="relative rounded-2xl overflow-hidden aspect-video border-4 border-white shadow-md">
                <img
                  src={activeAnimal.imageUrl}
                  alt={activeAnimal.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 bg-white/90 px-3 py-1 rounded-full text-2xl shadow-sm border border-white">
                  {activeAnimal.emoji}
                </div>
              </div>

              {/* Title & Sound Text */}
              <div className="text-center mt-4">
                <h2 className={`text-2xl md:text-3xl font-black ${activeAnimal.textColor}`}>
                  {activeAnimal.name} ({activeAnimal.englishName})
                </h2>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  Tiếng kêu: "{activeAnimal.soundText}"
                </p>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => handlePlayVoice(activeAnimal)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-4 py-2.5 rounded-2xl border-2 border-emerald-700 shadow-md active:scale-95 text-sm md:text-base cursor-pointer"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>🔊 Giọng Đọc Cô Giáo</span>
                </button>

                <button
                  onClick={() => handlePlaySound(activeAnimal)}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-4 py-2.5 rounded-2xl border-2 border-amber-600 shadow-md active:scale-95 text-sm md:text-base cursor-pointer"
                >
                  <Music className="w-5 h-5" />
                  <span>📣 Tiếng Kêu</span>
                </button>
              </div>

              {/* Fact Card */}
              <div className="mt-5 bg-white/95 backdrop-blur-sm rounded-2xl p-4 border-2 border-emerald-200 shadow-sm space-y-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-emerald-950 text-sm block">Đặc điểm sinh động:</span>
                    <p className="text-slate-800 font-bold text-sm md:text-base leading-relaxed">
                      {activeAnimal.description || activeAnimal.funFact}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100 text-xs md:text-sm">
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="font-black text-amber-900 block">🍎 Thức ăn:</span>
                    <span className="text-slate-800 font-bold">{activeAnimal.food}</span>
                  </div>

                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-black text-emerald-900 block">🏡 Nơi ở:</span>
                    <span className="text-slate-800 font-bold">{activeAnimal.habitat}</span>
                  </div>
                </div>
              </div>

              {/* Read Full Intro button */}
              <button
                onClick={() => soundEngine.introduceAnimal(activeAnimal)}
                className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-black py-3 rounded-2xl border-2 border-emerald-700 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
                <span>Cô giáo đọc toàn bộ câu chuyện về bạn {activeAnimal.name}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
