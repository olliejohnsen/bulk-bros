"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CardItem } from "@/components/CardItem";
import { SlabSkeleton } from "@/components/SlabSkeleton";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkCard {
  id: string;
  imageUrl: string;
  username: string;
  likes: number;
  createdAt: string;
  cardName?: string | null;
  setName?: string | null;
  language?: string | null;
  sameCardSlabCount?: number;
  sameCardSlabIndex?: number;
}

interface CardGridProps {
  initialCards: BulkCard[];
  initialNextCursor: string | null;
  username?: string | null;
  sort?: string;
  search?: string;
}

export function CardGrid({
  initialCards,
  initialNextCursor,
  username,
  sort = "newest",
  search,
}: CardGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<BulkCard[]>(initialCards);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("cursor", nextCursor);
      params.set("limit", "20");
      if (username) params.set("username", username);
      if (sort && sort !== "newest") params.set("sort", sort);
      if (search) params.set("search", search);

      const res = await fetch(`/api/cards?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setCards((prev) => [
        ...prev,
        ...data.cards.map((c: BulkCard) => ({ ...c, createdAt: String(c.createdAt) })),
      ]);
      setNextCursor(data.nextCursor);
    } catch {
      // fail silently — user can scroll back up and try again
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading, username, sort, search]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleUsernameClick = (u: string) => {
    router.push(`/trainer/${encodeURIComponent(u)}`);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-primary/5 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xl font-bold">No cards here yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Be the first trainer to share your bulk collection with the community!
          </p>
        </div>
        <Button asChild className="shimmer-bg relative overflow-hidden">
          <Link href="/upload">Share your bulk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
        {cards.map((card, i) => (
          <CardItem
            key={card.id}
            card={card}
            index={Math.min(i, 19)}
            onUsernameClick={handleUsernameClick}
          />
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="space-y-0">
              <SlabSkeleton variant="gallery" className="w-full" />
              <div className="px-4 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <div className="h-2.5 w-20 bg-muted rounded-full animate-pulse" />
                    <div className="h-2 w-14 bg-muted/70 rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-16 bg-muted rounded-xl shrink-0 animate-pulse" />
              </div>
            </div>
          ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center items-center py-10">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Loading more…</span>
          </div>
        )}
        {!loading && !nextCursor && cards.length >= 20 && (
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
            You&apos;ve seen it all!
          </p>
        )}
      </div>
    </div>
  );
}
