"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Grid3X3, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BINGO_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

interface BingoCard {
  id: string;
  name: string;
  imageUrl: string;
  setName?: string | null;
  /** Card number in set (e.g. "001") */
  localId?: string | null;
  /** Total cards in set for "001/165" display */
  setTotal?: number | null;
}

type Ownership = "pending" | "owned" | "not_owned";

interface Slot {
  card: BingoCard;
  ownership: Ownership;
  adding?: boolean;
}

function checkBingo(slots: (Slot | null)[]): boolean {
  const filled = slots.filter((s) => s?.ownership === "owned").length;
  if (filled < 3) return false;
  return BINGO_LINES.some((line) =>
    line.every((i) => slots[i]?.ownership === "owned")
  );
}

export default function BingoPage() {
  const [username, setUsername] = useState("");
  const [slots, setSlots] = useState<(Slot | null)[]>(Array(9).fill(null));
  const [pulling, setPulling] = useState(false);
  const [bingoWon, setBingoWon] = useState(false);

  const filledCount = slots.filter(Boolean).length;
  const hasBingo = checkBingo(slots);
  const isFull = filledCount >= 9;

  async function handlePull() {
    const name = username.trim();
    if (!name) {
      toast.error("Enter your trainer name first");
      return;
    }
    if (isFull) return;
    setPulling(true);
    try {
      const res = await fetch("/api/bingo/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Draw failed");
        return;
      }
      setSlots((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s === null);
        if (idx !== -1) next[idx] = { card: data, ownership: "pending", adding: false };
        const newBingo = checkBingo(next);
        if (newBingo && !bingoWon) setBingoWon(true);
        return next;
      });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPulling(false);
    }
  }

  async function handleOwn(slotIndex: number) {
    const slot = slots[slotIndex];
    if (!slot || slot.ownership !== "pending") return;
    const name = username.trim();
    if (!name) {
      toast.error("Enter your trainer name first");
      return;
    }
    setSlots((prev) => {
      const next = [...prev];
      const s = next[slotIndex];
      if (s && s.ownership === "pending") next[slotIndex] = { ...s, adding: true };
      return next;
    });
    try {
      const res = await fetch("/api/bingo/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          imageUrl: slot.card.imageUrl,
          cardName: slot.card.name,
          setName: slot.card.setName ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add card");
        setSlots((prev) => {
          const next = [...prev];
          const s = next[slotIndex];
          if (s) next[slotIndex] = { ...s, adding: false };
          return next;
        });
        return;
      }
      setSlots((prev) => {
        const next = [...prev];
        const s = next[slotIndex];
        if (s) next[slotIndex] = { ...s, ownership: "owned", adding: false };
        return next;
      });
      toast.success("Added to your bulk gallery!");
    } catch {
      toast.error("Something went wrong");
      setSlots((prev) => {
        const next = [...prev];
        const s = next[slotIndex];
        if (s) next[slotIndex] = { ...s, adding: false };
        return next;
      });
    }
  }

  function handleNotOwn(slotIndex: number) {
    setSlots((prev) => {
      const next = [...prev];
      const s = next[slotIndex];
      if (s && s.ownership === "pending") {
        next[slotIndex] = { ...s, ownership: "not_owned" };
      }
      const newBingo = checkBingo(next);
      if (newBingo && !bingoWon) setBingoWon(true);
      return next;
    });
  }

  function handlePlayAgain() {
    setSlots(Array(9).fill(null));
    setBingoWon(false);
  }

  return (
    <div className="min-h-screen text-foreground relative pb-24 overflow-x-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse [animation-duration:8s]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[150px] rounded-full animate-pulse [animation-duration:12s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_70%)] opacity-50" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative pt-6 sm:pt-12">
        <div className="flex justify-between items-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300 stroke-[3]" />
            Gallery
          </Link>
          
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-primary/70">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Live Bingo
          </div>
        </div>

        <div className="text-center space-y-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both">
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter leading-none italic">
            BULK <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">BINGO</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed font-medium">
            The ultimate bulk pulling experience. Mark what you own to build your gallery. 
            <span className="block mt-1 text-primary/80 font-bold">3 in a row = BINGO glory.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start">
          {/* Left Column: The Grid */}
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto lg:mx-0">
              {slots.map((slot, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden flex flex-col transition-all duration-500 ease-out group",
                    slot
                      ? "border-2 border-primary/40 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] bg-card ring-1 ring-primary/20"
                      : "border-2 border-dashed border-primary/10 bg-primary/[0.02] hover:bg-primary/[0.05] hover:border-primary/20"
                  )}
                >
                  {slot ? (
                    <div className="flex flex-col h-full animate-in fade-in zoom-in-90 duration-500">
                      <div className="relative flex-1 min-h-0 bg-muted/20">
                        <Image
                          src={slot.card.imageUrl}
                          alt={slot.card.name}
                          fill
                          className="object-contain p-2 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1"
                          sizes="(max-width: 640px) 33vw, 300px"
                          unoptimized={slot.card.imageUrl.startsWith("http")}
                        />
                        
                        {/* Status Overlays */}
                        {slot.ownership === "owned" && (
                          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300 z-10">
                            <div className="bg-primary text-primary-foreground text-[8px] sm:text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md rotate-[-12deg] shadow-lg border border-white/20">
                              Owned
                            </div>
                          </div>
                        )}
                        {slot.ownership === "not_owned" && (
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-300 z-10">
                            <div className="bg-muted text-muted-foreground text-[8px] sm:text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md rotate-[12deg] shadow-lg border border-white/10">
                              Skipped
                            </div>
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 sm:p-3 z-10">
                          <p className="text-[9px] sm:text-[11px] font-black text-white truncate uppercase tracking-tight">{slot.card.name}</p>
                          <p className="text-[7px] sm:text-[9px] text-white/70 truncate font-bold uppercase tracking-tighter">
                            {slot.card.setName || "Unknown Set"}
                          </p>
                        </div>
                      </div>
                      
                      {slot.ownership === "pending" && (
                        <div className="grid grid-cols-2 gap-px bg-border/50 border-t border-border/50 shrink-0">
                          <button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-[8px] sm:text-[10px] font-black uppercase py-2.5 transition-colors disabled:opacity-50"
                            onClick={() => handleOwn(i)}
                            disabled={slot.adding}
                          >
                            {slot.adding ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "OWN"}
                          </button>
                          <button
                            className="bg-background hover:bg-muted text-foreground text-[8px] sm:text-[10px] font-black uppercase py-2.5 transition-colors disabled:opacity-50"
                            onClick={() => handleNotOwn(i)}
                            disabled={slot.adding}
                          >
                            NO
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border border-primary/10 flex items-center justify-center text-[10px] font-black text-primary/20">
                        {i + 1}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Controls & Info */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="bg-card/50 backdrop-blur-md border-2 border-primary/10 rounded-3xl p-6 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700 fill-mode-both [animation-delay:200ms]">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="bingo-username" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    Trainer Identity
                  </Label>
                  <Input
                    id="bingo-username"
                    placeholder="ENTER NAME..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-14 font-black text-lg rounded-2xl border-2 border-primary/10 bg-background/50 focus-visible:ring-primary/30 transition-all placeholder:text-muted-foreground/30 uppercase italic"
                    maxLength={32}
                    disabled={pulling}
                  />
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handlePull}
                    disabled={!username.trim() || pulling || isFull}
                    className="w-full h-16 font-black uppercase tracking-[0.15em] text-base rounded-2xl shadow-[0_8px_0_rgb(var(--primary-rgb),0.2)] active:translate-y-[4px] active:shadow-[0_4px_0_rgb(var(--primary-rgb),0.2)] transition-all duration-100 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    {pulling ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        PULLING...
                      </span>
                    ) : isFull ? (
                      "GRID COMPLETE"
                    ) : (
                      <span className="flex items-center gap-3 italic">
                        PULL BULK <Grid3X3 className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                  
                  <div className="flex justify-between items-center px-2">
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      Progress
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            i < filledCount ? "bg-primary scale-110" : "bg-primary/10"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bingo Status */}
            {hasBingo && (
              <div className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-2xl shadow-primary/40 animate-in zoom-in-95 duration-500 italic overflow-hidden relative">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <PartyPopper className="w-10 h-10 mb-3 animate-bounce" />
                <h2 className="text-4xl font-black tracking-tighter leading-none mb-2">BINGO!</h2>
                <p className="text-sm font-bold opacity-90 mb-6 leading-tight uppercase tracking-tight">
                  You&apos;ve achieved bulk greatness. Your collection is growing.
                </p>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="secondary" className="w-full font-black uppercase tracking-widest text-[10px] h-10 rounded-xl">
                    <Link href="/">VIEW GALLERY</Link>
                  </Button>
                  {!isFull && (
                    <button
                      className="w-full text-[10px] font-black uppercase tracking-widest h-10 hover:bg-white/10 rounded-xl transition-colors"
                      onClick={handlePull}
                      disabled={pulling}
                    >
                      KEEP PULLING
                    </button>
                  )}
                </div>
              </div>
            )}

            {isFull && (
              <Button 
                variant="ghost" 
                onClick={handlePlayAgain} 
                className="w-full rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-muted-foreground hover:text-primary transition-colors h-12 border-2 border-dashed border-primary/5"
              >
                RESET GRID
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        :root {
          --primary-rgb: 88, 101, 242; /* Adjust to match your primary color */
        }
      `}</style>
    </div>
  );
}
