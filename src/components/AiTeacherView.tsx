import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { Volume2, Sparkles, Send, Loader2, BookOpen, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AiTeacherViewProps {
  soundEnabled: boolean;
  onAskedOwl: () => void;
}

export const AiTeacherView: React.FC<AiTeacherViewProps> = ({ soundEnabled, onAskedOwl }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>(
    'Xin chào bé ngoan! Thầy là Cú Cú thông thái đây! Bé muốn hỏi thầy điều gì về thế giới con vật rực rỡ hôm nay nè?'
  );
  const [loading, setLoading] = useState<boolean>(false);

  const predefinedPrompts = [
    { label: '🧩 Xin 1 câu đố vui con vật', mode: 'riddle', text: 'Thầy Cú Cú đố bé 1 câu đố vui về con vật nhé!' },
    { label: '📖 Kể câu chuyện bạn Voi', mode: 'story', text: 'Thầy Cú Cú kể cho bé nghe một câu chuyện ngắn đáng yêu về bạn Voi tốt bụng!' },
    { label: '🍎 Con thỏ thích ăn gì?', mode: 'ask', text: 'Tại sao con thỏ lại thích ăn củ cà rốt vậy thầy Cú Cú?' },
    { label: '🐯 Con hổ sống ở đâu?', mode: 'ask', text: 'Con hổ sống ở đâu và tại sao chú ấy lại gầm to thế thầy?' },
    { label: '🐬 Cá heo thông minh thế nào?', mode: 'ask', text: 'Thầy ơi, cá heo sống ở biển có thông minh không ạ?' },
  ];

  const handleAsk = async (customText?: string, mode: string = 'ask') => {
    const textToAsk = customText || prompt;
    if (!textToAsk.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/gemini/ask-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAsk, mode }),
      });

      const data = await res.json();
      if (data.text) {
        setResponse(data.text);
        if (soundEnabled) {
          soundEngine.speakVietnamese(data.text);
        }
        onAskedOwl();
      } else {
        setResponse('Thầy Cú Cú chưa nghe rõ lắm, bé hỏi lại thầy nhé!');
      }
    } catch (e) {
      console.error(e);
      setResponse('Thầy Cú Cú đang tìm sách giải đáp. Bé thử bấm lại lần nữa nha!');
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleSpeakResponse = () => {
    if (response) {
      soundEngine.speakVietnamese(response);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Banner Teacher Owl */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden border-4 border-indigo-300">
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-6xl shadow-inner border-2 border-white/40 shrink-0 animate-bounce">
          🦉
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl sm:text-3xl font-black drop-shadow-md">
            Thầy Giáo Cú Cú Thông Thái 🦉
          </h2>
          <p className="text-indigo-100 font-bold text-sm sm:text-base">
            Giải đáp mọi thắc mắc ngộ nghĩnh & kể chuyện con vật cho bé nghe!
          </p>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="space-y-2">
        <span className="text-xs font-black text-amber-900 uppercase tracking-wider block text-center sm:text-left">
          💡 Gợi ý cho bé bấm vào hỏi nhanh:
        </span>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {predefinedPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(item.text, item.mode)}
              disabled={loading}
              className="bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-2xl border-2 border-amber-300 shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Speech Output Box */}
      <motion.div
        key={response}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 rounded-3xl p-6 border-4 border-indigo-200 shadow-xl space-y-4 relative"
      >
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0 mt-1">🦉</div>
          <div className="space-y-2 w-full">
            <span className="font-black text-indigo-900 text-lg block">Thầy Cú Cú trả lời:</span>
            <p className="text-slate-800 font-bold text-lg leading-relaxed bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100">
              {loading ? (
                <span className="flex items-center gap-2 text-indigo-600">
                  <Loader2 className="w-5 h-5 animate-spin" /> Thầy Cú Cú đang lật mở cuốn sách phép thuật...
                </span>
              ) : (
                response
              )}
            </p>
          </div>
        </div>

        {/* Read aloud button */}
        {!loading && (
          <button
            onClick={handleSpeakResponse}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black py-3 rounded-2xl border-2 border-indigo-700 shadow-md flex items-center justify-center gap-2 text-base active:scale-95"
          >
            <Volume2 className="w-5 h-5" />
            <span>🔊 Đọc tiếng Việt cho bé nghe</span>
          </button>
        )}
      </motion.div>

      {/* Question Input Box */}
      <div className="bg-white/90 p-3 rounded-3xl border-3 border-amber-300 shadow-md flex items-center gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Hoặc gõ câu hỏi cho bé (ví dụ: Con mèo thích làm gì?)..."
          className="w-full pl-4 pr-2 py-2 text-amber-950 font-bold placeholder-amber-400 bg-transparent focus:outline-none text-sm sm:text-base"
        />

        <button
          onClick={() => handleAsk()}
          disabled={loading || !prompt.trim()}
          className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-white p-3 rounded-2xl shadow-md shrink-0 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
