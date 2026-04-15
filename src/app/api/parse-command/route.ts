import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini";
import { AVAILABLE_ANIMATIONS, ANIMATION_NAMES, SCENE_OBJECTS } from "@/lib/animation-map";

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      );
    }

    const animDescriptions = AVAILABLE_ANIMATIONS.map(
      (a) => `- "${a.name}": ${a.description}`
    ).join("\n");

    const objectDescriptions = SCENE_OBJECTS.map(
      (o) => `- "${o.name}" (${o.label}) at position [${o.position.join(", ")}]`
    ).join("\n");

    const prompt = `You are an AI animation controller for a 3D training avatar in a workplace learning platform.

The avatar exists in a 3D scene with these objects:
${objectDescriptions}

The avatar starts at position [0, 0, 0].

Available animations:
${animDescriptions}

User command: "${command}"

You must interpret the user's intent and respond with ONLY valid JSON (no markdown, no code fences):
{
  "animation": "<animation_name>",
  "target": "<scene_object_name or null>",
  "explanation": "<2-3 sentence educational explanation about why this action matters in a workplace/training context>",
  "confidence": <0.0-1.0>
}

Rules:
- "animation" MUST be one of: ${ANIMATION_NAMES.join(", ")}
- If the command says "walk to [something]", use "walk_to" and set "target" to the matching scene object name
- If the command says "point at [something]", use "pointing" and set "target" to the matching scene object name
- If the command mentions looking at something specific, use "looking" and set "target" to the matching scene object
- "target" must be one of: ${SCENE_OBJECTS.map((o) => o.name).join(", ")}, or null if no specific target
- If the command doesn't clearly match any animation, use "idle" with low confidence
- The explanation should relate to workplace safety, training, or professional communication`;

    const text = await generateWithFallback(prompt);

    let parsed;
    try {
      const jsonStr = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "");
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        animation: "idle",
        target: null,
        explanation:
          "I couldn't fully understand that command. The avatar returns to its idle stance. Try commands like 'walk to the table' or 'point at the fire extinguisher'.",
        confidence: 0.3,
      };
    }

    if (!ANIMATION_NAMES.includes(parsed.animation)) {
      parsed.animation = "idle";
    }

    let targetPosition: [number, number, number] | null = null;
    let standoff = 0.5;
    if (parsed.target) {
      const obj = SCENE_OBJECTS.find((o) => o.name === parsed.target);
      if (obj) {
        targetPosition = obj.position;
        standoff = obj.standoff;
      }
    }

    return NextResponse.json({
      animation: parsed.animation,
      target: parsed.target || null,
      targetPosition,
      standoff,
      explanation: parsed.explanation,
      confidence: parsed.confidence || 0.5,
      rawCommand: command,
    });
  } catch (err) {
    console.error("Parse command error:", err);
    const msg = (err as Error).message || "";
    if (msg.includes("429") || msg.includes("quota")) {
      return NextResponse.json(
        { error: "AI rate limit reached. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to parse command" },
      { status: 500 }
    );
  }
}
