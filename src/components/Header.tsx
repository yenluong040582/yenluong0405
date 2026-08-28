import React, { useState } from 'react';
import { AppTab } from '../types';
import { soundEngine } from '../utils/audio';
import { Sparkles, BookOpen, Brain, Award, Volume2, VolumeX, Bot, GraduationCap, Star, Mic } from 'lucide-react';

interface HeaderProps {
  currentTab: AppTab;
  setTab: (tab: AppTab) => void;
  stars: number;
  unlockedBadgeCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  classNameVal: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setTab,
  stars,
  unlockedBadgeCount,
  soundEnabled,
  setSoundEnabled,
  classNameVal,
}) => {
  const [isSpeakingTest, setIsSpeakingTest] = useState<boolean>(false);

  const handleTestVoice = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
    }
    setIsSpeakingTest(true);
    soundEngine.testTeacherVoice(() => {
      setIsSpeakingTest(false);
    });
  };

  const navItems: { id: AppTab; label: string; icon: React.ReactNode; activeColor: string }[] = [
    {
      id: 'quiz',
      label: 'Đố Vui 50 Con Vật',
      icon: <Sparkles className="w-5 h-5" />,
      activeColor: 'bg-emerald-600 text-white border-emerald-800 ring-2 ring-emerald-300',
    },
    {
      id: 'review',
      label: 'Ôn Tập Theo Bài',
      icon: <GraduationCap className="w-5 h-5" />,
      activeColor: 'bg-orange-500 text-white border-orange-700 ring-2 ring-orange-300',
    },
    {
      id: 'learn',
      label: 'Bộ Thẻ 50 Con Vật',
      icon: <BookOpen className="w-5 h-5" />,
      activeColor: 'bg-teal-600 text-white border-teal-800 ring-2 ring-teal-300',
    },
    {
      id: 'memory',
      label: 'Trò Chơi Trí Nhớ',
      icon: <Brain className="w-5 h-5" />,
      activeColor: 'bg-amber-500 text-white border-amber-700 ring-2 ring-amber-300',
    },
    {
      id: 'ai-owl',
      label: 'Cô Giáo Cú Mèo',
      icon: <Bot className="w-5 h-5" />,
      activeColor: 'bg-indigo-500 text-white border-indigo-700 ring-2 ring-indigo-300',
    },
    {
      id: 'badges',
      label: 'Bảng Huy Hiệu',
      icon: <Award className="w-5 h-5" />,
      activeColor: 'bg-rose-500 text-white border-rose-700 ring-2 ring-rose-300',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-600 via-green-600 to-amber-500 shadow-lg border-b-4 border-emerald-700 rounded-b-3xl px-3 py-2.5 md:px-6 md:py-3.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-4">
        {/* Brand logo & Stars */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div
            onClick={() => setTab('quiz')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-400 border-2 border-amber-600 rounded-2xl flex items-center justify-center text-3xl shadow-md transform group-hover:scale-105 transition-transform">
              🦁
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none drop-shadow-sm flex items-center gap-1.5">
                Bé Học Về 50 Con Vật
                <span className="bg-amber-400 text-amber-950 text-xs px-2 py-0.5 rounded-full font-black">
                  Giọng Tiếng Việt
                </span>
              </h1>
              <p className="text-xs font-bold text-emerald-100 mt-1">
                Cô Giáo Lương Thị Ngọc Yến • Lớp: <span className="bg-white/25 px-1.5 py-0.5 rounded font-black">{classNameVal}</span>
              </p>
            </div>
          </div>

          {/* Toddler Star Score & Sound Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-300 border-2 border-amber-500 px-3 py-1.5 rounded-full text-amber-950 font-black text-xs md:text-sm shadow-sm">
              <Star className="w-4 h-4 fill-amber-500 text-amber-600" />
              <span>{stars} ⭐</span>
            </div>

            <button
              onClick={handleTestVoice}
              title="Bấm để nghe giọng cô giáo Tiếng Việt"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-black text-xs transition-transform active:scale-95 cursor-pointer border-2 shadow-sm ${
                isSpeakingTest
                  ? 'bg-rose-500 text-white border-rose-700 animate-pulse'
                  : 'bg-white/95 text-emerald-950 border-white hover:bg-emerald-50'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isSpeakingTest ? 'Đang đọc...' : 'Thử giọng cô'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className={`p-2 rounded-full border-2 transition-transform active:scale-95 cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-amber-400 border-amber-600 text-amber-950'
                  : 'bg-slate-300 border-slate-400 text-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center justify-center gap-1.5 md:gap-2 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-2xl font-black text-xs md:text-sm transition-all transform active:scale-95 whitespace-nowrap shadow-sm border-2 cursor-pointer ${
                  isActive
                    ? `${item.activeColor} scale-105 shadow-md`
                    : 'bg-white/95 border-emerald-200 text-emerald-950 hover:bg-emerald-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'badges' && unlockedBadgeCount > 0 && (
                  <span className="ml-0.5 bg-rose-500 text-white text-xs px-1.5 py-0.2 rounded-full font-black">
                    {unlockedBadgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
