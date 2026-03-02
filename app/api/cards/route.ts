import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";
import path from "path";
import fs from "fs";

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
    const pokewalletId = formData.get("pokewallet_id") as string | null;
    const cardName = formData.get("card_name") as string | null;
    const setName = formData.get("set_name") as string | null;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    if (!pokewalletId) {
      return NextResponse.json(
        { error: "A card must be selected from search (pokewallet_id is required)" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let imageBuffer: Buffer;
    try {
      const headers = pokewalletHeaders();
      const imgRes = await fetch(
        `${POKEWALLET_BASE}/images/${encodeURIComponent(pokewalletId)}?size=high`,
        { headers }
      );
      
      if (!imgRes.ok) {
        const errorText = await imgRes.text();
        console.error("PokéWallet image fetch failed:", imgRes.status, errorText);
        return NextResponse.json(
          { error: `Failed to fetch card image from PokéWallet (Status: ${imgRes.status})` },
          { status: 502 }
        );
      }
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } catch (err) {
      console.error("PokéWallet fetch error:", err);
      return NextResponse.json(
        { error: "Failed to reach PokéWallet API for image" },
        { status: 502 }
      );
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    fs.writeFileSync(path.join(uploadsDir, filename), imageBuffer);

    const card = await prisma.bulkCard.create({
      data: {
        imageUrl: `/uploads/${filename}`,
        username,
        cardName: cardName ?? undefined,
        setName: setName ?? undefined,
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
