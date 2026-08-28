import React, { useState } from 'react';
import { QuizQuestion, DifficultyLevel, LessonId } from '../types';
import { QUESTIONS_BANK, LESSONS_CONFIG, DIFFICULTY_CONFIG } from '../data/questions';
import { soundEngine } from '../utils/audio';
import { CertificateCard, getGradeInfo } from './CertificateCard';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Layers, 
  Sliders, 
  Check, 
  FileText, 
  GraduationCap, 
  UserCheck, 
  ListOrdered,
  Users,
  User,
  Star,
  Award,
  Crown
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReviewQuizViewProps {
  soundEnabled: boolean;
  classNameVal: string;
  setClassNameVal: (val: string) => void;
  onQuizCompleted: (score: number) => void;
}

export const ReviewQuizView: React.FC<ReviewQuizViewProps> = ({
  soundEnabled,
  classNameVal,
  setClassNameVal,
  onQuizCompleted,
}) => {
  // Config States
  const [selectedLesson, setSelectedLesson] = useState<LessonId>('bai_all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('tong_hop');
  const [questionCount, setQuestionCount] = useState<number>(5); // Default 5 questions (max 15)
  const [activeTab, setActiveTab] = useState<'setup' | 'document' | 'testing' | 'result'>('setup');

  // Participation Mode States
  const [playMode, setPlayMode] = useState<'individual' | 'turn_based'>('turn_based');
  const [studentListRaw, setStudentListRaw] = useState<string>('Bé An, Bé Bình, Bé Chi, Bé Dũng, Bé Mây, Bé Gấu');

  // Quiz Execution States
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState<number>(0);

  // Turn-Based Multi-Student Tracking
  const [parsedStudents, setParsedStudents] = useState<string[]>([]);
  const [studentScores, setStudentScores] = useState<Record<string, number>>({});
  const [studentAttempts, setStudentAttempts] = useState<Record<string, number>>({});
  const [selectedCertStudent, setSelectedCertStudent] = useState<string>('');

  // Pre-configured Class options
  const defaultClasses = ['Chồi 1', 'Chồi 2', 'Chồi 3', 'Mầm 1', 'Mầm 2', 'Lá 1', 'Lá 2'];

  // Parse student names helper
  const getStudentsArray = (): string[] => {
    const list = studentListRaw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return list.length > 0 ? list : ['Bé 1', 'Bé 2', 'Bé 3'];
  };

  // Get current active student name
  const getCurrentStudentName = (qIdx: number): string => {
    if (playMode === 'individual' || parsedStudents.length === 0) {
      return `Bé Lớp ${classNameVal}`;
    }
    return parsedStudents[qIdx % parsedStudents.length];
  };

  // Read full question and option answers in Hanoi preschool teacher voice
  const handleReadFullQuestionAndOptions = (q: QuizQuestion, studentName?: string) => {
    if (!soundEnabled) return;
    const optionLabels = ['Á', 'Bê', 'Cê', 'Đê'];
    const optionsSpeech = q.options
      .map((opt, i) => `Đáp án ${optionLabels[i] || i + 1}: ${opt.text}`)
      .join('. ');

    let speechPrefix = '';
    if (playMode === 'turn_based' && studentName) {
      speechPrefix = `Cô mời bạn ${studentName} chọn đáp án nhé! `;
    }

    const speechText = `${speechPrefix}Câu hỏi dành cho các con là: ${q.prompt}. ${optionsSpeech}`;
    soundEngine.speakWithGeminiTTS(speechText);
  };

  // Read single option in Vietnamese
  const handleReadSingleOption = (e: React.MouseEvent, label: string, optionText: string) => {
    e.stopPropagation(); // prevent clicking option
    if (!soundEnabled) return;
    const labelMap: Record<string, string> = { 'A': 'Á', 'B': 'Bê', 'C': 'Cê', 'D': 'Đê' };
    const vnLabel = labelMap[label] || label;
    soundEngine.speakWithGeminiTTS(`Đáp án ${vnLabel}: ${optionText}`);
  };

  // Start the customized test with complete backfill guarantee & student turn setup
  const handleStartTest = () => {
    const students = getStudentsArray();
    setParsedStudents(students);

    // Reset student score tracking
    const initialScores: Record<string, number> = {};
    const initialAttempts: Record<string, number> = {};
    students.forEach((st) => {
      initialScores[st] = 0;
      initialAttempts[st] = 0;
    });
    setStudentScores(initialScores);
    setStudentAttempts(initialAttempts);

    // 1. Filter questions strictly matching lesson and level
    let filtered = QUESTIONS_BANK.filter((q) => {
      const matchLesson = selectedLesson === 'bai_all' || q.lessonId === selectedLesson;
      const matchLevel = selectedDifficulty === 'tong_hop' || q.level === selectedDifficulty;
      return matchLesson && matchLevel;
    });

    // 2. Backfill if strict filter has fewer questions than requested questionCount
    if (filtered.length < questionCount) {
      if (selectedLesson !== 'bai_all') {
        const sameLessonExtras = QUESTIONS_BANK.filter(
          (q) => q.lessonId === selectedLesson && !filtered.some((f) => f.id === q.id)
        );
        filtered = [...filtered, ...sameLessonExtras];
      }
    }

    // 3. Backfill from entire bank if still fewer
    if (filtered.length < questionCount) {
      const allExtras = QUESTIONS_BANK.filter((q) => !filtered.some((f) => f.id === q.id));
      filtered = [...filtered, ...allExtras];
    }

    // Shuffle and slice to EXACT questionCount (max 15)
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const finalSet = shuffled.slice(0, Math.min(questionCount, 15));

    setActiveQuestions(finalSet);
    setCurrentIndex(0);
    setUserAnswers(new Array(finalSet.length).fill(null));
    setScore(0);
    setActiveTab('testing');

    if (soundEnabled && finalSet.length > 0) {
      const firstStudent = students[0];
      if (playMode === 'turn_based') {
        soundEngine.speakWithGeminiTTS(
          `Xin chào các con! Hôm nay cô và các con lớp ${classNameVal} cùng tham gia một hoạt động thật vui nhé! Bây giờ cô mời bạn ${firstStudent} lắng nghe câu hỏi đầu tiên nào!`
        );
      } else {
        soundEngine.speakWithGeminiTTS(
          `Xin chào các con! Hôm nay cô và các con lớp ${classNameVal} cùng tham gia bài ôn tập thật vui nhé! Các con hãy lắng nghe câu hỏi nào!`
        );
      }

      setTimeout(() => {
        handleReadFullQuestionAndOptions(finalSet[0], firstStudent);
      }, 1600);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (userAnswers[currentIndex] !== null) return; // Prevent changing after answer

    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = optionIndex;
    setUserAnswers(newAnswers);

    const currentQ = activeQuestions[currentIndex];
    const isCorrect = optionIndex === currentQ.correctIndex;
    const currentStudent = getCurrentStudentName(currentIndex);

    // Update attempts & scores for current child
    if (playMode === 'turn_based' && currentStudent) {
      setStudentAttempts((prev) => ({
        ...prev,
        [currentStudent]: (prev[currentStudent] || 0) + 1,
      }));
    }

    if (isCorrect) {
      setScore((prev) => prev + 1);

      if (playMode === 'turn_based' && currentStudent) {
        setStudentScores((prev) => ({
          ...prev,
          [currentStudent]: (prev[currentStudent] || 0) + 1,
        }));
      }

      if (soundEnabled) {
        soundEngine.playSuccessSound(); // Grand Fanfare sound
        
        // Celebratory Confetti burst
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => {
          confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 } });
        }, 150);

        const praiseText = playMode === 'turn_based'
          ? `Giỏi quá! Bạn ${currentStudent} đã trả lời chính xác rồi! Cô khen ${currentStudent} nhé!`
          : 'Giỏi quá! Con đã trả lời chính xác rồi! Cô khen con!';

        setTimeout(() => soundEngine.speakWithGeminiTTS(praiseText), 300);
      }
    } else {
      if (soundEnabled) {
        soundEngine.playWrongSound(); // Gentle encouraging sound
        const encourageText = playMode === 'turn_based'
          ? `Không sao đâu bạn ${currentStudent} ơi! Con thử suy nghĩ lại và cố gắng ở câu tiếp theo nhé!`
          : 'Không sao đâu con! Con thử suy nghĩ lại và cố gắng ở câu tiếp theo nhé!';

        setTimeout(() => soundEngine.speakWithGeminiTTS(encourageText), 300);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextStudent = getCurrentStudentName(nextIdx);

      if (soundEnabled) {
        if (playMode === 'turn_based') {
          soundEngine.speakWithGeminiTTS(`Rất giỏi! Bây giờ chúng mình cùng đến với lượt của bạn ${nextStudent} nào!`);
          setTimeout(() => {
            handleReadFullQuestionAndOptions(activeQuestions[nextIdx], nextStudent);
          }, 1200);
        } else {
          handleReadFullQuestionAndOptions(activeQuestions[nextIdx]);
        }
      }
    } else {
      // Quiz Finished!
      setActiveTab('result');
      if (soundEnabled) {
        soundEngine.playSuccessSound();
        if (playMode === 'turn_based') {
          soundEngine.speakWithGeminiTTS(
            `Hoan hô tất cả các con lớp ${classNameVal}! Các con đã hoàn thành xuất sắc bài ôn tập rồi! Cô khen cả lớp chúng mình nhé!`
          );
        } else {
          soundEngine.speakWithGeminiTTS(
            `Hoan hô con! Con đã hoàn thành xuất sắc bài ôn tập đạt ${score} trên ${activeQuestions.length} câu đúng! Cô khen con rất nhiều!`
          );
        }
      }
      
      // Grand celebratory finale fireworks
      confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      onQuizCompleted(score);
    }
  };

  const currentQuestion = activeQuestions[currentIndex];
  const activeStudentName = getCurrentStudentName(currentIndex);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner - Tên App & Tác Giả & Lớp Học - Tông Màu Xanh Dương & Cam */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-orange-500 rounded-3xl p-5 md:p-6 text-white shadow-xl border-4 border-sky-300 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-white/95 px-3.5 py-1 rounded-full text-xs font-black text-sky-900 shadow-sm">
            <GraduationCap className="w-4 h-4 text-orange-600" />
            <span>Tác giả: Cô Lương Thị Ngọc Yến AI</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
            Tìm hiểu về các con vật 🐾
          </h1>
          <p className="text-xs md:text-sm font-bold text-sky-100">
            Ứng dụng hỗ trợ học sinh mầm non nhận biết & ôn tập nhiều trẻ tham gia
          </p>
        </div>

        {/* Ô Nhập Lớp Học */}
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl border-2 border-orange-400 shadow-lg flex flex-col sm:flex-row items-center gap-2 shrink-0">
          <span className="font-black text-sky-950 text-xs md:text-sm flex items-center gap-1">
            <UserCheck className="w-4 h-4 text-orange-600" />
            Lớp học:
          </span>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={classNameVal}
              onChange={(e) => setClassNameVal(e.target.value)}
              placeholder="Nhập lớp..."
              className="w-24 px-2.5 py-1 rounded-xl border-2 border-sky-400 bg-sky-50 text-sky-950 font-black text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            
            <select
              value={defaultClasses.includes(classNameVal) ? classNameVal : 'Khác'}
              onChange={(e) => {
                if (e.target.value !== 'Khác') setClassNameVal(e.target.value);
              }}
              className="px-2 py-1 rounded-xl border-2 border-orange-300 bg-white font-bold text-xs text-sky-950 focus:outline-none cursor-pointer"
            >
              {defaultClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
              <option value="Khác">Tùy chỉnh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex justify-center gap-2 bg-white p-2 rounded-2xl border-2 border-sky-200 shadow-sm">
        <button
          onClick={() => setActiveTab('setup')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all ${
            activeTab === 'setup' || activeTab === 'testing' || activeTab === 'result'
              ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
              : 'text-slate-700 hover:bg-sky-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Cấu Hình Hoạt Động</span>
        </button>

        <button
          onClick={() => setActiveTab('document')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all ${
            activeTab === 'document'
              ? 'bg-orange-500 text-white shadow-md ring-2 ring-orange-300'
              : 'text-slate-700 hover:bg-orange-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tài Liệu Bài Học</span>
        </button>
      </div>

      {/* TAB 1: SETUP TEST */}
      {activeTab === 'setup' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 border-4 border-sky-300 shadow-xl space-y-6"
        >
          <div className="border-b-2 border-sky-100 pb-4 text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-black text-sky-950">
              ⚙️ Cấu Hình Đề Ôn Tập & Hoạt Động Lớp <span className="text-orange-600">{classNameVal}</span>
            </h2>
            <p className="text-slate-600 font-bold text-xs md:text-sm">
              Biên soạn bởi Cô Lương Thị Ngọc Yến AI • Giọng đọc trẻ em dễ thương trong sáng
            </p>
          </div>

          {/* HÌNH THỨC THAM GIA: CÁ NHÂN HOẶC NHIỀU TRẺ LẦN LƯỢT */}
          <div className="space-y-3 bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-2xl border-2 border-orange-300">
            <label className="font-black text-orange-950 text-sm md:text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              1. Hình thức cho trẻ tham gia hoạt động:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlayMode('turn_based')}
                className={`p-3.5 rounded-2xl border-3 text-left transition-all flex items-start gap-3 cursor-pointer ${
                  playMode === 'turn_based'
                    ? 'bg-orange-500 text-white border-orange-700 ring-2 ring-orange-300 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-orange-100/50'
                }`}
              >
                <Users className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-sm md:text-base">Nhiều trẻ lần lượt tham gia 🌟</h4>
                  <p className={`text-xs mt-0.5 ${playMode === 'turn_based' ? 'text-orange-100' : 'text-slate-600'}`}>
                    Các bé trong lớp thay nhau lên chọn đáp án từng câu hỏi
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPlayMode('individual')}
                className={`p-3.5 rounded-2xl border-3 text-left transition-all flex items-start gap-3 cursor-pointer ${
                  playMode === 'individual'
                    ? 'bg-sky-500 text-white border-sky-700 ring-2 ring-sky-300 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-sky-100/50'
                }`}
              >
                <User className="w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-black text-sm md:text-base">Cá nhân / Cả lớp chung</h4>
                  <p className={`text-xs mt-0.5 ${playMode === 'individual' ? 'text-sky-100' : 'text-slate-600'}`}>
                    Một bé hoặc cả lớp cùng trả lời từ đầu đến cuối
                  </p>
                </div>
              </button>
            </div>

            {/* Nếu chọn chơi nhiều trẻ -> Cho nhập danh sách tên các bé */}
            {playMode === 'turn_based' && (
              <div className="pt-2 space-y-2">
                <span className="text-xs font-black text-orange-950 flex items-center gap-1">
                  ✍️ Danh sách tên các trẻ tham gia lượt chơi (cách nhau bởi dấu phẩy):
                </span>
                <input
                  type="text"
                  value={studentListRaw}
                  onChange={(e) => setStudentListRaw(e.target.value)}
                  placeholder="Ví dụ: Bé An, Bé Bình, Bé Chi, Bé Dũng, Bé Mây..."
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-orange-400 bg-white font-bold text-xs md:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-orange-900">Mẫu nhanh:</span>
                  {[
                    'Bé An, Bé Bình, Bé Chi, Bé Dũng, Bé Mây',
                    'Bé Gấu, Bé Bắp, Bé Cà Rốt, Bé Thỏ',
                    'Bé 1, Bé 2, Bé 3, Bé 4, Bé 5, Bé 6',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setStudentListRaw(preset)}
                      className="text-[11px] bg-white border border-orange-300 hover:bg-orange-100 px-2.5 py-0.5 rounded-full font-bold text-orange-950 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CHỌN BÀI HỌC */}
          <div className="space-y-3">
            <label className="font-black text-sky-950 text-sm md:text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-600" />
              2. Chọn Bài Học (Chủ đề):
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LESSONS_CONFIG.map((lesson) => {
                const isSelected = selectedLesson === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson.id as LessonId)}
                    className={`p-4 rounded-2xl border-3 text-left transition-all relative flex items-start gap-3 active:scale-98 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-300 shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:bg-sky-50/50'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{lesson.emoji}</span>
                    <div>
                      <h4 className="font-black text-sky-950 text-sm md:text-base leading-tight">
                        {lesson.title}
                      </h4>
                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        {lesson.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-sky-500 text-white p-1 rounded-full shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHỌN MỨC ĐỘ */}
          <div className="space-y-3">
            <label className="font-black text-sky-950 text-sm md:text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              3. Mức Độ (Nhận Bằng, Thông Hiểu, Vận Dụng, Tổng Hợp 3 Mức Độ):
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIFFICULTY_CONFIG.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id as DifficultyLevel)}
                    className={`p-3 rounded-2xl border-3 text-center transition-all flex flex-col items-center justify-between active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-700 shadow-md scale-102 ring-2 ring-orange-300'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-2xl mb-1">{diff.emoji}</span>
                    <span className="font-black text-xs md:text-sm">{diff.label}</span>
                    <span className={`text-[10px] font-semibold mt-1 leading-tight ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                      {diff.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHỌN SỐ LƯỢNG CÂU HỎI */}
          <div className="space-y-3 bg-sky-50/80 p-4 rounded-2xl border-2 border-sky-200">
            <div className="flex items-center justify-between">
              <label className="font-black text-sky-950 text-sm md:text-base flex items-center gap-2">
                <ListOrdered className="w-5 h-5 text-orange-600" />
                4. Số lượng câu hỏi hoạt động:
              </label>
              <span className="bg-orange-500 text-white font-black px-3.5 py-1 rounded-full text-sm shadow-sm">
                {questionCount} Câu
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                className="w-full accent-orange-500 h-3 bg-sky-200 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex justify-between gap-2 pt-1 flex-wrap">
              {[3, 5, 8, 10, 12, 15].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setQuestionCount(cnt)}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-300'
                      : 'bg-white text-slate-700 border border-sky-200 hover:bg-sky-100'
                  }`}
                >
                  {cnt} câu
                </button>
              ))}
            </div>
          </div>

          {/* START BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black py-4 rounded-2xl border-3 border-orange-700 shadow-xl flex items-center justify-center gap-3 text-lg md:text-xl active:scale-98 transition-transform cursor-pointer"
            >
              <Play className="w-7 h-7 fill-white" />
              <span>Bắt Đầu Hoạt Động (Lớp {classNameVal})</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* TAB 2: TÀI LIỆU ÔN TẬP */}
      {activeTab === 'document' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 border-4 border-orange-300 shadow-xl space-y-6"
        >
          <div className="border-b-2 border-orange-100 pb-4 text-center">
            <span className="bg-orange-100 text-orange-900 font-bold px-3 py-1 rounded-full text-xs">
              Tài Liệu Ôn Tập - Tác giả Cô Lương Thị Ngọc Yến AI
            </span>
            <h2 className="text-2xl font-black text-sky-950 mt-2">
              📖 Tài Liệu Tóm Tắt Kiến Thức Về Các Con Vật
            </h2>
            <p className="text-slate-600 text-xs md:text-sm font-semibold mt-1">
              Bé hãy lắng nghe và học kỹ tài liệu này trước khi kiểm tra nhé!
            </p>
          </div>

          <div className="space-y-6">
            {/* Bài 1 Doc */}
            <div className="bg-sky-50 rounded-2xl p-4 border-2 border-sky-300 space-y-3">
              <h3 className="font-black text-sky-950 text-lg flex items-center gap-2">
                <span>🏡</span> Bài 1: Con vật nuôi trong gia đình & Nông trại
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm font-semibold text-slate-800 pl-2">
                <li><strong className="text-sky-900">Con Mèo:</strong> Bắt chuột giỏi, kêu "Meo meo~", thích ăn cá.</li>
                <li><strong className="text-sky-900">Con Chó:</strong> Trung thành trông nhà, kêu "Gâu gâu!", thích gặm xương.</li>
                <li><strong className="text-sky-900">Con Gà Trống:</strong> Có mào đỏ rực, gáy "Ó ó o~" báo thức sáng sớm.</li>
                <li><strong className="text-sky-900">Con Bò Sữa:</strong> Cho nguồn sữa tươi ngọt ngào bổ dưỡng.</li>
                <li><strong className="text-sky-900">Con Vịt:</strong> Đôi chân có màng bơi dưới nước rất giỏi, kêu "Cạc cạc!".</li>
                <li><strong className="text-sky-900">Con Thỏ:</strong> Đôi tai dài, mắt hồng xoe, thích ăn củ Cà Rốt.</li>
              </ul>
              <button
                onClick={() => soundEngine.speakVietnamese('Bài một: Con vật nuôi trong gia đình, gồm có bạn Mèo bắt chuột, bạn Chó trông nhà, bạn Gà Trống gáy ó ó o, bạn Bò Sữa cho sữa tươi, bạn Vịt bơi chân màng và bạn Thỏ thích ăn cà rốt.')}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-sky-600 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Đọc cho các bé nghe Bài 1
              </button>
            </div>

            {/* Bài 2 Doc */}
            <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-300 space-y-3">
              <h3 className="font-black text-orange-950 text-lg flex items-center gap-2">
                <span>🌴</span> Bài 2: Động vật hoang dã & Rừng xanh
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm font-semibold text-slate-800 pl-2">
                <li><strong className="text-orange-900">Sư Tử:</strong> Bờm xù oai phong, mệnh danh là Chúa tể rừng xanh.</li>
                <li><strong className="text-orange-900">Con Voi:</strong> Chiếc vòi dài hút nước, đôi tai to như quạt xòe.</li>
                <li><strong className="text-orange-900">Hươu Cao Cổ:</strong> Có chiếc cổ cao nhất thế giới ăn lá cây trên cao.</li>
                <li><strong className="text-orange-900">Con Khỉ:</strong> Chuyền cành nhanh nhẹn, thích ăn nhất quả chuối chín.</li>
                <li><strong className="text-orange-900">Con Gấu:</strong> Lông dày ấm áp, rất mê liếm Mật Ong ngọt lịm.</li>
              </ul>
              <button
                onClick={() => soundEngine.speakVietnamese('Bài hai: Động vật trong rừng xanh, gồm có bạn Sư Tử chúa tể, bạn Voi vòi dài, bạn Hươu Cao Cổ cổ cao ăn lá, bạn Khỉ thích ăn chuối và bạn Gấu mê mật ong.')}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-orange-600 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Đọc cho các bé nghe Bài 2
              </button>
            </div>

            {/* Bài 3 Doc */}
            <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-300 space-y-3">
              <h3 className="font-black text-blue-950 text-lg flex items-center gap-2">
                <span>🌊</span> Bài 3: Thế giới dưới nước & Côn trùng
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm font-semibold text-slate-800 pl-2">
                <li><strong className="text-blue-900">Cá Heo:</strong> Bơi biển khơi, thông minh nhào lộn thân thiện.</li>
                <li><strong className="text-blue-900">Con Cua:</strong> 8 chân 2 càng, bò ngang ngộ nghĩnh.</li>
                <li><strong className="text-blue-900">Con Rùa:</strong> Có chiếc Mai Rùa cứng cáp che chở trên lưng.</li>
                <li><strong className="text-blue-900">Con Ếch:</strong> Kêu "Ợp ộp", nhảy tưng tưng trên lá sen.</li>
                <li><strong className="text-blue-900">Chú Ong:</strong> Bay chăm chỉ hút mật hoa làm mật ong thơm ngọt.</li>
              </ul>
              <button
                onClick={() => soundEngine.speakVietnamese('Bài ba: Động vật dưới nước và côn trùng, gồm có bạn Cá Heo thông minh, bạn Cua bò ngang, bạn Rùa mai cứng, bạn Ếch kêu ợp ộp và bạn Ong chăm chỉ làm mật.')}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-blue-600 shadow-sm cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Đọc cho các bé nghe Bài 3
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('setup')}
              className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black py-3.5 rounded-2xl border-2 border-sky-700 shadow-md text-base cursor-pointer"
            >
              ➡️ Bé đã học xong, sang phần làm bài trắc nghiệm ngay!
            </button>
          </div>
        </motion.div>
      )}

      {/* TAB 3: TESTING ACTIVE */}
      {activeTab === 'testing' && currentQuestion && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-6 md:p-8 border-4 border-sky-300 shadow-2xl space-y-6"
        >
          {/* BANNER HIỂN THỊ NỔI BẬT LƯỢT CHƠI CỦA BÉ HỌC SINH */}
          {playMode === 'turn_based' && activeStudentName && (
            <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white p-3.5 rounded-2xl border-2 border-orange-700 shadow-lg flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-[10px] font-black uppercase text-orange-100 tracking-wider">
                    Lượt chọn đáp án:
                  </div>
                  <div className="text-lg md:text-xl font-black tracking-tight">
                    Mời bé: <span className="bg-white text-orange-950 px-2.5 py-0.5 rounded-lg border border-orange-300">{activeStudentName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => soundEngine.speakVietnamese(`Cô xin mời bạn ${activeStudentName} lên chọn câu trả lời nhé! Bạn ${activeStudentName} cố lên nào!`)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 border border-white/40 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Gọi tên bé
              </button>
            </div>
          )}

          {/* Header Progress bar */}
          <div className="flex items-center justify-between bg-sky-50 p-3 rounded-2xl border border-sky-200">
            <div className="font-black text-sky-950 text-sm md:text-base flex items-center gap-2">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs">
                Lớp {classNameVal}
              </span>
              <span>Câu hỏi {currentIndex + 1} / {activeQuestions.length}</span>
            </div>

            <div className="font-black text-emerald-800 text-sm flex items-center gap-1">
              <span>Đúng:</span>
              <span className="text-emerald-600 text-lg font-black">{score}</span>
            </div>
          </div>

          {/* Question Level Badge & Read Speech buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="bg-sky-100 text-sky-950 border border-sky-300 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Mức độ: {currentQuestion.level === 'nhan_biet' ? '1. Nhận biết' : currentQuestion.level === 'thong_hieu' ? '2. Thông hiểu' : '3. Vận dụng'}
            </span>

            {/* Read question and ALL answer options out loud */}
            <button
              onClick={() => handleReadFullQuestionAndOptions(currentQuestion, activeStudentName)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-3.5 py-1.5 rounded-xl border border-orange-600 text-xs shadow-md active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>🔊 Đọc toàn bộ câu hỏi & đáp án</span>
            </button>
          </div>

          {/* Stem text */}
          <div className="bg-sky-50/90 p-4 md:p-5 rounded-2xl border-2 border-sky-200 flex items-center justify-between gap-3">
            <h3 className="text-xl md:text-2xl font-black text-sky-950 leading-snug">
              {currentQuestion.prompt}
            </h3>

            {currentQuestion.soundTypeToPlay && (
              <button
                onClick={() => soundEngine.playAnimalSound(currentQuestion.soundTypeToPlay!)}
                className="shrink-0 bg-sky-500 hover:bg-sky-400 text-white p-2.5 rounded-full shadow-md active:scale-95 cursor-pointer"
                title="Nghe tiếng kêu con vật"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Options Grid with Speech icon per option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const optionLabels = ['A', 'B', 'C', 'D'];
              const hasAnswered = userAnswers[currentIndex] !== null;
              const isUserChoice = userAnswers[currentIndex] === idx;
              const isCorrectOpt = idx === currentQuestion.correctIndex;

              let style = 'bg-white border-sky-300 text-sky-950 hover:border-orange-400 hover:bg-orange-50/50';
              if (hasAnswered) {
                if (isCorrectOpt) {
                  style = 'bg-emerald-500 text-white border-emerald-700 ring-4 ring-emerald-300';
                } else if (isUserChoice) {
                  style = 'bg-rose-500 text-white border-rose-700 opacity-90';
                } else {
                  style = 'opacity-40 bg-slate-100 border-slate-200';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-2xl border-3 font-black text-base md:text-lg shadow-md transition-all flex items-center gap-3 text-left relative cursor-pointer ${style}`}
                >
                  <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-950 text-xs flex items-center justify-center shrink-0 border border-orange-300">
                    {optionLabels[idx]}
                  </span>

                  {opt.imageUrl && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-white shrink-0">
                      <img src={opt.imageUrl} alt={opt.text} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <span className="leading-tight flex-1">{opt.text}</span>

                  {/* Individual option speech reader button */}
                  <div
                    onClick={(e) => handleReadSingleOption(e, optionLabels[idx], opt.text)}
                    className="p-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 shrink-0 ml-1 transition-colors"
                    title={`Đọc đáp án ${optionLabels[idx]}`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </div>

                  {hasAnswered && isCorrectOpt && (
                    <CheckCircle2 className="w-6 h-6 text-white shrink-0" />
                  )}
                  {hasAnswered && isUserChoice && !isCorrectOpt && (
                    <XCircle className="w-6 h-6 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Next Button */}
          {userAnswers[currentIndex] !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-300 space-y-3"
            >
              <div className="text-emerald-950 font-bold text-sm md:text-base">
                💡 <strong className="text-emerald-900">Giải thích từ cô giáo:</strong> {currentQuestion.explanation}
              </div>

              <button
                onClick={handleNextQuestion}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-3.5 rounded-2xl border-2 border-orange-700 shadow-lg flex items-center justify-center gap-2 text-base active:scale-95 cursor-pointer"
              >
                <span>
                  {currentIndex < activeQuestions.length - 1
                    ? `Chuyển lượt kế tiếp (${getCurrentStudentName(currentIndex + 1)}) ➡️`
                    : '🏆 Xem Bảng Vàng Tuyên Dương Các Bé'}
                </span>
              </button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* TAB 4: RESULT SUMMARY & 16:9 CERTIFICATE CARD */}
      {activeTab === 'result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 md:p-8 border-4 border-sky-300 shadow-2xl text-center space-y-6"
        >
          <div className="text-6xl animate-bounce">🏆</div>

          <div className="space-y-2">
            <span className="bg-sky-100 text-sky-950 font-black px-4 py-1.5 rounded-full text-sm">
              KẾT QUẢ HOẠT ĐỘNG ÔN TẬP LỚP: {classNameVal.toUpperCase()}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-sky-950 mt-2">
              Hoan Hô Tất Cả Các Bé Đã Hoàn Thành Rất Giỏi!
            </h2>
            <p className="text-slate-600 font-bold text-sm">
              Tác giả: Cô Lương Thị Ngọc Yến AI • Giọng nữ Hà Nội nhẹ nhàng dễ thương
            </p>
          </div>

          {/* BẢNG TUYÊN DƯƠNG CHO NHIỀU TRẺ THAM GIA */}
          {playMode === 'turn_based' && parsedStudents.length > 0 && (
            <div className="bg-gradient-to-b from-orange-50 to-amber-50 p-5 rounded-3xl border-3 border-orange-300 space-y-4 shadow-inner">
              <h3 className="font-black text-orange-950 text-lg md:text-xl flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-amber-500 fill-amber-400" />
                BẢNG VÀNG TUYÊN DƯƠNG CÁC BÉ LỚP {classNameVal.toUpperCase()}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {parsedStudents.map((stName, idx) => {
                  const correctCount = studentScores[stName] || 0;
                  const totalCount = studentAttempts[stName] || 0;
                  const isSelectedForCert = selectedCertStudent === stName || (!selectedCertStudent && idx === 0);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedCertStudent(stName)}
                      className={`p-3.5 rounded-2xl border-2 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelectedForCert
                          ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-300 scale-102'
                          : 'bg-white border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-orange-400 text-white font-black text-sm flex items-center justify-center shrink-0 border border-orange-500">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-black text-sky-950 text-sm md:text-base">
                            {stName}
                          </div>
                          <div className="text-xs font-bold text-emerald-600">
                            Trả lời đúng {correctCount} câu
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-200 px-3 py-1 rounded-xl border border-amber-400 text-amber-950 font-black text-xs">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                        <span>{correctCount} Sao</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 16:9 GIẤY CHỨNG NHẬN TRỰC QUAN NỔI BẬT */}
          <div className="pt-2">
            <div className="text-center mb-4">
              <span className="bg-amber-100 text-amber-950 border border-amber-300 font-black px-4 py-1.5 rounded-full text-xs md:text-sm">
                📜 GIẤY CHỨNG NHẬN DÀNH CHO HỌC SINH (KHUÔN CHUẨN 16:9)
              </span>
            </div>

            <CertificateCard
              studentName={
                playMode === 'turn_based'
                  ? selectedCertStudent || parsedStudents[0] || `Bé Lớp ${classNameVal}`
                  : `Bé Lớp ${classNameVal}`
              }
              classNameVal={classNameVal}
              lessonTitle={
                LESSONS_CONFIG.find((l) => l.id === selectedLesson)?.title || 'Bài Ôn Tập Các Con Vật'
              }
              score={
                playMode === 'turn_based'
                  ? studentScores[selectedCertStudent || parsedStudents[0]] || score
                  : score
              }
              totalQuestions={
                playMode === 'turn_based'
                  ? studentAttempts[selectedCertStudent || parsedStudents[0]] || activeQuestions.length
                  : activeQuestions.length
              }
              soundEnabled={soundEnabled}
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => setActiveTab('setup')}
              className="bg-sky-500 hover:bg-sky-400 text-white font-black px-6 py-3 rounded-2xl border-2 border-sky-700 shadow-md text-base active:scale-95 cursor-pointer"
            >
              🔄 Tùy chỉnh đề ôn tập khác
            </button>

            <button
              onClick={handleStartTest}
              className="bg-orange-500 hover:bg-orange-400 text-white font-black px-6 py-3 rounded-2xl border-2 border-orange-700 shadow-md text-base active:scale-95 cursor-pointer"
            >
              🎮 Tổ chức lượt mới
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
