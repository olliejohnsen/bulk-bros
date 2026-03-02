"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FilterPillsProps {
  usernames: string[];
  currentUsername: string | null;
}

export function FilterPills({ usernames, currentUsername }: FilterPillsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const select = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("username");
    } else {
      params.set("username", value);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap sm:justify-end">
      <button
        onClick={() => select(null)}
        className={cn(
          "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
          !currentUsername
            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
            : "bg-card border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
        )}
      >
        All
      </button>
      {usernames.map((u) => (
        <button
          key={u}
          onClick={() => select(u)}
          className={cn(
            "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300",
            currentUsername === u
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-card border-border/40 text-muted-foreground hover:border-border hover:text-foreground"
          )}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
