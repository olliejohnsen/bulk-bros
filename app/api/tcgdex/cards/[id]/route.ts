import { NextRequest, NextResponse } from "next/server";
import {
  tcgdexCardUrl,
  type TCGdexCard,
  type CardLanguageCode,
  DEFAULT_CARD_LANG,
  CARD_LANGUAGES,
} from "@/lib/tcgdex";

const VALID_LANGS = new Set<string>(CARD_LANGUAGES.map((l) => l.code));

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Card ID required" }, { status: 400 });
  }
  const { searchParams } = new URL(request.url);
  const langParam = searchParams.get("lang")?.toLowerCase();
  const lang: CardLanguageCode =
    langParam && VALID_LANGS.has(langParam) ? (langParam as CardLanguageCode) : DEFAULT_CARD_LANG;

  try {
    const url = tcgdexCardUrl(lang, id);
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `TCGdex API error: ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const card = (await res.json()) as TCGdexCard;

    // Extract best available price: TCGPlayer (normal/reverse) then Cardmarket
    let marketPrice: number | undefined;
    let currency = "USD";
    const tcgplayer = card.pricing?.tcgplayer as Record<string, { midPrice?: number; marketPrice?: number }> | undefined;
    if (tcgplayer) {
      const variant = tcgplayer.normal ?? tcgplayer.reverse ?? tcgplayer["reverse-holofoil"];
      if (variant) {
        marketPrice = variant.midPrice ?? variant.marketPrice;
      }
      const unit = (card.pricing as { tcgplayer?: { unit?: string } })?.tcgplayer?.unit;
      if (unit) currency = unit;
    }
    const cardmarket = card.pricing?.cardmarket;
    if (marketPrice == null && cardmarket?.avg != null) {
      marketPrice = cardmarket.avg;
      currency = (cardmarket as { unit?: string }).unit ?? "EUR";
    }

    const setTotal = card.set?.cardCount?.official;

    return NextResponse.json({
      id: card.id,
      name: card.name,
      localId: card.localId,
      set_name: card.set?.name,
      set_id: card.set?.id,
      set_total: setTotal,
      pricing:
        marketPrice != null || card.set?.name
          ? {
              marketPrice: marketPrice ?? undefined,
              currency,
              cardmarketAvg: cardmarket?.avg,
              cardmarketCurrency: (cardmarket as { unit?: string })?.unit ?? "EUR",
            }
          : undefined,
    });
  } catch (err) {
    console.error("TCGdex card fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch card details" },
      { status: 502 }
    );
  }
}
