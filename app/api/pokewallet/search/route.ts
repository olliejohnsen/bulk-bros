import { NextRequest, NextResponse } from "next/server";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";

const SEARCH_PAGE_SIZE = 20;
const RETRY_DELAY_MS = 1500;

async function searchPokewallet(
  q: string,
  page: number,
  limit: number,
  retried = false
): Promise<Response> {
  const url = `${POKEWALLET_BASE}/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
  const res = await fetch(url, {
    headers: pokewalletHeaders(),
    next: { revalidate: 300 }, // 5 min cache to avoid stale empty/errors
  });
  if (res.ok) return res;
  if (!retried && (res.status === 429 || res.status >= 500)) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return searchPokewallet(q, page, limit, true);
  }
  return res;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(SEARCH_PAGE_SIZE), 10))
  );

  try {
    const res = await searchPokewallet(q, page, limit);

    if (!res.ok) {
      const body = await res.text();
      let errorMessage = `PokéWallet API error: ${res.status}`;
      let code: string | undefined;
      if (res.status === 429) {
        code = "rate_limit";
        errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
      } else if (res.status >= 500) {
        errorMessage = "Card search is temporarily unavailable. Please try again shortly.";
      }
      return NextResponse.json(
        { error: errorMessage, code, detail: body },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to reach PokéWallet API. Check your connection and try again." },
      { status: 502 }
    );
  }
}
