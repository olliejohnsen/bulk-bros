"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ShieldCheck, Award, Fingerprint } from "lucide-react";

interface GradingSlabProps {
  cardId: string;
  imageUrl: string;
  cardName?: string | null;
  setName?: string | null;
  className?: string;
  showHolo?: boolean;
  variant?: "gallery" | "full";
}

export function GradingSlab({
  cardId,
  imageUrl,
  cardName,
  setName,
  className,
  showHolo = true,
  variant = "full",
}: GradingSlabProps) {
  const isGallery = variant === "gallery";
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientY - rect.top) / rect.height - 0.5;
    const y = (e.clientX - rect.left) / rect.width - 0.5;
    setTilt({ x: x * -15, y: y * 15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const { serial, grade } = useMemo(() => {
    if (!cardId) return { serial: "BB-000000", grade: 1 };
    const s = `BB-${cardId.substring(0, 6).toUpperCase()}`;
    const lastChar = cardId.charCodeAt(cardId.length - 1);
    const g = (lastChar % 3) + 1;
    return { serial: s, grade: g };
  }, [cardId]);

  const radiusClass = isGallery ? "rounded-[1.2rem]" : "rounded-[2rem]";
  const innerRadiusClass = isGallery ? "rounded-[1rem]" : "rounded-[1.8rem]";

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative group/slab select-none perspective-2000 animate-slab-entrance", 
        radiusClass,
        className
      )}
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.1s ease-out",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Dynamic shadow */}
      <div 
        className={cn(
          "absolute inset-8 bg-black/20 blur-2xl -z-10 pointer-events-none transition-transform duration-100",
          radiusClass
        )}
        style={{
          transform: `translateX(${tilt.y * -1}px) translateY(${tilt.x * 1}px) translateZ(-40px)`,
        }}
      />

      <div className={cn("slab-side-thickness", radiusClass)} />

      <div className={cn(
        "slab-glass relative overflow-hidden transition-all duration-700 group-hover/slab:shadow-primary/30",
        radiusClass,
        isGallery ? "p-2 pb-4 border-[1.5px]" : "p-5 pb-10 border-2"
      )}>
        <div className={cn("slab-edge-highlight", radiusClass)} />
        <div className={cn("slab-plastic-texture", radiusClass)} />
        <div className={cn("slab-internal-rails", innerRadiusClass)} />

        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-lg pointer-events-none z-10" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-lg pointer-events-none z-10" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-lg pointer-events-none z-10" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-lg pointer-events-none z-10" />
        
        <div 
          className="absolute inset-0 slab-reflection bg-[length:200%_100%] pointer-events-none opacity-30 z-20" 
          style={{
            transform: `translateX(${tilt.y * 2}%) translateY(${tilt.x * 2}%)`,
            transition: "transform 0.1s ease-out",
          }}
        />

        {/* Slab header */}
        <div className={cn(
          "slab-label-custom border border-black/60 relative overflow-hidden z-30 shadow-xl",
          isGallery ? "rounded-lg p-2 mb-2.5" : "rounded-2xl p-4 mb-6"
        )}
        style={{ transform: "translateZ(25px)" }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="flex justify-between items-center gap-2 relative z-10">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1">
                <ShieldCheck className={cn("text-primary stroke-[3]", isGallery ? "w-2 h-2" : "w-3.5 h-3.5")} />
                <span className={cn("font-black uppercase tracking-[0.2em] text-primary", isGallery ? "text-[6px]" : "text-[9px]")}>
                  BULK BROS
                </span>
              </div>
              <h3 className={cn(
                "font-black uppercase tracking-tight truncate leading-none text-white",
                isGallery ? "text-[10px]" : "text-[15px]"
              )}>
                {cardName || "Bulk Collection"}
              </h3>
              <p className={cn(
                "font-bold uppercase tracking-[0.1em] text-white/40 truncate leading-none mt-0.5",
                isGallery ? "text-[6px]" : "text-[10px]"
              )}>
                {setName || "Pokémon TCG"}
              </p>
              <div className="flex items-center gap-1 opacity-30 mt-2">
                <Fingerprint className={cn("text-white", isGallery ? "w-2 h-2" : "w-2.5 h-2.5")} />
                <span className={cn("font-mono font-black text-white uppercase tracking-tighter", isGallery ? "text-[5px]" : "text-[7px]")}>
                  {serial}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className={cn("font-black uppercase tracking-widest text-primary leading-none", isGallery ? "text-[5px]" : "text-[8px]")}>BULK</p>
                <p className={cn("font-black uppercase tracking-widest text-primary leading-none mt-0.5", isGallery ? "text-[5px]" : "text-[8px]")}>SHIT</p>
              </div>
              <div className={cn(
                "slab-score-gold rounded-lg flex items-center justify-center border border-white/20 shadow-lg",
                isGallery ? "w-8 h-8" : "w-14 h-14"
              )}>
                <span className={cn("font-black leading-none italic text-black", isGallery ? "text-lg" : "text-3xl")}>{grade}</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40" />
        </div>

        {/* Recessed card tray */}
        <div 
          className={cn(
            "slab-inner-recess relative aspect-[3/4] overflow-hidden z-30",
            isGallery ? "rounded-lg p-1" : "rounded-xl p-2"
          )}
          style={{ transform: "translateZ(10px)" }}
        >
          <div className="absolute inset-0 border-[3px] border-black/40 pointer-events-none z-10" />
          <div className="relative w-full h-full rounded-md overflow-hidden bg-black/60">
            <Image
              src={imageUrl}
              alt={cardName || "Graded Card"}
              fill
              className="object-contain p-1"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            {showHolo && (
              <div 
                className="absolute inset-0 holo-overlay opacity-20 group-hover/slab:opacity-60 transition-opacity duration-700" 
                style={{ backgroundPosition: `${50 + tilt.y * 2}% ${50 + tilt.x * 2}%` }}
              />
            )}
            <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] pointer-events-none" />
          </div>
        </div>

        {/* Bottom security seal */}
        {!isGallery && (
          <div className="mt-8 flex justify-center relative z-30" style={{ transform: "translateZ(30px)" }}>
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-2xl shadow-2xl relative">
              <Award className="w-6 h-6 text-primary/60 stroke-[2.5]" />
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-[spin_30s_linear_infinite]" />
              <div className="absolute -inset-2 border border-white/5 rounded-full pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
