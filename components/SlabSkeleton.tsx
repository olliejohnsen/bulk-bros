"use client";

import { cn } from "@/lib/utils";

interface SlabSkeletonProps {
  variant?: "gallery" | "full";
  className?: string;
}

export function SlabSkeleton({ variant = "full", className }: SlabSkeletonProps) {
  const isGallery = variant === "gallery";
  const radiusClass = isGallery ? "rounded-[1.2rem]" : "rounded-[2rem]";

  return (
    <div
      className={cn(
        "relative overflow-hidden animate-pulse border border-border/40 bg-muted/30",
        radiusClass,
        className
      )}
    >
      <div
        className={cn(
          "relative",
          radiusClass,
          isGallery ? "p-2 pb-4" : "p-5 pb-10"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "bg-muted rounded-xl",
            isGallery ? "h-14 mb-2.5" : "h-20 mb-6"
          )}
        />
        {/* Card tray */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl bg-muted/80",
            isGallery ? "aspect-[3/4]" : "aspect-[3/4]"
          )}
        />
        {/* Seal (full only) */}
        {!isGallery && (
          <div className="mt-8 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-muted/60" />
          </div>
        )}
      </div>
    </div>
  );
}
