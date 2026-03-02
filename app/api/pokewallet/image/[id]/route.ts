import { NextRequest, NextResponse } from "next/server";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const size = new URL(request.url).searchParams.get("size") ?? "low";

  try {
    const res = await fetch(
      `${POKEWALLET_BASE}/images/${encodeURIComponent(id)}?size=${size}`,
      { headers: pokewalletHeaders(), next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    };

    // Stream the image body through when possible; otherwise buffer
    if (res.body) {
      return new NextResponse(res.body, { headers });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, { headers });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
