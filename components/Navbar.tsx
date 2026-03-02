"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Sparkles, Menu, X, Trophy, Grid3X3 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full px-4 py-4 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-full px-4 sm:px-6 h-14 pointer-events-auto shadow-2xl shadow-black/5 dark:shadow-primary/5 relative">
        {/* Left: Logo */}
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <span className="font-black text-lg sm:text-xl tracking-tighter transition-transform group-hover:-rotate-2 inline-block">
                BULK<span className="text-primary">BROS</span>
              </span>
              <div className="absolute -bottom-0.5 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[10px] h-8 rounded-full font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Link href="/" className="flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 stroke-[3]" />
                Gallery
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[10px] h-8 rounded-full font-black uppercase tracking-widest hover:bg-secondary/10 hover:text-secondary transition-all group/random"
            >
              <Link href="/random" className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 stroke-[3] group-hover/random:animate-pulse" />
                Random Pull
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[10px] h-8 rounded-full font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Link href="/hall-of-fame" className="flex items-center gap-2">
                <Trophy className="w-3 h-3 stroke-[3]" />
                Hall of Fame
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[10px] h-8 rounded-full font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Link href="/bingo" className="flex items-center gap-2">
                <Grid3X3 className="w-3 h-3 stroke-[3]" />
                Bulk Bingo
              </Link>
            </Button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center bg-muted/50 rounded-full p-0.5 border border-border/40">
            <ThemeToggle />
          </div>

          <Button
            asChild
            size="sm"
            className="rounded-full px-4 sm:px-6 h-9 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95 shimmer-bg"
          >
            <Link href="/upload">
              <Plus className="w-3 h-3 sm:mr-2 stroke-[4]" />
              <span className="hidden sm:inline">Share Bulk</span>
              <span className="sm:hidden">Share</span>
            </Link>
          </Button>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full w-9 h-9 hover:bg-primary/10 hover:text-primary transition-all"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5 stroke-[3]" /> : <Menu className="w-5 h-5 stroke-[3]" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={cn(
          "absolute top-[calc(100%+12px)] left-0 w-full glass rounded-[2rem] p-4 flex flex-col gap-2 transition-all duration-300 origin-top md:hidden shadow-2xl border border-white/10 dark:border-white/5",
          isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
        )}>
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            <Link href="/">
              <LayoutGrid className="w-4 h-4 stroke-[3]" />
              Gallery
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] hover:bg-secondary/10 hover:text-secondary"
            onClick={() => setIsOpen(false)}
          >
            <Link href="/random">
              <Sparkles className="w-4 h-4 stroke-[3]" />
              Random Pull
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            <Link href="/hall-of-fame">
              <Trophy className="w-4 h-4 stroke-[3]" />
              Hall of Fame
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsOpen(false)}
          >
            <Link href="/bingo">
              <Grid3X3 className="w-4 h-4 stroke-[3]" />
              Bulk Bingo
            </Link>
          </Button>

          <div className="h-px bg-border/40 my-1" />

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
