"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { User, ChevronDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainerFilterProps {
  usernames: string[];
  currentUsername: string | null;
}

export function TrainerFilter({ usernames, currentUsername }: TrainerFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const select = (value: string | null) => {
    if (!value) {
      router.push("/");
    } else {
      router.push(`/trainer/${encodeURIComponent(value)}`);
    }
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

  const filteredUsernames = usernames.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 shadow-sm min-w-[200px] justify-between h-12",
          currentUsername
            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
            : "bg-card/50 backdrop-blur-md border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <User className={cn("w-3.5 h-3.5 stroke-[3]", currentUsername ? "text-primary-foreground" : "text-primary")} />
          <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
            {currentUsername || "Filter by Trainer"}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300 stroke-[3]", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 neo-blur rounded-3xl overflow-hidden z-50 animate-scale-in shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-border/40">
          <div className="p-3 border-b border-border/40 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground stroke-[3]" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background/50 border border-border/40 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold focus:outline-none focus:border-primary/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <button
              onClick={() => select(null)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !currentUsername ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <span>All Trainers</span>
              {!currentUsername && <Check className="w-3 h-3 stroke-[4]" />}
            </button>

            {filteredUsernames.map((u) => (
              <button
                key={u}
                onClick={() => select(u)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  currentUsername === u ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="truncate">{u}</span>
                {currentUsername === u && <Check className="w-3 h-3 stroke-[4]" />}
              </button>
            ))}

            {filteredUsernames.length === 0 && (
              <div className="py-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                No trainers found
              </div>
            )}
          </div>

          {currentUsername && (
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
