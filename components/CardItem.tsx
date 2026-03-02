"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { GradingSlab } from "@/components/GradingSlab";
import { toast } from "sonner";

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
        className="relative transition-all duration-500 hover:scale-[1.03] group/card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Grading Slab Wrapper */}
        <Link href={`/card/${card.id}`} className="block relative">
          <GradingSlab 
            cardId={card.id}
            imageUrl={card.imageUrl} 
            cardName={card.cardName} 
            setName={card.setName}
            language={card.language}
            variant="gallery"
          />
        </Link>

        {/* Card footer */}
        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUsernameClick?.(card.username);
            }}
            className="flex items-center gap-2.5 group/user min-w-0 flex-1"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover/user:bg-primary transition-all duration-500 shadow-sm">
              <User className="w-4 h-4 text-primary group-hover/user:text-primary-foreground transition-colors stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors truncate">
                {card.username}
              </span>
              <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none mt-0.5 truncate">
                {card.sameCardSlabCount != null && card.sameCardSlabIndex != null && card.sameCardSlabCount > 1
                  ? `Slab ${card.sameCardSlabIndex} of ${card.sameCardSlabCount}`
                  : "Verified Trainer"}
              </span>
            </div>
          </button>

          {/* Like button — Positioned in the footer for better UI balance */}
          <button
            onClick={handleLike}
            disabled={liked || loading}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-300 select-none border",
              liked
                ? "bg-secondary text-secondary-foreground border-secondary/20 shadow-lg shadow-secondary/20"
                : "bg-muted/50 text-muted-foreground border-border/40 hover:border-primary/30 hover:text-primary hover:bg-primary/5",
              loading && "opacity-60 cursor-not-allowed"
            )}
            aria-label={liked ? "Already liked" : "Like this card"}
          >
            <Heart
              className={cn(
                "w-3 h-3 transition-all duration-300",
                liked ? "fill-current" : "",
                justLiked && "animate-heart-pop"
              )}
            />
            <span className="tabular-nums">{likes}</span>

            {/* +1 float */}
            {justLiked && (
              <span className="animate-float-up absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black text-secondary pointer-events-none">
                +1
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
