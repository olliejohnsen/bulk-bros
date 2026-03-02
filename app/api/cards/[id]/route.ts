import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdmin = await requireAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const card = await prisma.bulkCard.findUnique({ where: { id } });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.bulkCard.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/cards/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
