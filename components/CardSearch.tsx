"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Plus,
  CheckCircle2,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type TCGdexSearchResult, getCardLanguageLabel } from "@/lib/tcgdex";

const SEARCH_PAGE_SIZE = 20;

interface CardSearchProps {
  username: string;
  onUsernameChange: (v: string) => void;
}

export function CardSearch({ username, onUsernameChange }: CardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TCGdexSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<TCGdexSearchResult | null>(null);
  const [previewCard, setPreviewCard] = useState<TCGdexSearchResult | null>(null);
  const [previewDetails, setPreviewDetails] = useState<{
    set_name?: string;
    localId?: string;
    set_total?: number;
    marketPrice?: number;
    currency?: string;
    cardmarketAvg?: number;
    cardmarketCurrency?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());
  /** Cards for which we fell back to PNG after WebP failed */
  const [triedPngIds, setTriedPngIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmedQuery = query.trim();
    setSearchError(null);
    setFailedImageIds(new Set());
    setTriedPngIds(new Set());
    if (trimmedQuery.length < 3) {
      setResults([]);
      setPage(1);
      setTotalPages(1);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(trimmedQuery, 1), 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function runSearch(q: string, pageNum: number, append = false) {
    if (pageNum === 1) setSearching(true);
    else setLoadingMore(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `/api/tcgdex/search?q=${encodeURIComponent(q)}&page=${pageNum}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error ?? `Search failed (${res.status})`;
        setSearchError(msg);
        if (data.code === "rate_limit") {
          toast.error("Rate limit reached. Please try again in a few minutes.");
        } else {
          toast.error(msg);
        }
        if (!append) setResults([]);
        return;
      }
      const list = data.results ?? [];
      const pagination = data.pagination ?? {};
      const total = pagination.total_pages ?? 1;
      setTotalPages(total);
      setPage(pageNum);
      if (append) {
        setResults((prev) => [...prev, ...list]);
      } else {
        setResults(list);
      }
    } catch {
      setSearchError("Search failed. Please try again.");
      toast.error("Search failed. Please try again.");
      if (!append) setResults([]);
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }

  function markImageFailed(id: string) {
    setFailedImageIds((prev) => new Set(prev).add(id));
  }

  function tryPngFallback(
    id: string,
    card: TCGdexSearchResult,
    target: HTMLImageElement,
    quality: "low" | "high"
  ) {
    if (triedPngIds.has(id)) {
      markImageFailed(id);
      return;
    }
    const pngUrl = quality === "high" ? (card.imageUrlHighPng ?? card.imageUrlLowPng) : (card.imageUrlLowPng ?? card.imageUrlHighPng);
    if (pngUrl) {
      setTriedPngIds((prev) => new Set(prev).add(id));
      target.src = pngUrl;
    } else {
      markImageFailed(id);
    }
  }

  // Fetch full card details (set name, value) when preview opens
  useEffect(() => {
    if (!previewCard) {
      setPreviewDetails(null);
      return;
    }
    let cancelled = false;
    setPreviewDetails(null);
    fetch(`/api/tcgdex/cards/${encodeURIComponent(previewCard.id)}?lang=${encodeURIComponent(previewCard.language)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          const p = data.pricing;
          setPreviewDetails({
            set_name: data.set_name,
            localId: data.localId,
            set_total: data.set_total,
            marketPrice: p?.marketPrice,
            currency: p?.currency,
            cardmarketAvg: p?.cardmarketAvg,
            cardmarketCurrency: p?.cardmarketCurrency,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [previewCard]);

  function handleLoadMore() {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length >= 3 && page < totalPages) {
      runSearch(trimmedQuery, page + 1, true);
    }
  }

  async function handleAdd() {
    if (!selected || !username.trim()) {
      toast.error("Please fill in your trainer tag.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("image_url", selected.imageUrlHigh);
      formData.append("card_name", selected.name);
      formData.append("language", selected.language);
      if (selected.set_name) {
        formData.append("set_name", selected.set_name);
      }

      const res = await fetch("/api/cards", { method: "POST", body: formData });
      if (!res.ok) {
        let errorMsg = "Failed to add card";
        try {
          const data = await res.json();
          errorMsg = data.error ?? errorMsg;
        } catch {
          errorMsg = `${res.status} ${res.statusText}`;
        }
        throw new Error(errorMsg);
      }

      setSubmitted(true);
      toast.success(`${selected.name} added!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="py-12 flex flex-col items-center text-center space-y-6 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center relative">
          <CheckCircle2 className="w-10 h-10 text-primary stroke-[3]" />
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter">ADDED!</h2>
          <p className="text-sm text-muted-foreground font-medium">
            {selected?.name} is now in your collection.
          </p>
        </div>
        <div className="flex flex-col w-full gap-3 pt-4">
          <Button 
            onClick={() => router.push("/")}
            className="w-full h-12 font-black uppercase tracking-widest"
          >
            View Gallery
            <ArrowRight className="w-4 h-4 ml-2 stroke-[3]" />
          </Button>
          <Button 
            variant="ghost"
            onClick={() => {
              setSubmitted(false);
              setSelected(null);
              setQuery("");
            }}
            className="w-full h-12 font-black uppercase tracking-widest text-[10px] text-muted-foreground"
          >
            Add Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Trainer tag */}
      <div className="space-y-2">
        <Label htmlFor="search-username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Trainer tag
        </Label>
        <Input
          id="search-username"
          placeholder="e.g. AshKetchum"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          maxLength={32}
          className="h-12 text-sm font-bold bg-muted/30 border-border/40 focus:bg-background transition-all"
          autoComplete="off"
        />
      </div>

      {/* Search input */}
      <div className="space-y-2">
        <Label htmlFor="card-search" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Find a card
        </Label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none stroke-[3]" />
          <Input
            id="card-search"
            placeholder="e.g. Bulbasaur 166, Charizard 006/165"
            value={query}
            onChange={(e) => {
              setSelected(null);
              setQuery(e.target.value);
            }}
            className="pl-11 h-12 text-sm font-bold bg-muted/30 border-border/40 focus:bg-background transition-all"
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground stroke-[3]" />
          )}
        </div>
      </div>

      {/* Selected card preview */}
      {selected && (
        <div className="animate-scale-in rounded-lg border border-border/60 bg-muted/30 p-4 flex gap-4 items-center shadow-sm">
          <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden shadow-md border border-border/40 bg-muted flex items-center justify-center">
            {failedImageIds.has(`${selected.id}-${selected.language}`) ? (
              <span className="text-[8px] font-bold text-muted-foreground">No image</span>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selected.imageUrlLow}
                alt={selected.name}
                className="w-full h-full object-cover"
                onError={() => markImageFailed(`${selected.id}-${selected.language}`)}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs uppercase tracking-tight truncate leading-none">{selected.name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {selected.set_name && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate leading-none">
                  {selected.set_name}
                </p>
              )}
              <span className="rounded px-1 font-bold text-muted-foreground bg-muted/50 text-[8px]">
                {getCardLanguageLabel(selected.language)}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-background hover:bg-muted border border-border/40 flex items-center justify-center transition-all active:scale-90"
            aria-label="Deselect card"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Search error + retry */}
      {searchError && query.trim().length >= 3 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-destructive/90">{searchError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit font-black uppercase tracking-widest text-[10px]"
            onClick={() => runSearch(query.trim(), 1)}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Search results grid */}
      {results.length > 0 && !selected && (
        <div className="rounded-lg border border-border/40 overflow-hidden shadow-sm bg-muted/10">
          <div className="px-4 py-2 bg-muted/30 border-b border-border/40 text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
            <span>{results.length} results</span>
            <span className="opacity-40">click to preview</span>
          </div>
          <div
            className="grid grid-cols-3 sm:grid-cols-4 gap-px bg-border/40 overflow-y-auto"
            style={{ maxHeight: "20rem" }}
          >
            {results.map((card) => {
              const imageFailed = failedImageIds.has(`${card.id}-${card.language}`);
              return (
                <button
                  key={`${card.id}-${card.language}`}
                  onClick={() => setPreviewCard(card)}
                  className="relative bg-card p-3 flex flex-col items-center gap-2 hover:bg-muted/50 active:scale-95 transition-all duration-150 group"
                >
                  <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden bg-muted border border-border/20 shadow-sm flex items-center justify-center">
                    {imageFailed ? (
                      <span className="text-[10px] font-bold text-muted-foreground text-center px-1">
                        No image
                      </span>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={triedPngIds.has(`${card.id}-${card.language}`) && card.imageUrlLowPng ? card.imageUrlLowPng : card.imageUrlLow}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => tryPngFallback(`${card.id}-${card.language}`, card, e.currentTarget, "low")}
                      />
                    )}
                  </div>
                  <p className="text-[10px] font-bold leading-tight line-clamp-2 text-center w-full uppercase tracking-tighter">
                    {card.name}
                    <span className="flex items-center justify-center gap-1 mt-0.5 flex-wrap">
                      {card.localId && (
                        <span className="text-muted-foreground font-normal">No. {card.localId}</span>
                      )}
                      <span className="rounded px-1 font-bold text-muted-foreground bg-muted/50 text-[8px]">
                        {getCardLanguageLabel(card.language)}
                      </span>
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
          {page < totalPages && (
            <div className="p-3 border-t border-border/40 bg-muted/20">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-10 font-black uppercase tracking-widest text-[10px]"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                ) : (
                  `Load more (page ${page} of ${totalPages})`
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Card preview modal – larger view before selecting */}
      {previewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewCard(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Card preview"
        >
          <div
            className={cn(
              "relative rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden",
              "w-full max-w-sm sm:max-w-md animate-scale-in"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white transition-colors"
              aria-label="Close preview"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
            <div className="p-4 sm:p-6">
              <div className="relative w-full aspect-[2/3] max-h-[320px] mx-auto rounded-xl overflow-hidden bg-muted border border-border/40 shadow-lg flex items-center justify-center">
                {failedImageIds.has(`${previewCard.id}-${previewCard.language}`) ? (
                  <span className="text-sm font-bold text-muted-foreground">Image unavailable</span>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={triedPngIds.has(`${previewCard.id}-${previewCard.language}`) && previewCard.imageUrlHighPng ? previewCard.imageUrlHighPng : previewCard.imageUrlHigh}
                    alt={previewCard.name}
                    className="w-full h-full object-contain"
                    onError={(e) => tryPngFallback(`${previewCard.id}-${previewCard.language}`, previewCard, e.currentTarget, "high")}
                  />
                )}
              </div>
              <div className="mt-4 text-center space-y-2">
                <p className="font-black text-sm sm:text-base uppercase tracking-tight">
                  {previewCard.name}
                  {(previewDetails?.localId ?? previewCard.localId) && (
                    <span className="block text-muted-foreground font-bold text-xs normal-case mt-1">
                      {(previewDetails?.localId ?? previewCard.localId)}
                      {previewDetails?.set_total != null ? `/${previewDetails.set_total}` : ""}
                    </span>
                  )}
                </p>
                {(previewDetails?.set_name ?? previewCard.set_name) && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Pack: {previewDetails?.set_name ?? previewCard.set_name}
                  </p>
                )}
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Value:{" "}
                  {previewCard && previewDetails === null
                    ? "Loading…"
                    : (previewDetails?.marketPrice != null || previewDetails?.cardmarketAvg != null)
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: (previewDetails?.marketPrice != null ? previewDetails.currency : previewDetails?.cardmarketCurrency) ?? "USD",
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(previewDetails?.marketPrice ?? previewDetails?.cardmarketAvg ?? 0)
                      : "—"}
                </p>
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-black uppercase tracking-widest text-[10px]"
                onClick={() => setPreviewCard(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 font-black uppercase tracking-widest text-[10px]"
                onClick={() => {
                  setSelected(previewCard);
                  setPreviewCard(null);
                }}
              >
                Select this card
              </Button>
            </div>
          </div>
        </div>
      )}

      {query.trim().length >= 3 && !searching && results.length === 0 && !searchError && (
        <div className="text-center py-10 text-muted-foreground space-y-3">
          <p className="text-xs font-black uppercase tracking-widest">No cards found</p>
          <p className="text-[10px] font-medium">The API may be busy or the search had no matches.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-black uppercase tracking-widest text-[10px]"
            onClick={() => runSearch(query.trim(), 1)}
          >
            Try again
          </Button>
        </div>
      )}

      <Button
        onClick={handleAdd}
        disabled={!selected || !username.trim() || submitting || submitted}
        className="w-full h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin stroke-[3]" />
            Adding
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2 stroke-[3]" />
            Add to bulk
          </>
        )}
      </Button>
    </div>
  );
}
