import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CardGrid } from "@/components/CardGrid";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, TrendingUp, CreditCard, BarChart3, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlabSkeleton } from "@/components/SlabSkeleton";
import { fetchTcgdexCardDetails } from "@/lib/tcgdex";

interface TrainerPageProps {
  params: Promise<{
    username: string;
  }>;
}

export const dynamic = "force-dynamic";

async function getTrainerData(username: string) {
  const cards = await prisma.bulkCard.findMany({
    where: { username },
    orderBy: { createdAt: "desc" },
  });

  if (cards.length === 0) return null;

  // We need to fetch pricing for each unique card to calculate totals
  // In a real app, we'd cache this or store it in the DB.
  // For now, we'll fetch them in parallel.
  const uniqueImageUrls = [...new Set(cards.map(c => c.imageUrl))];
  
  // Extract TCGdex IDs from image URLs if possible, or just use the first card's ID
  // This is a bit of a heuristic since we don't store the TCGdex ID directly in BulkCard
  // Let's try to get pricing for each card.
  
  const cardDetails = await Promise.all(
    cards.map(async (card) => {
      // Heuristic: try to find the card in TCGdex to get pricing
      // The pattern is assets.tcgdex.net/{lang}/{serie}/{set}/{id}/high.webp
      try {
        const match = card.imageUrl.match(/assets\.tcgdex\.net\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
        if (match) {
          const lang = match[1];
          const setId = match[3];
          const localId = match[4];
          const tcgdexId = `${setId}-${localId}`;
          
          const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${tcgdexId}`, { next: { revalidate: 3600 } });
          if (res.ok) {
            const data = await res.json();
            let price = 0;
            
            // Try to find the best price
            if (data.pricing?.tcgplayer) {
              const p = data.pricing.tcgplayer;
              // Normal, then reverse, then holofoil
              const variant = p.normal || p.reverse || p["reverse-holofoil"] || p.holofoil;
              price = variant?.marketPrice || variant?.midPrice || 0;
            } 
            
            if (price === 0 && data.pricing?.cardmarket) {
              price = data.pricing.cardmarket.avg || data.pricing.cardmarket.low || 0;
            }
            
            return { ...card, price };
          }
        }
      } catch (e) {
        console.error(`Error fetching price for card ${card.id}:`, e);
      }
      return { ...card, price: 0 };
    })
  );

  const totalCards = cards.length;
  const totalValue = cardDetails.reduce((sum, c) => sum + c.price, 0);
  const avgValue = totalCards > 0 ? totalValue / totalCards : 0;

  // Enrich cards for the grid (same logic as home page)
  const imageUrls = [...new Set(cards.map((c) => c.imageUrl))];
  const sameCardRanks: Record<string, { count: number; indexById: Record<string, number> }> = {};
  await Promise.all(
    imageUrls.map(async (imageUrl) => {
      const byImage = await prisma.bulkCard.findMany({
        where: { imageUrl },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true },
      });
      const indexById: Record<string, number> = {};
      byImage.forEach((c, i) => {
        indexById[c.id] = i + 1;
      });
      sameCardRanks[imageUrl] = { count: byImage.length, indexById };
    })
  );

  const enrichedCards = cards.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    sameCardSlabCount: sameCardRanks[c.imageUrl].count,
    sameCardSlabIndex: sameCardRanks[c.imageUrl].indexById[c.id],
  }));

  return {
    username,
    totalCards,
    totalValue,
    avgValue,
    cards: enrichedCards,
  };
}

export default async function TrainerPage({ params }: TrainerPageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const data = await getTrainerData(decodedUsername);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen text-foreground relative pb-24">
      {/* Profile Header */}
      <div className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-primary/5 bg-primary/[0.02]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group mb-12"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform stroke-[3]" />
            Back to gallery
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <User className="w-10 h-10 sm:w-16 sm:h-16 text-primary-foreground stroke-[2.5]" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center shadow-xl -rotate-12 border-4 border-background">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-secondary-foreground fill-current" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                  Elite Bulk Trainer
                </div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none uppercase italic">
                  {data.username}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-md">
                  Curating the finest collection of bad bulk cards since {new Date(data.cards[data.cards.length-1].createdAt).getFullYear()}.
                </p>
              </div>
            </div>

            {/* Auto-generated Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full lg:w-auto">
              {[
                { 
                  label: "Total Bulk", 
                  value: data.totalCards, 
                  icon: CreditCard,
                  suffix: " Cards"
                },
                { 
                  label: "Total Value", 
                  value: `$${data.totalValue.toFixed(2)}`, 
                  icon: TrendingUp,
                  color: "text-secondary"
                },
                { 
                  label: "Avg Value", 
                  value: `$${data.avgValue.toFixed(2)}`, 
                  icon: BarChart3,
                  color: "text-primary"
                }
              ].map((stat) => (
                <div key={stat.label} className="bg-background/50 backdrop-blur-sm border border-primary/10 rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <stat.icon className={cn("w-5 h-5 opacity-50", stat.color || "text-foreground")} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-3xl font-black tabular-nums tracking-tighter", stat.color || "text-foreground")}>
                      {stat.value}
                    </span>
                    {stat.suffix && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                        {stat.suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trainer's Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight uppercase italic">The Collection</h2>
            <p className="text-sm text-muted-foreground font-medium">
              Every single piece of bulk pulled by {data.username}.
            </p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent ml-8 hidden sm:block" />
        </div>

        <Suspense fallback={<CardGridSkeleton />}>
          <CardGrid
            initialCards={data.cards}
            initialNextCursor={null}
            username={data.username}
          />
        </Suspense>
      </section>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-0">
          <SlabSkeleton variant="gallery" className="w-full" />
          <div className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-2.5 w-20 bg-muted rounded-full" />
                <div className="h-2 w-14 bg-muted/70 rounded-full" />
              </div>
            </div>
            <div className="h-8 w-16 bg-muted rounded-xl shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
