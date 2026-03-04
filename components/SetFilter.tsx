"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Layers, ChevronDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetFilterProps {
  sets: string[];
  currentSet: string | null;
}

export function SetFilter({ sets, currentSet }: SetFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const select = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("set");
    } else {
      params.set("set", value);
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
    setIsOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSets = sets.filter((s) =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all duration-300 shadow-lg w-full sm:min-w-[240px] justify-between h-14",
          currentSet
            ? "bg-secondary text-secondary-foreground border-secondary shadow-secondary/20"
            : "bg-card/50 backdrop-blur-md border-border/40 text-muted-foreground hover:border-secondary/30 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Layers className={cn("w-4 h-4 stroke-[3]", currentSet ? "text-secondary-foreground" : "text-secondary")} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] truncate max-w-[140px]">
            {currentSet || "Filter by Set"}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 stroke-[3]", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 neo-blur rounded-3xl overflow-hidden z-50 animate-scale-in shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border/40">
          <div className="p-3 border-b border-border/40 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground stroke-[3]" />
              <input
                type="text"
                placeholder="Search sets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background/50 border border-border/40 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold focus:outline-none focus:border-secondary/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button
              onClick={() => select(null)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !currentSet ? "bg-secondary/10 text-secondary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span>All Sets</span>
              {!currentSet && <Check className="w-3 h-3 stroke-[4]" />}
            </button>

            {filteredSets.map((s) => (
              <button
                key={s}
                onClick={() => select(s)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  currentSet === s ? "bg-secondary/10 text-secondary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{s}</span>
                {currentSet === s && <Check className="w-3 h-3 stroke-[4]" />}
              </button>
            ))}

            {filteredSets.length === 0 && (
              <div className="py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                No sets found
              </div>
            )}
          </div>

          {currentSet && (
            <div className="p-2 border-t border-border/40 bg-muted/10">
              <button
                onClick={() => select(null)}
                className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3 stroke-[3]" />
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
