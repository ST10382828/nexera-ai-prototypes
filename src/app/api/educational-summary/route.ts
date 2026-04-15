import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback, generateWithImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, imageBase64, imageMimeType } = body;

    if (!description && !imageBase64) {
      return NextResponse.json(
        { error: "Description or image is required" },
        { status: 400 }
      );
    }

    const prompt = `You are an educational content assistant for a workplace training platform called NexEra. ${
      imageBase64
        ? "An image has been provided that was used to generate a 3D model. Analyze the image to identify the object shown."
        : `A 3D model has been generated based on this description: "${description}".`
    }

Write a concise educational summary (2-3 sentences) about this object for a training context. Include:
- What the object is and its primary purpose
- Where it is commonly used (industry/setting)
- One key safety or usage tip if applicable

Keep it professional, informative, and suitable for workplace training modules. Do not use markdown formatting.`;

    let text: string;
    if (imageBase64 && imageMimeType) {
      text = await generateWithImage(prompt, imageBase64, imageMimeType);
    } else {
      text = await generateWithFallback(prompt);
    }

    return NextResponse.json({ summary: text });
  } catch (err) {
    console.error("Educational summary error:", err);
    const msg = (err as Error).message || "";
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate educational summary" },
      { status: 500 }
    );
  }
}
