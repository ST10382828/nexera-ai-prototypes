import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "url parameter is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch model: ${res.status}` },
        { status: res.status }
      );
    }

    const contentLength = res.headers.get("content-length");
    const headers: Record<string, string> = {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    };
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    if (res.body) {
      return new NextResponse(res.body as ReadableStream, { headers });
    }

    const buffer = await res.arrayBuffer();
    headers["Content-Length"] = buffer.byteLength.toString();
    return new NextResponse(buffer, { headers });
  } catch (err) {
    console.error("Proxy model error:", err);
    return NextResponse.json(
      { error: "Failed to proxy model" },
      { status: 500 }
    );
  }
}
