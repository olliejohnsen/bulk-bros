/**
 * Curated list of TCGdex card IDs used for Bulk Bingo.
 * Classic "bulk" / common cards – the ones we all get before a hit.
 */
export const BULK_BINGO_CARD_IDS = [
  "swsh10.5-001", // Bulbasaur (Pokémon GO)
  "basep-1",
  "basep-4",
  "cel25-5",
  "cel25-6",
  "cel25-7",
  "cel25-8",
  "cel25-9",
  "fut2020-1", // Pikachu on the Ball
  "det1-10", // Detective Pikachu
  "pop6-9",
  "ru1-7",
  "swsh10.5-002",
  "swsh10.5-003",
  "swsh12-001",
  "swsh12-002",
  "swsh12-003",
  "sv01-001",
  "sv01-002",
  "sv01-003",
  "sv02-001",
  "sv02-002",
  "sv03-001",
  "sv03-002",
  "sv04-001",
  "sv05-001",
] as const;

export type BulkBingoCardId = (typeof BULK_BINGO_CARD_IDS)[number];

export function getRandomBingoCardId(): BulkBingoCardId {
  const i = Math.floor(Math.random() * BULK_BINGO_CARD_IDS.length);
  return BULK_BINGO_CARD_IDS[i];
}
