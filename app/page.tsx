import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CardGrid } from "@/components/CardGrid";
import { TrainerFilter } from "@/components/TrainerFilter";
import { SetFilter } from "@/components/SetFilter";
import { SearchAndSort } from "@/components/SearchAndSort";
import { Button } from "@/components/ui/button";
import { Trophy, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlabSkeleton } from "@/components/SlabSkeleton";

interface HomePageProps {
  searchParams: Promise<{
    username?: string;
    sort?: string;
    search?: string;
    set?: string;
  }>;
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function getCards(username?: string, sort = "newest", search?: string, set?: string) {
  const where = {
    ...(username ? { username } : {}),
    ...(set ? { setName: set } : {}),
    ...(search
      ? { OR: [{ cardName: { contains: search } }, { username: { contains: search } }, { setName: { contains: search } }] }
      : {}),
  };
  const orderBy =
    sort === "top"
      ? { likes: "desc" as const }
      : sort === "oldest"
        ? { createdAt: "asc" as const }
        : { createdAt: "desc" as const };

  const rows = await prisma.bulkCard.findMany({
    where,
    orderBy,
    take: PAGE_SIZE + 1,
  });

  const hasMore = rows.length > PAGE_SIZE;
  const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const imageUrls = [...new Set(items.map((c) => c.imageUrl))];
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

  const cards = items.map((c) => ({
    ...c,
    sameCardSlabCount: sameCardRanks[c.imageUrl].count,
    sameCardSlabIndex: sameCardRanks[c.imageUrl].indexById[c.id],
  }));

  return { cards, nextCursor: hasMore ? items[items.length - 1].id : null };
}

async function getStats() {
  const [totalCards, trainersResult, likesResult] = await Promise.all([
    prisma.bulkCard.count(),
    prisma.bulkCard.findMany({ select: { username: true }, distinct: ["username"] }),
    prisma.bulkCard.aggregate({ _sum: { likes: true } }),
  ]);
  return {
    totalCards,
    totalTrainers: trainersResult.length,
    totalLikes: likesResult._sum.likes ?? 0,
  };
}

async function getUsernames() {
  const result = await prisma.bulkCard.findMany({
    select: { username: true },
    distinct: ["username"],
    orderBy: { username: "asc" },
  });
  return result.map((r) => r.username);
}

async function getSets() {
  const result = await prisma.bulkCard.findMany({
    where: { setName: { not: null } },
    select: { setName: true },
    distinct: ["setName"],
    orderBy: { setName: "asc" },
  });
  return result.map((r) => r.setName as string);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { username, sort = "newest", search, set: currentSet } = await searchParams;

  if (username) {
    const { redirect } = await import("next/navigation");
    redirect(`/trainer/${encodeURIComponent(username)}`);
  }

  const [{ cards: rawCards, nextCursor }, usernames, sets, stats] =
    await Promise.all([
      getCards(username, sort, search, currentSet),
      getUsernames(),
      getSets(),
      getStats(),
    ]);

  const cards = rawCards.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));

  return (
    <div className="min-h-screen text-foreground relative">
      {/* Hero */}
      <section className="relative pt-20 pb-24 sm:pt-32 sm:pb-40 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[10s]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none animate-pulse duration-[8s]" />
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] mb-8 animate-fade-in">
              COLLECT.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40">SHARE.</span><br />
              <span className="text-primary relative inline-block">
                BULK.
                <div className="absolute -bottom-2 left-0 w-full h-4 bg-primary/20 -rotate-1 -z-10" />
              </span>
            </h1>
            
            <p className="text-lg sm:text-2xl text-muted-foreground max-w-xl font-medium leading-relaxed animate-fade-in [animation-delay:100ms]">
              The community gallery for Pokémon bulk card only pullers. 
              Share yours and discover others.. become a bulk bro today!
            </p>

            {/* Hall of Fame Link */}
            <div className="mt-12 animate-fade-in [animation-delay:150ms]">
              <Button asChild variant="outline" className="rounded-full px-8 h-12 font-black uppercase tracking-widest border-secondary/20 hover:bg-secondary/5 hover:text-secondary group transition-all">
                <Link href="/hall-of-fame" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-secondary fill-secondary group-hover:scale-110 transition-transform" />
                  View Hall of Fame
                </Link>
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-16 w-full max-w-4xl animate-fade-in [animation-delay:200ms]">
              {[
                { label: "Cards", value: stats.totalCards, color: "primary" },
                { label: "Trainers", value: stats.totalTrainers, color: "secondary" },
                { label: "Likes", value: stats.totalLikes, color: "primary" }
              ].map((stat, i) => (
                <div key={stat.label} className="flex flex-col items-center min-w-[80px] sm:min-w-[120px]">
                  <span className={cn(
                    "text-4xl sm:text-6xl font-black tabular-nums leading-none tracking-tighter",
                    stat.color === "primary" ? "text-primary" : "text-secondary"
                  )}>
                    {stat.value}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
      </section>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight italic">THE GALLERY</h2>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest opacity-70">
                Browse the latest bulk uploads from the community.
              </p>
            </div>
            
            <div className="flex flex-col gap-8">
              <div className="w-full">
                <Suspense fallback={null}>
                  <SearchAndSort currentSort={sort} currentSearch={search ?? ""} />
                </Suspense>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
                <div className="flex-1 sm:flex-none min-w-[240px]">
                  {usernames.length > 0 && (
                    <Suspense fallback={null}>
                      <TrainerFilter usernames={usernames} currentUsername={username ?? null} />
                    </Suspense>
                  )}
                </div>

                <div className="flex-1 sm:flex-none min-w-[240px]">
                  {sets.length > 0 && (
                    <Suspense fallback={null}>
                      <SetFilter sets={sets} currentSet={currentSet ?? null} />
                    </Suspense>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<CardGridSkeleton />}>
          <CardGrid
            key={`${username ?? ""}-${currentSet ?? ""}-${sort}-${search ?? ""}`}
            initialCards={cards}
            initialNextCursor={nextCursor}
            username={username}
            sort={sort}
            search={search}
            set={currentSet}
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
