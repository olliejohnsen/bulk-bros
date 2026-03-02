"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CardItem } from "@/components/CardItem";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkCard {
  id: string;
  imageUrl: string;
  username: string;
  likes: number;
  createdAt: string;
  cardName?: string | null;
  setName?: string | null;
}

interface CardGridProps {
  cards: BulkCard[];
}

export function CardGrid({ cards }: CardGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUsernameClick = (username: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("username", username);
    router.push(`/?${params.toString()}`);
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>
          <div
            className="absolute -inset-2 rounded-3xl bg-primary/5"
            style={{ animation: "pulse-ring 2s ease-out infinite" }}
          />
        </div>
        <div className="text-center space-y-1">
          <p className="text-xl font-bold">No cards here yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Be the first trainer to share your bulk collection with the community!
          </p>
        </div>
        <Button asChild className="shimmer-btn relative overflow-hidden">
          <Link href="/upload">Share your bulk</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <CardItem
          key={card.id}
          card={card}
          index={i}
          onUsernameClick={handleUsernameClick}
        />
      ))}
    </div>
  );
}
