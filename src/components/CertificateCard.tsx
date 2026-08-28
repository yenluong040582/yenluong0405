import React, { useRef } from 'react';
import { Award, Star, Crown, Sparkles, Printer, Volume2, Heart, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';

export type GradeRank = 'XUẤT SẮC' | 'GIỎI' | 'HOÀN THÀNH TỐT' | 'HOÀN THÀNH';

interface CertificateCardProps {
  studentName: string;
  classNameVal: string;
  lessonTitle: string;
  score: number;
  totalQuestions: number;
  soundEnabled: boolean;
}

export const getGradeInfo = (score: number, total: number) => {
  const percent = total > 0 ? (score / total) * 100 : 0;

  if (percent >= 90) {
    return {
      rank: 'XUẤT SẮC' as GradeRank,
      percentText: `${Math.round(percent)}%`,
      badgeIcon: '👑',
      badgeColor: 'from-amber-400 via-yellow-500 to-amber-600',
      badgeBorder: 'border-amber-500',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      ribbonText: 'DANH HIỆU XUẤT SẮC 🌟',
      speech: `Tuyệt vời lắm! Con đã xuất sắc trả lời đúng ${score} trên ${total} câu và đạt danh hiệu Xuất Sắc! Cô khen con rất nhiều!`,
      starsCount: 5,
    };
  } else if (percent >= 80) {
    return {
      rank: 'GIỎI' as GradeRank,
      percentText: `${Math.round(percent)}%`,
      badgeIcon: '🌟',
      badgeColor: 'from-sky-400 via-blue-500 to-indigo-600',
      badgeBorder: 'border-sky-500',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      ribbonText: 'DANH HIỆU GIỎI 🎉',
      speech: `Giỏi quá! Con đã trả lời đúng ${score} trên ${total} câu và đạt danh hiệu Giỏi nhé! Cô khen con!`,
      starsCount: 4,
    };
  } else if (percent >= 50) {
    return {
      rank: 'HOÀN THÀNH TỐT' as GradeRank,
      percentText: `${Math.round(percent)}%`,
      badgeIcon: '🏅',
      badgeColor: 'from-emerald-400 via-teal-500 to-emerald-600',
      badgeBorder: 'border-emerald-500',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      ribbonText: 'HOÀN THÀNH TỐT 👏',
      speech: `Rất đáng khen! Con đã trả lời đúng ${score} trên ${total} câu và Hoàn Thành Tốt bài ôn tập! Con tiếp tục phát huy nhé!`,
      starsCount: 3,
    };
  } else {
    return {
      rank: 'HOÀN THÀNH' as GradeRank,
      percentText: `${Math.round(percent)}%`,
      badgeIcon: '🎗️',
      badgeColor: 'from-orange-400 via-amber-500 to-orange-600',
      badgeBorder: 'border-orange-500',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      ribbonText: 'HOÀN THÀNH 💪',
      speech: `Con đã Hoàn Thành bài ôn tập với ${score} trên ${total} câu đúng! Con hãy xem lại bài và cố gắng hơn ở lần sau nhé!`,
      starsCount: 2,
    };
  }
};

export const CertificateCard: React.FC<CertificateCardProps> = ({
  studentName,
  classNameVal,
  lessonTitle,
  score,
  totalQuestions,
  soundEnabled,
}) => {
  const certRef = useRef<HTMLDivElement>(null);
  const grade = getGradeInfo(score, totalQuestions);

  // Format today's date in Vietnamese format
  const today = new Date();
  const dateStr = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const handleSpeakCertificate = () => {
    if (!soundEnabled) return;
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    const fullText = `Giấy Chứng Nhận! Cô giáo khen tặng bé ${studentName}, Lớp ${classNameVal}. Con đã hoàn thành xuất sắc bài ôn tập ${lessonTitle}. Đạt kết quả ${score} trên ${totalQuestions} câu đúng, đạt ${grade.percentText}. Đạt xếp loại ${grade.rank}! ${grade.speech}`;
    soundEngine.speakWithGeminiTTS(fullText);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 16:9 Certificate Frame Container */}
      <div className="w-full flex justify-center">
        <div
          ref={certRef}
          id="certificate-print-area"
          className="w-full max-w-4xl aspect-[16/9] bg-gradient-to-br from-amber-50 via-sky-50 to-orange-50 rounded-3xl p-4 sm:p-6 md:p-8 border-8 border-amber-400 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none print:shadow-none print:border-4"
          style={{
            backgroundImage: `radial-gradient(#f59e0b 0.75px, transparent 0.75px), radial-gradient(#0284c7 0.75px, #fff8f0 0.75px)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px',
          }}
        >
          {/* Inner Decorative Corner Frame */}
          <div className="absolute inset-2 sm:inset-3 border-2 border-amber-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between items-center text-amber-500 font-black text-xs sm:text-base">
              <span>✦ 🌺 ✦</span>
              <span>✦ 🐾 ✦</span>
              <span>✦ 🌺 ✦</span>
            </div>
            <div className="flex justify-between items-center text-amber-500 font-black text-xs sm:text-base">
              <span>✦ 🦁 ✦</span>
              <span>✦ 🦉 ✦</span>
            </div>
            <div className="flex justify-between items-center text-amber-500 font-black text-xs sm:text-base">
              <span>✦ 🌺 ✦</span>
              <span>✦ 🐾 ✦</span>
              <span>✦ 🌺 ✦</span>
            </div>
          </div>

          {/* Certificate Header */}
          <div className="relative z-10 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-sky-900 font-black text-[10px] sm:text-xs md:text-sm tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM • LỚP MẦM NON {classNameVal.toUpperCase()}</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            </div>

            <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-amber-600 tracking-tight drop-shadow-sm uppercase font-serif">
              📜 GIẤY CHỨNG NHẬN 📜
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-600">
              Chương Trình "Tìm Hiểu Về Các Con Vật" — Tác Giả: Cô Lương Thị Ngọc Yến AI
            </p>
          </div>

          {/* Certificate Body */}
          <div className="relative z-10 text-center space-y-2 sm:space-y-3 my-auto">
            <p className="text-xs sm:text-base md:text-lg font-bold text-slate-700">
              Trân trọng trao tặng cho Bé:
            </p>

            <div className="inline-block bg-white/90 border-2 border-amber-400 px-6 sm:px-10 py-1.5 sm:py-2 rounded-2xl shadow-md">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-sky-950 tracking-wide font-serif">
                {studentName}
              </h2>
            </div>

            <p className="text-xs sm:text-sm md:text-base font-bold text-slate-800 max-w-xl mx-auto leading-tight">
              Đã tham gia bài ôn tập: <span className="text-orange-600 font-black">{lessonTitle}</span>
            </p>

            {/* Achievement Badge Section (Rank) */}
            <div className="flex items-center justify-center gap-3 pt-1">
              <div className={`bg-gradient-to-r ${grade.badgeColor} text-white px-5 sm:px-8 py-2 rounded-full font-black text-sm sm:text-xl md:text-2xl shadow-lg border-2 border-white flex items-center gap-2 transform hover:scale-105 transition-transform`}>
                <span className="text-xl sm:text-3xl">{grade.badgeIcon}</span>
                <span>ĐẠT XẾP LOẠI: {grade.rank}</span>
              </div>
            </div>

            {/* Score pill */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-black text-slate-700">
              <span className="bg-white border border-amber-300 px-3 py-1 rounded-full shadow-sm text-emerald-700">
                ✅ Trả lời đúng: {score}/{totalQuestions} câu ({grade.percentText})
              </span>
              <div className="flex gap-0.5 text-amber-500 text-sm sm:text-base">
                {Array.from({ length: grade.starsCount }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>
            </div>
          </div>

          {/* Certificate Footer / Signatures */}
          <div className="relative z-10 flex items-end justify-between px-2 sm:px-6 text-slate-800 text-[10px] sm:text-xs md:text-sm font-bold">
            {/* Left: Class stamp */}
            <div className="text-center space-y-1">
              <p className="italic text-slate-600">{dateStr}</p>
              <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-full border-2 border-dashed border-sky-400 bg-sky-100/80 flex flex-col items-center justify-center text-[9px] sm:text-xs font-black text-sky-950 shadow-inner">
                <span>💮 DẤU ẤN</span>
                <span>LỚP {classNameVal.toUpperCase()}</span>
              </div>
              <p className="font-black text-sky-900">Ban Giám Hiệu Lớp Học</p>
            </div>

            {/* Center: Encouragement summary */}
            <div className="hidden sm:block text-center max-w-xs text-[10px] sm:text-xs font-bold text-amber-900 bg-white/70 p-2 rounded-xl border border-amber-200">
              "{grade.speech}"
            </div>

            {/* Right: Author Signature */}
            <div className="text-center space-y-1">
              <p className="text-slate-600 font-medium">Tác giả & Giáo viên AI</p>
              <div className="h-8 sm:h-12 flex items-center justify-center font-serif text-lg sm:text-2xl text-orange-600 font-black italic">
                Lương Thị Ngọc Yến
              </div>
              <p className="font-black text-orange-950">Cô Lương Thị Ngọc Yến AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls below Certificate */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 no-print">
        <button
          onClick={handleSpeakCertificate}
          className="bg-orange-500 hover:bg-orange-400 text-white font-black px-5 py-2.5 rounded-2xl border-2 border-orange-700 shadow-md flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
        >
          <Volume2 className="w-5 h-5" />
          <span>🔊 Nghe đọc Giấy Chứng Nhận</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-sky-500 hover:bg-sky-400 text-white font-black px-5 py-2.5 rounded-2xl border-2 border-sky-700 shadow-md flex items-center gap-2 text-sm active:scale-95 cursor-pointer"
        >
          <Printer className="w-5 h-5" />
          <span>🖨️ In / Tải Chứng Nhận (16:9)</span>
        </button>
      </div>
    </div>
  );
};
