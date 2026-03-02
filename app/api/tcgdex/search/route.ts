import { NextRequest, NextResponse } from "next/server";
import {
  tcgdexSearchUrl,
  getTcgdexImageUrl,
  parseCardSearchQuery,
  CARD_LANGUAGES,
  type TCGdexCardBrief,
  type CardLanguageCode,
} from "@/lib/tcgdex";

const PAGE_SIZE = 50;
/** TCGdex may cap at ~20 per request; treat this as a full page for hasMore */
const FULL_PAGE_THRESHOLD = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const { name, localId } = parseCardSearchQuery(q);

  try {
    // Query all languages in parallel; track raw count for pagination (we filter out cards without image)
    const langResponses = await Promise.all(
      CARD_LANGUAGES.map(async (langEntry) => {
        const url = tcgdexSearchUrl(langEntry.code, name, page, PAGE_SIZE, localId);
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return { filtered: [] as (TCGdexCardBrief & { _lang: CardLanguageCode })[], rawCount: 0 };
        const list = (await res.json()) as TCGdexCardBrief[];
        const filtered = list
          .filter((card) => card.image)
          .map((card) => ({ ...card, _lang: langEntry.code }));
        return { filtered, rawCount: list.length };
      })
    );

    const langResults = langResponses.map((r) => r.filtered);
    const rawCounts = langResponses.map((r) => r.rawCount);

    const results = langResults.flat().map((card) => ({
      id: card.id,
      name: card.name,
      localId: card.localId,
      set_name: undefined as string | undefined,
      language: card._lang,
      imageUrlLow: getTcgdexImageUrl(card.image!, "low"),
      imageUrlHigh: getTcgdexImageUrl(card.image!, "high"),
      imageUrlLowPng: getTcgdexImageUrl(card.image!, "low", "png"),
      imageUrlHighPng: getTcgdexImageUrl(card.image!, "high", "png"),
    }));

    // Use raw API count: if any language returned a full page, there may be more (TCGdex often caps at ~20)
    const hasMore = rawCounts.some((count) => count >= FULL_PAGE_THRESHOLD);
    const totalPages = hasMore ? page + 1 : page;

    return NextResponse.json({
      results,
      pagination: { page, limit: results.length, total_pages: totalPages, hasMore },
    });
  } catch (err) {
    console.error("TCGdex search error:", err);
    return NextResponse.json(
      { error: "Failed to reach TCGdex API. Check your connection." },
      { status: 502 }
    );
  }
}
