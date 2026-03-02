import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CardGrid } from "@/components/CardGrid";
import { FilterPills } from "@/components/FilterPills";

interface HomePageProps {
  searchParams: Promise<{ username?: string }>;
}

export const dynamic = "force-dynamic";

async function getCards(username?: string) {
  return prisma.bulkCard.findMany({
    where: username ? { username } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

async function getStats() {
  const [totalCards, totalTrainers] = await Promise.all([
    prisma.bulkCard.count(),
    prisma.bulkCard.findMany({
      select: { username: true },
      distinct: ["username"],
    }),
  ]);
  return { totalCards, totalTrainers: totalTrainers.length };
}

async function getUsernames() {
  const result = await prisma.bulkCard.findMany({
    select: { username: true },
    distinct: ["username"],
    orderBy: { username: "asc" },
  });
  return result.map((r) => r.username);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { username } = await searchParams;

  const [rawCards, usernames, stats] = await Promise.all([
    getCards(username),
    getUsernames(),
    getStats(),
  ]);

  const cards = rawCards.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border/40 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.9] mb-6 animate-fade-in">
              COLLECT. <br />
              <span className="text-muted-foreground">SHARE.</span> <br />
              BULK.
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl animate-fade-in [animation-delay:100ms]">
              The community gallery for Pokémon bulk card only pullers. 
              Share yours and discover others.. become a bulk bro today!
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 animate-fade-in [animation-delay:200ms]">
              <div className="flex flex-col">
                <span className="text-3xl font-black tabular-nums">{stats.totalCards}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cards Shared</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tabular-nums">{stats.totalTrainers}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Trainers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black tracking-tight">THE GALLERY</h2>
            <p className="text-sm text-muted-foreground font-medium">Browse the latest bulk uploads from the community.</p>
          </div>
          
          {usernames.length > 0 && (
            <Suspense fallback={null}>
              <FilterPills
                usernames={usernames}
                currentUsername={username ?? null}
              />
            </Suspense>
          )}
        </div>

        <Suspense fallback={<CardGridSkeleton />}>
          <CardGrid cards={cards} />
        </Suspense>
      </section>
    </div>
  );
}

function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-4 animate-pulse">
          <div className="aspect-[3/4] bg-muted rounded-lg" />
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
