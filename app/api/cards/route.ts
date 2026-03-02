import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POKEWALLET_BASE, pokewalletHeaders } from "@/lib/pokewallet";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    const cards = await prisma.bulkCard.findMany({
      where: username ? { username } : undefined,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards);
  } catch (err) {
    console.error("GET /api/cards error:", err);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const username = (formData.get("username") as string | null)?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // --- Path A: PokéWallet card by ID ---
    const pokewalletId = formData.get("pokewallet_id") as string | null;
    const cardName = formData.get("card_name") as string | null;
    const setName = formData.get("set_name") as string | null;

    if (pokewalletId) {
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
    }

    // --- Path B: Direct file upload ---
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Either an image file or a pokewallet_id is required" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;

    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    const card = await prisma.bulkCard.create({
      data: {
        imageUrl: `/uploads/${filename}`,
        username,
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
