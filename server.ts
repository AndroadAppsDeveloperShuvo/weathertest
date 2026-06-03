import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini client (server side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint to fetch temperature via Gemini Search Grounding
  app.post("/api/temperature", async (req, res) => {
    try {
      const { lat, lon, city } = req.body;
      let searchQuery = "";

      if (lat && lon) {
        searchQuery = `weather today at latitude ${lat}, longitude ${lon}`;
      } else if (city) {
        searchQuery = `weather today in ${city}`;
      } else {
        searchQuery = "weather today in Bangladesh";
      }

      const prompt = `Perform a live web search for "${searchQuery}".
      Based on the actual live search results for today's weather at this location, return a JSON response in the following precise structure:
      {
        "temperature": "value with °C (e.g. 31°C)",
        "weather": "brief weather condition in Bengali (e.g., ঝোড়ো হাওয়া, মেঘলা, বৃষ্টি, রৌদ্রোজ্জ্বল, কুয়াশা)",
        "location": "Name of the city/region in Bengali (e.g. ঢাকা, সিলেট)",
        "tips": "a very short and friendly 1-sentence tip in Bengali for this current weather (e.g., ছাতা সঙ্গে রাখুন, অথবা কোল্ড ড্রিংকস পান করতে পারেন)"
      }
      Respond ONLY with the JSON string, do not wrap it in markdown codeblocks like \`\`\`json.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.substring(7);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3);
      }
      cleanedText = cleanedText.trim();

      const data = JSON.parse(cleanedText);
      res.json({ success: true, data });
    } catch (error: any) {
      console.error("Error fetching temperature:", error);
      res.status(500).json({ success: false, error: error.message || "তাপমাত্রা আনতে সমস্যা হয়েছে।" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Error starting server:", error);
});
