"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Sparkles, Zap, ArrowRight, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GradingSlab } from "@/components/GradingSlab";
import { toast } from "sonner";

interface RandomCard {
  id: string;
  imageUrl: string;
  cardName: string | null;
  username: string;
  likes: number;
}

export default function RandomPage() {
  const router = useRouter();
  const [card, setCard] = useState<RandomCard | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "opening" | "revealed">("loading");
  const [error, setError] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [loadingLike, setLoadingLike] = useState(false);
  const [justLiked, setJustLiked] = useState(false);

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

  // Generate random sparkle positions
  const sparkles = useMemo(() => 
    Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 1}s`,
      size: Math.random() * 20 + 10,
    })), []);

  useEffect(() => {
    async function fetchRandom() {
      try {
        const res = await fetch("/api/cards/random");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        
        const cardRes = await fetch(`/api/cards/${data.id}`);
        if (!cardRes.ok) {
          router.replace(`/card/${data.id}`);
          return;
        }
        const cardData = await cardRes.json();
        setCard(cardData);
        setLikes(cardData.likes);
        setLiked(getLikedIds().has(cardData.id));
        setStatus("ready");
      } catch (err) {
        console.error("Random fetch error:", err);
        setError(true);
        setTimeout(() => router.replace("/"), 2000);
      }
    }
    fetchRandom();
  }, [router]);

  const handleLike = async () => {
    if (!card || liked || loadingLike) return;
    setLoadingLike(true);
    try {
      const res = await fetch(`/api/cards/${card.id}/like`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
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
      setLoadingLike(false);
    }
  };

  const handleOpenPack = () => {
    if (status !== "ready") return;
    setStatus("opening");
    // Sequence: 
    // 0s: Subtle shake starts
    // 1.2s: Intense shake + Energy pulse
    // 2.0s: Burst + Flash
    // 2.2s: Card begins reveal
    setTimeout(() => {
      setStatus("revealed");
    }, 2200);
  };

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-destructive font-black uppercase tracking-widest">No cards found in the gallery!</p>
        <p className="text-xs text-muted-foreground">Redirecting you back home...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-4 py-12 overflow-hidden perspective-2000">
      {/* Flash Overlay */}
      {status === "revealed" && (
        <div className="fixed inset-0 bg-white z-[100] pointer-events-none animate-flash-out" />
      )}

      <div className="relative w-full max-w-sm flex items-center justify-center min-h-[600px]">
        
        {/* 1. Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center space-y-8 animate-fade-in">
            <div className="relative">
              <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center relative overflow-hidden">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                <div className="absolute inset-0 holo-overlay opacity-50" />
              </div>
              <div className="absolute -inset-4 rounded-[3rem] border border-primary/20 animate-ping [animation-duration:2s]" />
            </div>
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">Finding a Pack...</h1>
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin stroke-[3]" />
                <p className="text-xs font-black uppercase tracking-widest">Consulting the bulk gods</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Ready to Open (The Pack) */}
        {(status === "ready" || status === "opening") && (
          <div 
            className={cn(
              "relative w-[320px] h-[480px] cursor-pointer group transition-all duration-700 my-8",
              status === "ready" && "hover:scale-105 active:scale-95 animate-pack-float",
              status === "opening" && "animate-pack-shake-subtle"
            )}
            onClick={handleOpenPack}
          >
            {/* Energy Pulse Glow */}
            <div className={cn(
              "absolute inset-0 bg-primary/20 blur-[100px] rounded-full",
              status === "opening" ? "animate-energy-pulse" : "animate-glow-pulse"
            )} />
            
            {/* Pack Wrapper */}
            <div className={cn(
              "relative w-full h-full preserve-3d",
              status === "opening" && "[animation-delay:1.2s] animate-pack-shake-intense"
            )}>
              {/* Top Half */}
              <div className={cn(
                "absolute inset-0 h-1/2 pack-gradient pack-border rounded-t-2xl z-30 transition-all duration-700 origin-bottom overflow-hidden flex flex-col items-center",
                status === "opening" && "[animation-delay:2.0s] animate-pack-burst-top"
              )}>
                {/* Top Crimp */}
                <div className="w-full h-12 crimp-pattern opacity-40 border-b border-white/5" />
                
                {/* Foil Shine */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-foil-shine pointer-events-none" />
                
                {/* Logo Section */}
                <div className="mt-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Zap className="w-10 h-10 fill-primary text-primary" />
                  </div>
                  <h2 className="text-4xl font-black tracking-tighter text-white leading-none">BULK<br/>BROS</h2>
                </div>
              </div>

              {/* Bottom Half */}
              <div className={cn(
                "absolute bottom-0 left-0 w-full h-1/2 pack-gradient pack-border rounded-b-2xl z-20 transition-all duration-700 origin-top overflow-hidden flex flex-col items-center justify-end",
                status === "opening" && "[animation-delay:2.0s] animate-pack-burst-bottom"
              )}>
                {/* Foil Shine */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-foil-shine pointer-events-none" />
                
                {/* Info Section */}
                <div className="mb-12 text-center px-8 w-full">
                  <div className="flex items-center justify-center gap-2 mb-6 opacity-40">
                    <div className="h-px flex-1 bg-white/20" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Official Booster</span>
                    <div className="h-px flex-1 bg-white/20" />
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 py-3 rounded-xl backdrop-blur-md shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                      {status === "ready" ? "Tap to Rip" : "Opening..."}
                    </p>
                  </div>
                </div>

                {/* Bottom Crimp */}
                <div className="w-full h-12 crimp-pattern opacity-40 border-t border-white/5" />
              </div>

              {/* Physical Tear Line */}
              {status === "ready" && (
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 z-40 flex items-center justify-center">
                  <div className="px-4 py-1 bg-[#0f172a] border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-primary shadow-2xl">
                    Rip Here
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Revealed Card */}
        {status === "revealed" && card && (
          <div className="flex flex-col items-center space-y-10 w-full animate-card-reveal-super-dramatic relative py-12">
            {/* Sparkle Particles */}
            {sparkles.map(s => (
              <Star 
                key={s.id}
                className="absolute text-secondary fill-secondary animate-sparkle pointer-events-none"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  animationDelay: s.delay
                }}
              />
            ))}

            <div className="relative w-[320px] sm:w-[360px] group">
              <GradingSlab 
                cardId={card.id}
                imageUrl={card.imageUrl} 
                cardName={card.cardName} 
                setName={null}
                variant="full"
              />
              
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(var(--secondary-rgb),0.5)] animate-float z-10 border-4 border-background">
                <Sparkles className="w-8 h-8 text-secondary-foreground" />
              </div>
            </div>

            <div className="text-center space-y-6 max-w-sm mx-auto">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-secondary/20 mb-2">
                  <Star className="w-3 h-3 fill-current" />
                  Epic Pull!
                </div>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter leading-tight drop-shadow-sm break-words">
                  {card.cardName || "Bulk Collection"}
                </h2>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
                  Shared by <span className="text-foreground">{card.username}</span>
                </p>
              </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center w-full">
                      <Button 
                        onClick={handleLike}
                        disabled={liked || loadingLike}
                        variant={liked ? "secondary" : "default"}
                        className={cn(
                          "rounded-full px-10 h-14 font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden",
                          liked ? "bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20" : "shadow-2xl shadow-primary/30",
                          loadingLike && "opacity-60"
                        )}
                      >
                        <Heart className={cn("w-5 h-5 mr-2", liked && "fill-current", justLiked && "animate-heart-pop")} />
                        {liked ? `${likes} Liked!` : "Like Pull"}
                        {justLiked && (
                          <span className="animate-float-up absolute top-0 left-1/2 -translate-x-1/2 text-sm font-black text-secondary pointer-events-none">
                            +1
                          </span>
                        )}
                      </Button>
                      <Button 
                        onClick={() => router.push(`/card/${card.id}`)}
                        variant="outline"
                        className="rounded-full px-10 h-14 font-black uppercase tracking-widest border-border/60 bg-background/50 backdrop-blur-md hover:bg-muted transition-all"
                      >
                        View Details
                        <ArrowRight className="w-5 h-5 ml-2 stroke-[3]" />
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => window.location.reload()}
                        className="rounded-full px-10 h-14 font-black uppercase tracking-widest hover:bg-primary/5 transition-all"
                      >
                        Pull Again
                      </Button>
                    </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
