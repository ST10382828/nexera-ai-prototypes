import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

export async function generateWithFallback(prompt: string): Promise<string> {
  return generateMultimodalWithFallback([{ text: prompt }]);
}

export async function generateWithImage(
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  return generateMultimodalWithFallback([
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
    { text: prompt },
  ]);
}

async function generateMultimodalWithFallback(parts: Part[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    throw new Error("Gemini API key not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: Error | null = null;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      return result.response.text().trim();
    } catch (err) {
      lastError = err as Error;
      const msg = (err as Error).message || "";
      if (msg.includes("429") || msg.includes("quota") || msg.includes("404")) {
        console.warn(`Model ${modelName} unavailable or rate limited, trying next...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}
