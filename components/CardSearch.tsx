"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import type { PokeWalletCard } from "@/lib/pokewallet";

const SEARCH_PAGE_SIZE = 20;

interface CardSearchProps {
  username: string;
  onUsernameChange: (v: string) => void;
}

export function CardSearch({ username, onUsernameChange }: CardSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokeWalletCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<PokeWalletCard | null>(null);
  const [previewCard, setPreviewCard] = useState<PokeWalletCard | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmedQuery = query.trim();
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
    try {
      const res = await fetch(
        `/api/pokewallet/search?q=${encodeURIComponent(q)}&page=${pageNum}&limit=${SEARCH_PAGE_SIZE}`
      );
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }
      const data = await res.json();
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
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
      setLoadingMore(false);
    }
  }

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
      formData.append("pokewallet_id", selected.id);
      formData.append("card_name", selected.card_info.name);
      if (selected.card_info.set_name) {
        formData.append("set_name", selected.card_info.set_name);
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
      toast.success(`${selected.card_info.name} added!`);
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
            {selected?.card_info.name} is now in your collection.
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

  function getPrice(card: PokeWalletCard): string {
    const tcgPrice = card.tcgplayer?.prices?.[0]?.market_price;
    if (tcgPrice != null) return `$${tcgPrice.toFixed(2)}`;
    const cmPrice = card.cardmarket?.prices?.[0]?.trend;
    if (cmPrice != null) return `€${cmPrice.toFixed(2)}`;
    return "";
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
            placeholder="e.g. Charizard ex, Pikachu, SV2a…"
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
          <div className="relative w-12 h-16 flex-shrink-0 rounded-md overflow-hidden shadow-md border border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/pokewallet/image/${encodeURIComponent(selected.id)}?size=low`}
              alt={selected.card_info.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xs uppercase tracking-tight truncate leading-none">{selected.card_info.name}</p>
            {selected.card_info.set_name && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate mt-1.5 leading-none">
                {selected.card_info.set_name}
              </p>
            )}
            {selected.card_info.rarity && (
              <Badge variant="outline" className="text-[9px] mt-2 font-black uppercase tracking-widest border-border/60 rounded-sm px-1.5 py-0">
                {selected.card_info.rarity}
              </Badge>
            )}
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
              const price = getPrice(card);
              return (
                <button
                  key={card.id}
                  onClick={() => setPreviewCard(card)}
                  className="relative bg-card p-3 flex flex-col items-center gap-2 hover:bg-muted/50 active:scale-95 transition-all duration-150 group"
                >
                  <div className="relative w-full aspect-[2/3] rounded-sm overflow-hidden bg-muted border border-border/20 shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/pokewallet/image/${encodeURIComponent(card.id)}?size=low`}
                      alt={card.card_info.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <p className="text-[10px] font-bold leading-tight line-clamp-2 text-center w-full uppercase tracking-tighter">
                    {card.card_info.name}
                  </p>
                  {price && (
                    <span className="text-[9px] font-black tabular-nums text-primary">{price}</span>
                  )}
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
              <div className="relative w-full aspect-[2/3] max-h-[320px] mx-auto rounded-xl overflow-hidden bg-muted border border-border/40 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/pokewallet/image/${encodeURIComponent(previewCard.id)}?size=low`}
                  alt={previewCard.card_info.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-4 text-center space-y-2">
                <p className="font-black text-sm sm:text-base uppercase tracking-tight">
                  {previewCard.card_info.name}
                </p>
                {previewCard.card_info.set_name && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {previewCard.card_info.set_name}
                  </p>
                )}
                {previewCard.card_info.rarity && (
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/60 rounded-sm">
                    {previewCard.card_info.rarity}
                  </Badge>
                )}
                {getPrice(previewCard) && (
                  <p className="text-sm font-black tabular-nums text-primary">{getPrice(previewCard)}</p>
                )}
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

      {query.trim() && !searching && results.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-xs font-black uppercase tracking-widest">No cards found</p>
          <p className="text-[10px] font-medium mt-1">Try a different name or set code</p>
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
