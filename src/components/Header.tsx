import React from 'react';
import { AppTab } from '../types';
import { BookOpen, Sparkles, Brain, Award, Volume2, VolumeX, Bot, GraduationCap } from 'lucide-react';

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
  const navItems: { id: AppTab; label: string; icon: React.ReactNode; activeColor: string }[] = [
    {
      id: 'review',
      label: 'Ôn Tập Lớp Học',
      icon: <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-orange-500 text-white border-orange-700 ring-2 ring-orange-300',
    },
    {
      id: 'learn',
      label: 'Khám Phá',
      icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-sky-500 text-white border-sky-700 ring-2 ring-sky-300',
    },
    {
      id: 'quiz',
      label: 'Đố Vui',
      icon: <Sparkles className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-emerald-500 text-white border-emerald-700 ring-2 ring-emerald-300',
    },
    {
      id: 'memory',
      label: 'Lật Hình',
      icon: <Brain className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-amber-500 text-white border-amber-700 ring-2 ring-amber-300',
    },
    {
      id: 'ai-owl',
      label: 'Thầy Cú Cú',
      icon: <Bot className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-indigo-500 text-white border-indigo-700 ring-2 ring-indigo-300',
    },
    {
      id: 'badges',
      label: 'Huy Hiệu',
      icon: <Award className="w-5 h-5 md:w-6 md:h-6" />,
      activeColor: 'bg-purple-500 text-white border-purple-700 ring-2 ring-purple-300',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-sky-400 via-blue-500 to-orange-400 shadow-md border-b-4 border-sky-300 rounded-b-3xl px-3 py-2 md:px-6 md:py-3">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
        
        {/* Brand logo & Stars */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div 
            onClick={() => setTab('review')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-11 h-11 md:w-13 md:h-13 bg-orange-400 border-2 border-orange-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner transform group-hover:scale-105 transition-transform">
              🦁
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                Tìm hiểu về các con vật
              </h1>
              <p className="text-xs font-bold text-sky-100 mt-0.5">
                Cô Lương Thị Ngọc Yến AI • Lớp: <span className="bg-white/20 px-1.5 py-0.2 rounded font-black">{classNameVal}</span>
              </p>
            </div>
          </div>

          {/* Toddler Star Score & Sound Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-300 border-2 border-amber-500 px-3 py-1 rounded-full text-amber-950 font-black text-sm md:text-base shadow-sm">
              <span className="text-lg md:text-xl">⭐</span>
              <span>{stars}</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className={`p-2 rounded-full border-2 transition-transform active:scale-95 cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-400 border-emerald-600 text-emerald-950'
                  : 'bg-slate-300 border-slate-400 text-slate-700'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 md:w-6 md:h-6" /> : <VolumeX className="w-5 h-5 md:w-6 md:h-6" />}
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
                className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl font-black text-xs md:text-sm transition-all transform active:scale-95 whitespace-nowrap shadow-sm border-2 cursor-pointer ${
                  isActive
                    ? `${item.activeColor} scale-105`
                    : 'bg-white/90 border-sky-200 text-sky-950 hover:bg-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'badges' && unlockedBadgeCount > 0 && (
                  <span className="ml-0.5 bg-orange-500 text-white text-xs px-1.5 py-0.2 rounded-full font-black">
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
