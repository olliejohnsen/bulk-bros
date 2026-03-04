"use client";

import { useState, useEffect } from "react";
import { TrendingUp, CreditCard, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrainerStatsProps {
  cards: Array<{ id: string; imageUrl: string }>;
}

export function TrainerStats({ cards }: TrainerStatsProps) {
  const [stats, setStats] = useState<{ totalValue: number; avgValue: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPricing() {
      setLoading(true);
      try {
        const cardDetails = await Promise.all(
          cards.map(async (card) => {
            try {
              const match = card.imageUrl.match(/assets\.tcgdex\.net\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/);
              if (match) {
                const lang = match[1];
                const setId = match[3];
                const localId = match[4];
                const tcgdexId = `${setId}-${localId}`;
                
                const res = await fetch(`https://api.tcgdex.net/v2/${lang}/cards/${tcgdexId}`);
                if (res.ok) {
                  const data = await res.json();
                  let price = 0;
                  if (data.pricing?.tcgplayer) {
                    const p = data.pricing.tcgplayer;
                    const variant = p.normal || p.reverse || p["reverse-holofoil"] || p.holofoil;
                    price = variant?.marketPrice || variant?.midPrice || 0;
                  } 
                  if (price === 0 && data.pricing?.cardmarket) {
                    price = data.pricing.cardmarket.avg || data.pricing.cardmarket.low || 0;
                  }
                  return price;
                }
              }
            } catch (e) {
              console.error("Error fetching price", e);
            }
            return 0;
          })
        );

        const totalValue = cardDetails.reduce((sum, p) => sum + p, 0);
        const avgValue = cards.length > 0 ? totalValue / cards.length : 0;
        setStats({ totalValue, avgValue });
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, [cards]);

  const statItems = [
    { 
      label: "Total Bulk", 
      value: cards.length, 
      icon: CreditCard,
      suffix: " Cards"
    },
    { 
      label: "Total Value", 
      value: stats ? `$${stats.totalValue.toFixed(2)}` : "$0.00", 
      icon: TrendingUp,
      color: "text-secondary",
      loading: loading
    },
    { 
      label: "Avg Value", 
      value: stats ? `$${stats.avgValue.toFixed(2)}` : "$0.00", 
      icon: BarChart3,
      color: "text-primary",
      loading: loading
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 w-full lg:w-auto">
      {statItems.map((stat) => (
        <div key={stat.label} className="bg-background/50 backdrop-blur-sm border border-primary/10 rounded-3xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <stat.icon className={cn("w-5 h-5 opacity-50", stat.color || "text-foreground")} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            {stat.loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30" />
            ) : (
              <span className={cn("text-3xl font-black tabular-nums tracking-tighter", stat.color || "text-foreground")}>
                {stat.value}
              </span>
            )}
            {stat.suffix && !stat.loading && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {stat.suffix}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
