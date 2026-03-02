export const POKEWALLET_BASE = "https://api.pokewallet.io";

export function pokewalletHeaders() {
  const key = process.env.POKEWALLET_API_KEY;
  if (!key) throw new Error("POKEWALLET_API_KEY is not set");
  return { "X-API-Key": key };
}

export interface PokeWalletCard {
  id: string;
  card_info: {
    name: string;
    clean_name: string;
    set_name?: string;
    set_code?: string;
    card_number?: string;
    rarity?: string;
    card_type?: string;
    hp?: string;
  };
  tcgplayer: {
    prices: Array<{
      sub_type_name: string;
      market_price: number | null;
      low_price: number | null;
    }>;
    url?: string;
  } | null;
  cardmarket: {
    prices: Array<{
      variant_type: string;
      trend: number | null;
      low: number | null;
    }>;
  } | null;
}
