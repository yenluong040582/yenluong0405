import React, { useState } from 'react';
import { Animal, AnimalCategory } from '../types';
import { ANIMALS_DATA, HABITAT_LABELS } from '../data/animals';
import { soundEngine } from '../utils/audio';
import { Volume2, Music, Sparkles, X, Heart, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsViewProps {
  soundEnabled: boolean;
  onCardExplored: (animalId: string) => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ soundEnabled, onCardExplored }) => {
  const [selectedCategory, setSelectedCategory] = useState<AnimalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeAnimal, setActiveAnimal] = useState<Animal | null>(null);

  const filteredAnimals = ANIMALS_DATA.filter((animal) => {
    const matchesCategory = selectedCategory === 'all' || animal.category === selectedCategory;
    const matchesSearch = animal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          animal.englishName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePlayVoice = (animal: Animal) => {
    if (soundEnabled) {
      soundEngine.speakVietnamese(animal.name);
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
      soundEngine.speakVietnamese(animal.name);
    }
    onCardExplored(animal.id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {(Object.keys(HABITAT_LABELS) as (AnimalCategory | 'all')[]).map((cat) => {
          const isSelected = selectedCategory === cat;
          const info = HABITAT_LABELS[cat];
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm md:text-base transition-all transform active:scale-95 shadow-md border-2 ${
                isSelected
                  ? `${info.bg} border-slate-900 scale-105 ring-2 ring-amber-300`
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
            >
              <span className="text-xl">{info.emoji}</span>
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto relative px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm con vật (ví dụ: Mèo, Voi, Hổ...)"
          className="w-full pl-12 pr-4 py-3 rounded-full border-3 border-amber-300 bg-white/95 text-amber-950 font-bold placeholder-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-200 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -4 }}
            className={`bg-gradient-to-b ${animal.bgGradient} rounded-3xl p-3 md:p-4 border-3 ${animal.borderColor} shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative group`}
          >
            {/* Animal Image & Emoji */}
            <div 
              onClick={() => handleOpenDetail(animal)}
              className="cursor-pointer relative rounded-2xl overflow-hidden aspect-square border-2 border-white/80 shadow-inner group-hover:scale-102 transition-transform bg-white"
            >
              <img
                src={animal.imageUrl}
                alt={animal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center text-xl shadow-md border border-white">
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
                title="Nghe phát âm tiếng Việt"
                className="flex items-center justify-center gap-1 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black py-2 px-2 rounded-xl border border-amber-500 text-xs md:text-sm active:scale-95 shadow-sm"
              >
                <Volume2 className="w-4 h-4 shrink-0" />
                <span>Đọc tên</span>
              </button>

              <button
                onClick={() => handlePlaySound(animal)}
                title="Nghe tiếng kêu"
                className="flex items-center justify-center gap-1 bg-rose-400 hover:bg-rose-300 text-rose-950 font-black py-2 px-2 rounded-xl border border-rose-500 text-xs md:text-sm active:scale-95 shadow-sm"
              >
                <Music className="w-4 h-4 shrink-0" />
                <span>Tiếng kêu</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAnimals.length === 0 && (
        <div className="text-center py-12 bg-white/80 rounded-3xl border-2 border-dashed border-amber-300 p-6">
          <span className="text-5xl block mb-2">🔍</span>
          <h3 className="text-xl font-bold text-amber-900">Không tìm thấy con vật nào!</h3>
          <p className="text-slate-600 text-sm mt-1">Bé hãy thử gõ tên con vật khác nhé.</p>
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
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md z-10 border border-slate-200"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Top Banner Image */}
              <div className="relative rounded-2xl overflow-hidden aspect-video border-3 border-white shadow-md">
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
                  {activeAnimal.name}
                </h2>
                <p className="text-sm font-black text-rose-600 mt-0.5">
                  Tiếng kêu: "{activeAnimal.soundText}"
                </p>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => handlePlayVoice(activeAnimal)}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-4 py-2.5 rounded-2xl border-2 border-amber-600 shadow-md active:scale-95 text-sm md:text-base"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>🔊 Phát Âm Tên</span>
                </button>

                <button
                  onClick={() => handlePlaySound(activeAnimal)}
                  className="flex items-center gap-2 bg-rose-400 hover:bg-rose-300 text-rose-950 font-black px-4 py-2.5 rounded-2xl border-2 border-rose-600 shadow-md active:scale-95 text-sm md:text-base"
                >
                  <Music className="w-5 h-5" />
                  <span>📣 Tiếng Kêu</span>
                </button>
              </div>

              {/* Fact Card */}
              <div className="mt-5 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 text-sm block">Điều thú vị cho bé:</span>
                    <p className="text-slate-800 font-medium text-sm md:text-base leading-relaxed">
                      {activeAnimal.funFact}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-100 text-xs md:text-sm">
                  <div className="bg-amber-50 p-2 rounded-xl">
                    <span className="font-bold text-amber-800 block">🍎 Món khoái khẩu:</span>
                    <span className="text-slate-700 font-semibold">{activeAnimal.food}</span>
                  </div>

                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <span className="font-bold text-emerald-800 block">🏡 Nơi sinh sống:</span>
                    <span className="text-slate-700 font-semibold">{activeAnimal.habitat}</span>
                  </div>
                </div>
              </div>

              {/* Read Fact Aloud button */}
              <button
                onClick={() => soundEngine.speakVietnamese(`${activeAnimal.name}. ${activeAnimal.funFact}`)}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 rounded-2xl border-2 border-emerald-700 shadow-md flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                <span>Đọc cho bé nghe toàn bộ câu chuyện</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
