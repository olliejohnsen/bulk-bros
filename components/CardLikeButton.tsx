"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

interface CardLikeButtonProps {
  cardId: string;
  initialLikes: number;
}

export function CardLikeButton({ cardId, initialLikes }: CardLikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

  useEffect(() => {
    setLiked(getLikedIds().has(cardId));
  }, [cardId]);

  const handleLike = async () => {
    if (liked || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/like`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const updated = await res.json();
      setLikes(updated.likes);
      setLiked(true);
      setJustLiked(true);
      setTimeout(() => setJustLiked(false), 700);
      const ids = getLikedIds();
      ids.add(cardId);
      saveLikedIds(ids);
    } catch {
      toast.error("Could not like card. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={cn(
        "relative flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all duration-300 select-none",
        liked
          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 cursor-default"
          : "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5 active:scale-95",
        loading && "opacity-60 cursor-not-allowed"
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-all duration-300",
          liked ? "fill-white" : "",
          justLiked && "animate-heart-pop"
        )}
      />
      <span className="tabular-nums">{likes}</span>
      {liked && <span className="text-[10px] opacity-70">liked</span>}

      {justLiked && (
        <span className="animate-float-up absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black text-rose-500 pointer-events-none">
          +1
        </span>
      )}
    </button>
  );
}
