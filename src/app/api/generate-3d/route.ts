import { NextRequest, NextResponse } from "next/server";

const TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

export async function POST(request: NextRequest) {
  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json(
      { error: "Tripo API key not configured. Set TRIPO_API_KEY in .env.local (get one free at platform.tripo3d.ai)" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const res = await fetch(`${TRIPO_API_BASE}/task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "text_to_model",
        prompt,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Tripo create task error:", res.status, errBody);
      let errorMessage = `Tripo API error: ${res.status}`;
      try {
        const errJson = JSON.parse(errBody);
        if (errJson.code === 2010) {
          errorMessage = "No Tripo credits available. Check your account at platform.tripo3d.ai — free tier gives 300 credits/month.";
        } else if (errJson.message) {
          errorMessage = errJson.message;
        }
      } catch {}
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const data = await res.json();
    if (data.code !== 0) {
      return NextResponse.json(
        { error: data.message || "Tripo API error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ taskId: data.data.task_id });
  } catch (err) {
    console.error("Generate 3D error:", err);
    return NextResponse.json(
      { error: "Failed to start 3D generation" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  const taskId = request.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Tripo API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const task = data.data;

    let status = "PENDING";
    if (task.status === "success") status = "SUCCEEDED";
    else if (task.status === "failed" || task.status === "cancelled") status = "FAILED";
    else if (task.status === "running") status = "RUNNING";
    else if (task.status === "queued") status = "QUEUED";

    const rawModelUrl = task.output?.pbr_model || task.output?.model || null;
    const modelUrl = rawModelUrl
      ? `/api/proxy-model?url=${encodeURIComponent(rawModelUrl)}`
      : null;

    return NextResponse.json({
      status,
      progress: task.progress ?? 0,
      modelUrl,
    });
  } catch (err) {
    console.error("Poll task error:", err);
    return NextResponse.json(
      { error: "Failed to check generation status" },
      { status: 500 }
    );
  }
}
