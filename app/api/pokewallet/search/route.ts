import { NextRequest, NextResponse } from "next/server";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";

const SEARCH_PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? String(SEARCH_PAGE_SIZE), 10)));

  try {
    const res = await fetch(
      `${POKEWALLET_BASE}/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
      { 
        headers: pokewalletHeaders(),
        next: { revalidate: 86400 } // Cache results for 24 hours
      }
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
