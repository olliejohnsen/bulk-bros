import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.bulkCard.count();
    if (count === 0) {
      return NextResponse.json({ error: "No cards found" }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    const randomCard = await prisma.bulkCard.findFirst({
      skip: skip,
      select: { id: true },
    });

    if (!randomCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ id: randomCard.id });
  } catch (err) {
    console.error("GET /api/cards/random error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
