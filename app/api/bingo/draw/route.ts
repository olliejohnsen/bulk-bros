import { NextRequest, NextResponse } from "next/server";
import { fetchRandomTcgdexCard } from "@/lib/tcgdex";

const LANG = "en";
const MAX_RETRIES = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = (typeof body.username === "string" ? body.username : "").trim();
    if (!username) {
      return NextResponse.json(
        { error: "Trainer name is required" },
        { status: 400 }
      );
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const details = await fetchRandomTcgdexCard(LANG);
        if (!details) continue;

        return NextResponse.json({
          id: details.id,
          name: details.name,
          imageUrl: details.imageUrl,
          setName: details.set_name ?? null,
          localId: details.localId ?? null,
          setTotal: details.set_total ?? null,
        });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    console.error("Bingo draw failed after retries:", lastError);
    return NextResponse.json(
      { error: "Could not draw a bulk card. Try again." },
      { status: 502 }
    );
  } catch (err) {
    console.error("Bingo draw error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
