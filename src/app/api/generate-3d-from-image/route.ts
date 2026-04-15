import { NextRequest, NextResponse } from "next/server";

const TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

export async function POST(request: NextRequest) {
  const apiKey = process.env.TRIPO_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return NextResponse.json(
      { error: "Tripo API key not configured. Set TRIPO_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // First upload the image to get a file token
    const uploadForm = new FormData();
    uploadForm.append("file", imageFile);

    const uploadRes = await fetch(`${TRIPO_API_BASE}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error("Tripo upload error:", uploadRes.status, errBody);
      return NextResponse.json(
        { error: `Image upload failed: ${uploadRes.status}` },
        { status: uploadRes.status }
      );
    }

    const uploadData = await uploadRes.json();
    if (uploadData.code !== 0) {
      return NextResponse.json(
        { error: uploadData.message || "Upload failed" },
        { status: 500 }
      );
    }

    const fileToken = uploadData.data.image_token;

    // Now create the image-to-model task
    const res = await fetch(`${TRIPO_API_BASE}/task`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "image_to_model",
        file: {
          type: "jpg",
          file_token: fileToken,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Tripo image-to-3d error:", res.status, errBody);
      return NextResponse.json(
        { error: `Tripo API error: ${res.status}` },
        { status: res.status }
      );
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
    console.error("Image to 3D error:", err);
    return NextResponse.json(
      { error: "Failed to start image-to-3D generation" },
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
    console.error("Poll image-to-3d error:", err);
    return NextResponse.json(
      { error: "Failed to check generation status" },
      { status: 500 }
    );
  }
}
