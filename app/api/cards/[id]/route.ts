import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const card = await prisma.bulkCard.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

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

    return NextResponse.json({
      ...card,
      sameCardSlabCount,
      sameCardSlabIndex,
    });
  } catch (err) {
    console.error("GET /api/cards/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
