import { NextRequest, NextResponse } from "next/server";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${POKEWALLET_BASE}/search?q=${encodeURIComponent(q)}&limit=20`,
      { headers: pokewalletHeaders(), next: { revalidate: 60 } }
    );

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `PokéWallet API error: ${res.status}`, detail: body },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach PokéWallet API" },
      { status: 502 }
    );
  }
}
