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

  // API endpoint for AI Teacher Owl (Cú Cú) questions & animal riddles for toddlers
  app.post("/api/gemini/ask-teacher", async (req, res) => {
    try {
      const { prompt, mode } = req.body;
      
      const ai = getAi();
      
      let systemInstruction = "";
      if (mode === "riddle") {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng nữ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào, vô cùng dễ thương. Hãy tạo 1 câu đố vui bằng tiếng Việt siêu ngắn gọn (2-3 câu) về con vật cho các bé mầm non, có gợi ý ngộ nghĩnh. Kết bằng câu: 'Đố các bé biết là con gì nào?'. Chưa nêu đáp án ngay nha! CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      } else if (mode === "story") {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng nữ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào. Kể 1 câu chuyện ngắn gọn (3-4 câu) bằng tiếng Việt cho các bé mầm non về các bạn con vật ngoan ngoãn, đáng yêu, tràn đầy tình bạn. CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      } else {
        systemInstruction = "Bạn là cô giáo mầm non nói tiếng Việt bằng giọng nữ Việt Nam dịu dàng, nhẹ nhàng, ngọt ngào, dễ thương. Trả lời câu hỏi của các bé mầm non thật ngắn gọn (2-3 câu), tràn đầy tình yêu thương và niềm vui. CHỈ dùng 100% tiếng Việt, tuyệt đối KHÔNG dùng bất kỳ từ tiếng Anh nào.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt || "Kể cho bé nghe một điều thú vị về loài vật!",
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const replyText = response.text || "Thầy Cú Cú chưa nghe rõ, bé hỏi lại thầy lần nữa nhé!";
      res.json({ text: replyText });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ 
        error: "Không thể kết nối với Thầy Giáo Cú Cú lúc này. Bé hãy thử lại sau nhé!",
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
