import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCardLanguageLabel } from "@/lib/tcgdex";
import { CardLikeButton } from "@/components/CardLikeButton";
import { CopyLinkButtonClient } from "@/components/CopyLinkButton";
import { GradingSlab } from "@/components/GradingSlab";
import { SlabSkeleton } from "@/components/SlabSkeleton";
import { ArrowLeft, User, Calendar, Tag } from "lucide-react";

interface CardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await prisma.bulkCard.findUnique({ where: { id } });
  if (!card) return { title: "Card not found" };

  const title = card.cardName
    ? `${card.cardName} — ${card.username}'s Pull`
    : `${card.username}'s Bulk Collection`;

  return {
    title,
    description: `Check out ${card.username}'s ${card.cardName ?? "bulk collection"} on Bulk Bros. ${card.likes} likes.`,
    openGraph: {
      title,
      description: `Check out ${card.username}'s ${card.cardName ?? "bulk collection"} on Bulk Bros.`,
      images: [{ url: card.imageUrl, width: 600, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [card.imageUrl],
    },
  };
}

async function CardContent({ id }: { id: string }) {
  const card = await prisma.bulkCard.findUnique({ where: { id } });
  if (!card) notFound();

  const [sameCardSlabCount, sameCardSlabIndex] = await Promise.all([
    prisma.bulkCard.count({ where: { imageUrl: card.imageUrl } }),
    prisma.bulkCard.count({
      where: {
        imageUrl: card.imageUrl,
        OR: [
          { createdAt: { gt: card.createdAt } },
          { createdAt: card.createdAt, id: { gte: card.id } },
        ],
      },
    }),
  ]);

  const uploadedAt = new Date(card.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start">
      {/* Image */}
      <div className="animate-fade-in">
        <GradingSlab 
          cardId={card.id}
          imageUrl={card.imageUrl} 
          cardName={card.cardName} 
          setName={card.setName}
          language={card.language}
          className="w-full max-w-md mx-auto"
        />
      </div>

      {/* Details */}
      <div className="space-y-8 animate-fade-in [animation-delay:100ms]">
        <div className="space-y-2">
          {card.cardName ? (
            <>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">
                {card.cardName.toUpperCase()}
              </h1>
              {card.setName && (
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                  {card.setName}
                </p>
              )}
            </>
          ) : (
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-none">
              BULK COLLECTION
            </h1>
          )}
        </div>

        <div className="space-y-4 py-8 border-y border-border/40">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary stroke-[3]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trainer</p>
              <Link
                href={`/?username=${encodeURIComponent(card.username)}`}
                className="text-base font-black uppercase tracking-tight hover:text-primary transition-colors"
              >
                {card.username}
              </Link>
              {sameCardSlabCount != null && sameCardSlabIndex != null && sameCardSlabCount > 1 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Slab {sameCardSlabIndex} of {sameCardSlabCount}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-secondary stroke-[3]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Shared on</p>
              <p className="text-base font-bold">{uploadedAt}</p>
            </div>
          </div>

          {(card.setName || card.language) && (
            <div className="flex items-center gap-4 flex-wrap">
              {card.setName && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-primary stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Set</p>
                    <p className="text-base font-bold">{card.setName}</p>
                  </div>
                </div>
              )}
              {card.language && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-4 h-4 text-secondary stroke-[3]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Language</p>
                    <p className="text-base font-bold">{getCardLanguageLabel(card.language) ?? card.language}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Community love
          </p>
          <CardLikeButton cardId={card.id} initialLikes={card.likes} />
        </div>

        <div className="pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
            Share this pull
          </p>
          <CopyLinkButtonClient />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-start animate-pulse">
      <div className="w-full max-w-md mx-auto">
        <SlabSkeleton variant="full" className="w-full" />
      </div>
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="h-12 w-3/4 bg-muted rounded-2xl" />
          <div className="h-4 w-1/2 bg-muted rounded-full" />
        </div>
        <div className="space-y-6 py-8 border-y border-border/40">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-muted" />
              <div className="space-y-2">
                <div className="h-2 w-16 bg-muted rounded-full" />
                <div className="h-4 w-32 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-14 w-40 bg-muted rounded-full" />
      </div>
    </div>
  );
}

export default async function CardPage({ params }: CardPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen text-foreground relative">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all group mb-12"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform stroke-[3]" />
          Back to gallery
        </Link>

        <Suspense fallback={<CardSkeleton />}>
          <CardContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}
