import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Info } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <span className="font-black text-2xl tracking-tighter transition-transform group-hover:-rotate-2 inline-block">
                BULK<span className="text-primary">BROS</span>
              </span>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-[11px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all"
            >
              <Link href="/" className="flex items-center gap-2">
                <LayoutGrid className="w-3 h-3 stroke-[3]" />
                Gallery
              </Link>
            </Button>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center bg-muted/50 rounded-full p-1 border border-border/40">
            <ThemeToggle />
          </div>
          
          <Button
            asChild
            size="sm"
            className="rounded-full px-5 h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            <Link href="/upload">
              <Plus className="w-3.5 h-3.5 mr-2 stroke-[4]" />
              Share Bulk
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
