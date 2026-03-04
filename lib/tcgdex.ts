/**
 * TCGdex API – https://tcgdex.dev/
 * Public API, no API key required.
 */

export const TCGDEX_API_BASE = "https://api.tcgdex.net/v2";
export const TCGDEX_ASSETS_BASE = "https://assets.tcgdex.net";

/** Default language for card search when not specified */
export const DEFAULT_CARD_LANG = "en";

/** Supported card languages for search (TCGdex API locale codes) */
export const CARD_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
] as const;

export type CardLanguageCode = (typeof CARD_LANGUAGES)[number]["code"];

/** Get display label for a card language code (e.g. "ja" → "日本語") */
export function getCardLanguageLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const found = CARD_LANGUAGES.find((l) => l.code === code.toLowerCase());
  return found ? found.label : code.toUpperCase();
}

/** Card brief from /v2/{lang}/cards (search/list) */
export interface TCGdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image: string; // base URL, e.g. https://assets.tcgdex.net/en/swsh/swsh3/136
}

/** Full card from /v2/{lang}/cards/{id} */
export interface TCGdexCard extends TCGdexCardBrief {
  set?: {
    id: string;
    name: string;
    logo?: string;
    symbol?: string;
    cardCount?: { total: number; official: number };
  };
  rarity?: string;
  category?: string;
  hp?: number;
  pricing?: {
    tcgplayer?: {
      normal?: { midPrice?: number; marketPrice?: number };
      "reverse-holofoil"?: { midPrice?: number; marketPrice?: number };
      unit?: string;
    };
    cardmarket?: {
      avg?: number;
      unit?: string;
    };
  };
  [key: string]: unknown;
}

/** Image extension supported by TCGdex: webp (default), png, jpg */
export type TcgdexImageExt = "webp" | "png" | "jpg";

/** Build full image URL. Quality: 'low' (245x337) or 'high' (600x825). */
export function getTcgdexImageUrl(
  imageBase: string,
  quality: "low" | "high" = "high",
  ext: TcgdexImageExt = "webp"
): string {
  return `${imageBase}/${quality}.${ext}`;
}

/**
 * Parse a search query like "Bulbasaur 166" or "Bulbasaur 166/165" into name + optional card number.
 * Returns { name, localId } so we can filter by both.
 */
export function parseCardSearchQuery(query: string): { name: string; localId?: string } {
  const trimmed = query.trim();
  // Match trailing card number: optional space + digits, optional /digits (e.g. " 166" or " 166/165")
  const numberMatch = trimmed.match(/\s+(\d+)(?:\/\d+)?\s*$/);
  if (numberMatch) {
    const name = trimmed.slice(0, numberMatch.index).trim();
    const localId = numberMatch[1];
    return { name: name || trimmed, localId };
  }
  return { name: trimmed };
}

export function tcgdexSearchUrl(
  lang: string,
  query: string,
  page: number,
  pageSize: number,
  localId?: string
): string {
  const params = new URLSearchParams();
  params.set("name", query);
  if (localId) params.set("localId", localId);
  params.set("pagination:page", String(page));
  params.set("pagination:itemsPerPage", String(pageSize));
  return `${TCGDEX_API_BASE}/${lang}/cards?${params.toString()}`;
}

export function tcgdexCardUrl(lang: string, cardId: string): string {
  return `${TCGDEX_API_BASE}/${lang}/cards/${encodeURIComponent(cardId)}`;
}

/** Server-side: fetch card from TCGdex and return id, name, set_name, localId, set_total, imageUrl. Returns null if not found or no image. */
export async function fetchTcgdexCardDetails(
  cardId: string,
  lang: string
): Promise<{
  id: string;
  name: string;
  set_name?: string;
  localId?: string;
  set_total?: number;
  imageUrl: string;
} | null> {
  const url = tcgdexCardUrl(lang, cardId);
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const card = (await res.json()) as TCGdexCard;
  if (!card.image) return null;
  return {
    id: card.id,
    name: card.name,
    set_name: card.set?.name,
    localId: card.localId,
    set_total: card.set?.cardCount?.official,
    imageUrl: getTcgdexImageUrl(card.image, "high"),
  };
}

/** TCGdex set list item (from /v2/{lang}/sets) */
interface TCGdexSetBrief {
  id: string;
  name: string;
  cardCount?: { total: number; official: number };
}

/** TCGdex set with full cards array (from /v2/{lang}/sets/{id}) */
interface TCGdexSetFull {
  id: string;
  name: string;
  cardCount?: { total: number; official: number };
  cards: Array<{ id: string; name: string; localId?: string; image?: string }>;
}

/** Server-side: fetch a random card from the full TCGdex catalog (via random set). Returns same shape as fetchTcgdexCardDetails. */
export async function fetchRandomTcgdexCard(lang: string): Promise<{
  id: string;
  name: string;
  set_name?: string;
  localId?: string;
  set_total?: number;
  imageUrl: string;
} | null> {
  // Try up to 3 different sets if the first one is empty or has no images
  for (let setAttempt = 0; setAttempt < 3; setAttempt++) {
    const page = Math.floor(Math.random() * 5) + 1; // Limit to first 5 pages (500 sets) to ensure we get populated sets
    const setsUrl = `${TCGDEX_API_BASE}/${lang}/sets?pagination:page=${page}&pagination:itemsPerPage=100`;
    const setsRes = await fetch(setsUrl, { next: { revalidate: 3600 } });
    if (!setsRes.ok) continue;
    
    const sets = (await setsRes.json()) as TCGdexSetBrief[];
    if (!Array.isArray(sets) || sets.length === 0) continue;

    const set = sets[Math.floor(Math.random() * sets.length)];
    const setUrl = `${TCGDEX_API_BASE}/${lang}/sets/${encodeURIComponent(set.id)}`;
    const setRes = await fetch(setUrl, { next: { revalidate: 3600 } });
    if (!setRes.ok) continue;
    
    const setFull = (await setRes.json()) as TCGdexSetFull;
    if (!Array.isArray(setFull.cards) || setFull.cards.length === 0) continue;

    const withImage = setFull.cards.filter((c) => {
      if (!c.image) return false;
      const lowerName = c.name.toLowerCase();
      const lowerId = c.id.toLowerCase();
      
      const isSpecial = 
        lowerName.includes("holo") || 
        lowerName.includes("reverse") || 
        lowerName.includes("poké ball") || 
        lowerName.includes("pokeball") || 
        lowerName.includes("master ball") || 
        lowerName.includes("masterball") ||
        lowerId.includes("-re") || 
        lowerId.includes("-ho");
        
      return !isSpecial;
    });
    if (withImage.length === 0) continue;
    
    const card = withImage[Math.floor(Math.random() * withImage.length)];
    const setTotal = setFull.cardCount?.official ?? set.cardCount?.official;
    return {
      id: card.id,
      name: card.name,
      set_name: setFull.name,
      localId: card.localId,
      set_total: setTotal,
      imageUrl: getTcgdexImageUrl(card.image!, "high"),
    };
  }
  return null;
}

/** Shape returned by our /api/tcgdex/search for the UI */
export interface TCGdexSearchResult {
  id: string;
  name: string;
  /** Card number in set (e.g. "166") */
  localId?: string;
  set_name?: string;
  /** Print language of this card (en, ja, ko, zh) */
  language: CardLanguageCode;
  imageUrlLow: string;
  imageUrlHigh: string;
  /** Fallback when webp fails (e.g. older sets) */
  imageUrlHighPng?: string;
  imageUrlLowPng?: string;
}
