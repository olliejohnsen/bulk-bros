"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "New" },
  { value: "top", label: "Top" },
  { value: "oldest", label: "Old" },
  { value: "set", label: "Set" },
] as const;

interface SearchAndSortProps {
  currentSort: string;
  currentSearch: string;
}

export function SearchAndSort({ currentSort, currentSearch }: SearchAndSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(currentSearch);
  }, [currentSearch]);

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ search: value || null });
    }, 400);
  };

  const handleSort = (value: string) => {
    pushParams({ sort: value === "newest" ? null : value });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 pointer-events-none stroke-[3]" />
          <input
            type="text"
            placeholder="Search cards, trainers, or sets…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-16 pr-14 py-4 h-16 w-full rounded-[2rem] border-2 border-border/40 bg-card/50 backdrop-blur-md text-base font-black uppercase tracking-widest placeholder:text-muted-foreground/40 placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:border-primary/50 focus:ring-8 focus:ring-primary/5 transition-all shadow-xl"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2"
              aria-label="Clear search"
            >
              <X className="w-5 h-5 stroke-[3]" />
            </button>
          )}
        </div>

        {/* Sort pills */}
        <div className="flex items-center gap-1 p-2 h-16 rounded-[2rem] border-2 border-border/40 bg-card/50 backdrop-blur-md shadow-xl shrink-0">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSort(opt.value)}
              className={cn(
                "px-8 h-full rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                currentSort === opt.value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.05]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
