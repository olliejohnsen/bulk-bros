"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { CardSearch } from "@/components/CardSearch";

export default function UploadPage() {
  const [sharedUsername, setSharedUsername] = useState("");

  return (
    <div className="min-h-screen selection:bg-primary selection:text-primary-foreground relative">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary-rgb),0.05)_0%,transparent_50%)] pointer-events-none" />

      <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-24 space-y-12">
        <div className="space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform stroke-[3]" />
            Back to gallery
          </Link>
          
          <div className="space-y-3">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-[0.85] animate-fade-in">
              SHARE YOUR <br />
              <span className="text-primary relative">
                BULK.
                <span className="absolute -bottom-1 left-0 w-full h-2 bg-primary/20 -rotate-1 -z-10" />
              </span>
            </h1>
            <p className="text-base text-muted-foreground font-medium max-w-[280px] leading-snug animate-fade-in [animation-delay:100ms]">
              Search for a card and add it to the community collection.
            </p>
          </div>
        </div>

        <div className="neo-blur rounded-3xl p-6 sm:p-8 animate-fade-in [animation-delay:200ms]">
          <CardSearch
            username={sharedUsername}
            onUsernameChange={setSharedUsername}
          />
        </div>

        <div className="p-5 rounded-2xl border border-border/40 bg-muted/20 flex flex-col gap-3 group hover:border-primary/30 transition-colors animate-fade-in [animation-delay:300ms]">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-3.5 h-3.5 text-primary stroke-[3]" />
          </div>
          <p className="text-[11px] font-bold leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors">
            Search by card name or set to find your pull, then add it with your trainer name.
          </p>
        </div>
      </div>
    </div>
  );
}
