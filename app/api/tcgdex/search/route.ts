import { NextRequest, NextResponse } from "next/server";
import {
  tcgdexSearchUrl,
  getTcgdexImageUrl,
  parseCardSearchQuery,
  CARD_LANGUAGES,
  type TCGdexCardBrief,
  type CardLanguageCode,
} from "@/lib/tcgdex";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const { name, localId } = parseCardSearchQuery(q);

  try {
    // Query all languages in parallel so we get every print (e.g. Bulbasaur 166 in EN and JA)
    const langResults = await Promise.all(
      CARD_LANGUAGES.map(async (langEntry) => {
        const url = tcgdexSearchUrl(langEntry.code, name, page, PAGE_SIZE, localId);
        const res = await fetch(url, { next: { revalidate: 300 } });
        if (!res.ok) return [] as (TCGdexCardBrief & { _lang: CardLanguageCode })[];
        const list = (await res.json()) as TCGdexCardBrief[];
        return list
          .filter((card) => card.image)
          .map((card) => ({ ...card, _lang: langEntry.code }));
      })
    );

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

    const totalFetched = langResults.reduce((sum, arr) => sum + arr.length, 0);
    const hasMore = totalFetched >= PAGE_SIZE * CARD_LANGUAGES.length;
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
