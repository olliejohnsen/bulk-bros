"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BulkCard {
  id: string;
  imageUrl: string;
  username: string;
  likes: number;
  createdAt: string;
  cardName?: string | null;
  setName?: string | null;
}

interface CardItemProps {
  card: BulkCard;
  index?: number;
  onUsernameClick?: (username: string) => void;
}

const LIKED_STORAGE_KEY = "bulk-bros-liked";

function getLikedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(LIKED_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...ids]));
}

export function CardItem({ card, index = 0, onUsernameClick }: CardItemProps) {
  const [likes, setLikes] = useState(card.likes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLiked(getLikedIds().has(card.id));
  }, [card.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/like`, { method: "POST" });
      if (!res.ok) {
        throw new Error(`Failed to like: ${res.status}`);
      }
      const updated = await res.json();
      setLikes(updated.likes);
      setLiked(true);
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 700);
      const ids = getLikedIds();
      ids.add(card.id);
      saveLikedIds(ids);
    } catch {
      toast.error("Could not like card. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-fade-in group"
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <div
        ref={cardRef}
        className="relative rounded-lg overflow-hidden border border-border/40 bg-card transition-all duration-300 hover:border-border/80 hover:shadow-xl hover:shadow-black/5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={card.imageUrl}
            alt={card.cardName ?? `Bulk cards by ${card.username}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />

          {/* Subtle overlay on hover */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Like button — top right, always visible */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={handleLike}
              disabled={liked || loading}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-xl transition-all duration-300 select-none",
                liked
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                  : "bg-black/20 text-white hover:bg-black/40 hover:shadow-lg hover:shadow-black/10",
                loading && "opacity-60 cursor-not-allowed"
              )}
              aria-label={liked ? "Already liked" : "Like this card"}
            >
              <Heart
                className={cn(
                  "w-3.5 h-3.5 transition-all duration-300",
                  liked ? "fill-white" : "",
                  justLiked && "animate-heart-pop"
                )}
              />
              <span className="tabular-nums">{likes}</span>

              {/* +1 float */}
              {justLiked && (
                <span className="animate-float-up absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black text-rose-500 pointer-events-none">
                  +1
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Card footer */}
        <div className="p-4 space-y-3">
          <div className="space-y-1 min-h-[40px]">
            {card.cardName ? (
              <>
                <p className="text-sm font-black uppercase tracking-tight truncate leading-none">
                  {card.cardName}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate leading-none">
                  {card.setName ?? "POKÉMON"}
                </p>
              </>
            ) : (
              <p className="text-sm font-black uppercase tracking-tight truncate leading-none">
                BULK COLLECTION
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-border/40 flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUsernameClick?.(card.username);
              }}
              className="flex items-center gap-2 group/user min-w-0"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover/user:bg-primary transition-colors">
                <User className="w-3 h-3 text-muted-foreground group-hover/user:text-primary-foreground transition-colors" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground group-hover/user:text-foreground transition-colors truncate">
                {card.username}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
