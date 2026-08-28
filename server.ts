import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI lazily
  let aiClient: GoogleGenAI | null = null;
  function getAi() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured.");
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // In-memory TTS audio cache & rate limit cooldown handler
  const ttsCache = new Map<string, { audioBase64: string; mimeType: string }>();
  let ttsCooldownUntil = 0;

  // API endpoint for Gemini TTS with gemini-2.5-flash-preview-tts
  app.post("/api/gemini/tts", async (req, res) => {
    try {
      const { text, prompt, voiceName } = req.body;
      const rawText = (text || prompt || "Xin chào các bé yêu của cô giáo Lương Thị Ngọc Yến!").trim();

      // Check in-memory cache first
      const cacheKey = `${voiceName || 'Aoede'}_${rawText}`;
      if (ttsCache.has(cacheKey)) {
        const cached = ttsCache.get(cacheKey)!;
        return res.json({
          audioBase64: cached.audioBase64,
          mimeType: cached.mimeType,
          text: rawText,
          source: "gemini-tts-cached"
        });
      }

      // If under rate-limit cooldown, immediately fallback to high-quality client speech without error
      if (Date.now() < ttsCooldownUntil) {
        return res.json({
          audioBase64: null,
          text: rawText,
          source: "client-speech"
        });
      }

      const ai = getAi();
      // Prepare clear, sweet, 100% pure Vietnamese teacher prompt with standard kindergarten prosody
      const speakPrompt = `Hãy đọc đoạn văn sau bằng tiếng Việt với chất giọng NỮ cô giáo mầm non thật ngọt ngào, dịu dàng, trìu mến, vui tươi và truyền cảm hứng cho các bé nhỏ nghe. 
Quy tắc phát âm:
- CHỈ nói thuần 100% Tiếng Việt, tuyệt đối không chêm tiếng Anh.
- Đọc chuẩn xác các phương án là "Đáp án Á", "Đáp án Bê", "Đáp án Cê", "Đáp án Đê".
- Không đọc các từ tiếng Anh trong ngoặc đơn hay các biểu tượng emoji.
- Nhịp điệu chậm rãi, ấm áp, ngắt nghỉ rõ ràng từng chữ cho các bé mẫu giáo.
Nội dung cần đọc: ${rawText}`;
      
      // Attempt using gemini-2.5-flash-preview-tts with audio modality and female voice
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{
            parts: [{
              text: speakPrompt
            }]
          }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName || "Aoede" // Giọng Nữ nhẹ nhàng, truyền cảm hứng
                }
              }
            }
          }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part && part.inlineData && part.inlineData.data) {
          const audioData = {
            audioBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
          };
          // Cache up to 100 entries
          if (ttsCache.size > 100) {
            const firstKey = ttsCache.keys().next().value;
            if (firstKey) ttsCache.delete(firstKey);
          }
          ttsCache.set(cacheKey, audioData);

          return res.json({
            audioBase64: audioData.audioBase64,
            mimeType: audioData.mimeType,
            text: rawText,
            source: "gemini-tts"
          });
        }
      } catch (ttsErr: any) {
        const isQuota = ttsErr?.status === "RESOURCE_EXHAUSTED" || ttsErr?.message?.includes("429") || ttsErr?.message?.includes("quota");
        if (isQuota) {
          // Set a 60s cooldown to avoid hitting the quota repeatedly
          ttsCooldownUntil = Date.now() + 60000;
        }
      }

      // If audio modality is not available or in cooldown, return clean text for Web Speech synthesis
      res.json({
        audioBase64: null,
        text: rawText,
        source: "client-speech"
      });
    } catch (error: any) {
      res.json({
        audioBase64: null,
        text: req.body?.text || "",
        source: "client-speech"
      });
    }
  });

  // API endpoint to generate sweet inspiring animal voice script with Gemini TTS
  app.post("/api/gemini/animal-speech", async (req, res) => {
    try {
      const { animalName, specialFeature, funFact, habitat, food, soundText } = req.body;
      const ai = getAi();

      const prompt = `Bạn là cô giáo mầm non Việt Nam hiền dịu, ngọt ngào. Hãy viết một lời giới thiệu siêu dễ thương, truyền cảm hứng, ngắn gọn (2-3 câu tiếng Việt) cho các bé mầm non về bạn ${animalName}.
Đặc điểm: ${specialFeature || funFact || 'rất đáng yêu'}.
Nơi ở: ${habitat || 'thiên nhiên'}. Thức ăn: ${food || 'thức ăn quen thuộc'}.
Âm thanh: ${soundText || 'tiếng kêu ngộ nghĩnh'}.
Bắt đầu bằng lời chào vui tươi, ấm áp và kết bằng lời dặn dò các bé yêu quý động vật. CHỈ dùng tiếng Việt 100%, tuyệt đối không dùng tiếng Anh.`;

      let speechScript = `Chào bé yêu! Đây là bạn ${animalName}, một người bạn động vật vô cùng thông minh và đáng yêu. Các bé hãy luôn yêu thương và bảo vệ các bạn con vật nhé!`;

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.7,
          },
        });
        if (response.text?.trim()) {
          speechScript = response.text.trim();
        }
      } catch (err: any) {
        // Fallback silently if gemini-2.5-flash quota hit
      }

      // Try generating Gemini TTS for this inspiring script if not in cooldown
      let audioBase64: string | null = null;
      if (Date.now() >= ttsCooldownUntil) {
        try {
          const ttsRes = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{
              parts: [{
                text: `Hãy đọc lời giới thiệu con vật sau bằng giọng NỮ cô giáo mầm non dịu dàng, ngọt ngào, truyền cảm hứng: ${speechScript}`
              }]
            }],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Aoede" }
                }
              }
            }
          });
          const part = ttsRes.candidates?.[0]?.content?.parts?.[0];
          if (part?.inlineData?.data) {
            audioBase64 = part.inlineData.data;
          }
        } catch (e: any) {
          const isQuota = e?.status === "RESOURCE_EXHAUSTED" || e?.message?.includes("429") || e?.message?.includes("quota");
          if (isQuota) {
            ttsCooldownUntil = Date.now() + 60000;
          }
        }
      }

      res.json({
        script: speechScript,
        audioBase64
      });
    } catch (error: any) {
      res.json({ 
        script: `Chào bé yêu! Đây là bạn ${req.body?.animalName || 'con vật'}, bạn ấy rất thích làm quen với bé!`,
        audioBase64: null
      });
    }
  });

  // API endpoint for AI Teacher Owl (Cô Giáo Cú Mèo) questions & animal riddles for toddlers
  app.post("/api/gemini/ask-teacher", async (req, res) => {
    try {
      const { prompt, mode } = req.body;
      
      const ai = getAi();
      
      let systemInstruction = "";
      if (mode === "riddle") {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng NỮ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào, vô cùng dễ thương. Hãy tạo 1 câu đố vui bằng tiếng Việt siêu ngắn gọn (2-3 câu) về con vật cho các bé mầm non, có gợi ý ngộ nghĩnh. Kết bằng câu: 'Đố các bé biết là con gì nào?'. Chưa nêu đáp án ngay nha! CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      } else if (mode === "story") {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng NỮ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào. Kể 1 câu chuyện ngắn gọn (3-4 câu) bằng tiếng Việt cho các bé mầm non về các bạn con vật ngoan ngoãn, đáng yêu, tràn đầy tình bạn. CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      } else {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng NỮ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào, dễ thương. Trả lời câu hỏi của các bé mầm non thật ngắn gọn (2-3 câu), tràn đầy tình yêu thương và niềm vui. CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt || "Kể cho bé nghe một điều thú vị về loài vật!",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Cô Cú Mèo chưa nghe rõ, bé hỏi lại cô lần nữa nhé!";
      res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ 
        error: "Không thể kết nối với Cô Giáo Cú Mèo lúc này. Bé hãy thử lại sau nhé!",
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bé Nhận Biết Con Vật App running on http://localhost:${PORT}`);
  });
}

startServer();
