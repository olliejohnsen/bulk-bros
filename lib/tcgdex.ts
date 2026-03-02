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
