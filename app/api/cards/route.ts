import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") ?? "newest";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10), 50);

    const where = {
      ...(username ? { username } : {}),
      ...(search
        ? {
            OR: [
              { cardName: { contains: search } },
              { username: { contains: search } },
            ],
          }
        : {}),
    };

    const orderBy =
      sort === "top"
        ? { likes: "desc" as const }
        : sort === "oldest"
          ? { createdAt: "asc" as const }
          : { createdAt: "desc" as const };

    const cards = await prisma.bulkCard.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = cards.length > limit;
    const items = hasMore ? cards.slice(0, limit) : cards;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Enrich with same-card slab count and index (group by imageUrl = 100% equal card)
    const imageUrls = [...new Set(items.map((c) => c.imageUrl))];
    const sameCardRanks: Record<string, { count: number; indexById: Record<string, number> }> = {};
    await Promise.all(
      imageUrls.map(async (imageUrl) => {
        const byImage = await prisma.bulkCard.findMany({
          where: { imageUrl },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: { id: true },
        });
        const indexById: Record<string, number> = {};
        byImage.forEach((c, i) => {
          indexById[c.id] = i + 1;
        });
        sameCardRanks[imageUrl] = { count: byImage.length, indexById };
      })
    );

    const enrichedCards = items.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      sameCardSlabCount: sameCardRanks[c.imageUrl].count,
      sameCardSlabIndex: sameCardRanks[c.imageUrl].indexById[c.id],
    }));

    return NextResponse.json({ cards: enrichedCards, nextCursor });
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = (formData.get("username") as string | null)?.trim();
    const imageUrlParam = (formData.get("image_url") as string | null)?.trim();
    const pokewalletId = formData.get("pokewallet_id") as string | null;
    const cardName = formData.get("card_name") as string | null;
    const setName = formData.get("set_name") as string | null;
    const language = (formData.get("language") as string | null)?.trim() || undefined;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    let imageUrl: string;
    if (imageUrlParam) {
      imageUrl = imageUrlParam;
    } else if (pokewalletId) {
      imageUrl = `/api/pokewallet/image/${encodeURIComponent(pokewalletId)}?size=high`;
    } else {
      return NextResponse.json(
        { error: "A card must be selected from search (image_url or pokewallet_id required)" },
        { status: 400 }
      );
    }

    const card = await prisma.bulkCard.create({
      data: {
        imageUrl,
        username,
        cardName: cardName ?? undefined,
        setName: setName ?? undefined,
        language: language ?? undefined,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    console.error("POST /api/cards error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
