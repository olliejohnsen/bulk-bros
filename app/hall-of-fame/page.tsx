import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GradingSlab } from "@/components/GradingSlab";
import { Heart, Trophy, Medal, ArrowLeft, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getTopCards() {
  return prisma.bulkCard.findMany({
    where: { likes: { gt: 0 } },
    orderBy: { likes: "desc" },
    take: 12,
  });
}

async function getLeaderboard() {
  const trainers = await prisma.bulkCard.groupBy({
    by: ["username"],
    _sum: { likes: true },
    _count: { id: true },
    orderBy: { _sum: { likes: "desc" } },
    take: 10,
  });
  return trainers.map((t) => ({
    username: t.username,
    totalLikes: t._sum.likes ?? 0,
    cardCount: t._count.id,
  }));
}

export default async function HallOfFamePage() {
  const [topCards, leaderboard] = await Promise.all([
    getTopCards(),
    getLeaderboard(),
  ]);

  const topCardsNorm = topCards.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }));

  return (
    <div className="min-h-screen text-foreground relative pb-24">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative pt-12 sm:pt-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group mb-12"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform stroke-[3]" />
          Back to gallery
        </Link>

        <div className="space-y-24">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-4">
              <Trophy className="w-3 h-3 fill-current" />
              The Legends
            </div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none">
              HALL OF <span className="text-primary">FAME.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">
              The most legendary pulls and dedicated trainers in the Bulk Bros community.
            </p>
          </div>

          {/* Top 3 Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {topCardsNorm.slice(0, 3).map((card, i) => (
              <Link
                key={card.id}
                href={`/card/${card.id}`}
                className="group animate-fade-in"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="relative flex flex-col gap-8">
                  {/* Rank Badge */}
                  <div className={cn(
                    "absolute -top-6 -left-6 w-20 h-20 rounded-3xl shadow-2xl flex items-center justify-center z-50 font-black border-8 border-background rotate-[-12deg] group-hover:rotate-0 transition-transform duration-500",
                    i === 0 ? "bg-secondary text-secondary-foreground scale-110" : "bg-background text-foreground"
                  )}>
                    <span className="text-3xl">#{i + 1}</span>
                  </div>

                  <GradingSlab 
                    cardId={card.id}
                    imageUrl={card.imageUrl}
                    cardName={card.cardName}
                    setName={card.setName}
                    variant="full"
                    className="w-full"
                  />
                  
                  <div className="flex items-center justify-between px-4">
                    <div className="space-y-1">
                      <p className="text-sm font-black uppercase tracking-widest text-foreground">
                        {card.username}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Legendary Trainer</p>
                    </div>
                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary/10 border border-secondary/20">
                      <Heart className="w-4 h-4 fill-secondary text-secondary" />
                      <span className="text-base font-black text-secondary tabular-nums">{card.likes}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-12 border-t border-border/20">
            {/* Elite Trainers List */}
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Star className="w-5 h-5 text-secondary fill-secondary" />
                  Elite Trainers
                </h2>
                <p className="text-sm text-muted-foreground">Top 10 trainers by total community likes</p>
              </div>
              
              <div className="grid gap-3">
                {leaderboard.map((trainer, i) => (
                  <Link
                    key={trainer.username}
                    href={`/?username=${encodeURIComponent(trainer.username)}`}
                    className="group"
                  >
                    <div className="neo-blur rounded-2xl p-5 flex items-center justify-between transition-all duration-500 hover:translate-x-2 hover:bg-primary/5">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2",
                          i === 0 ? "bg-secondary border-secondary text-secondary-foreground shadow-lg shadow-secondary/20" : 
                          "bg-primary/10 border-primary/20 text-primary"
                        )}>
                          {i === 0 ? <Medal className="w-6 h-6" /> : i + 1}
                        </div>
                        <div>
                          <p className="text-base font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                            {trainer.username}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                            {trainer.cardCount} Cards Shared
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/10 border border-secondary/20">
                        <Heart className="w-3 h-3 fill-secondary text-secondary" />
                        <span className="text-sm font-black text-secondary tabular-nums">{trainer.totalLikes}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Remaining Top Pulls */}
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                  Top Pulls #4 - #12
                </h2>
                <p className="text-sm text-muted-foreground">More legendary cards from the community</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {topCardsNorm.slice(3, 12).map((card, i) => (
                  <Link
                    key={card.id}
                    href={`/card/${card.id}`}
                    className="group animate-fade-in"
                    style={{ animationDelay: `${(i + 3) * 100}ms` }}
                  >
                    <div className="space-y-3">
                      <div className="relative">
                        <GradingSlab 
                          cardId={card.id}
                          imageUrl={card.imageUrl}
                          cardName={card.cardName}
                          setName={card.setName}
                          variant="gallery"
                          className="w-full"
                        />
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center z-40 shadow-xl group-hover:border-primary transition-colors">
                          <span className="text-[10px] font-black text-foreground">#{i + 4}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-secondary text-secondary" />
                          <span className="text-[10px] font-black tabular-nums">{card.likes}</span>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground truncate max-w-[60px]">
                          {card.username}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
