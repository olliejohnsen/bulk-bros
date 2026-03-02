import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const LANG = "en";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = (typeof body.username === "string" ? body.username : "").trim();
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    const cardName = typeof body.cardName === "string" ? body.cardName.trim() : undefined;
    const setName = typeof body.setName === "string" ? body.setName.trim() : undefined;

    if (!username) {
      return NextResponse.json(
        { error: "Trainer name is required" },
        { status: 400 }
      );
    }
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Card image URL is required" },
        { status: 400 }
      );
    }

    const created = await prisma.bulkCard.create({
      data: {
        imageUrl,
        username,
        cardName: cardName ?? undefined,
        setName: setName ?? undefined,
        language: LANG,
      },
    });

    return NextResponse.json({
      id: created.id,
      name: created.cardName ?? cardName,
      imageUrl: created.imageUrl,
      setName: created.setName ?? setName,
    });
  } catch (err) {
    console.error("Bingo add error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to add card" },
      { status: 500 }
    );
  }
}
