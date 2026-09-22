import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const MODEL: Record<string, string> = {
  "Aether Motion": "wan-fast",
  "Nova Scene": "veo",
  "Pulse Still": "wan-fast",
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt || "cinematic scene");
  const duration = Number(body.duration || 5);
  const aspect = String(body.aspect || "16:9");
  const model = MODEL[String(body.model || "")] || "wan-fast";
  const key = String(body.key || process.env.POLLINATIONS_KEY || "").trim();
  const image = body.image ? String(body.image) : "";

  if (!key) {
    return NextResponse.json({ error: "missing_key" }, { status: 401 });
  }

  const q = new URLSearchParams({
    model,
    duration: String(duration),
    aspectRatio: aspect,
    nologo: "true",
  });
  if (image) q.set("image", image);

  const upstream = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?${q}`;
  const response = await fetch(upstream, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "video/mp4",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return NextResponse.json(
      { error: "Video model rejected the request", detail: text.slice(0, 200) },
      { status: 502 },
    );
  }

  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": response.headers.get("content-type") || "video/mp4",
      "Cache-Control": "no-store",
    },
  });
}
