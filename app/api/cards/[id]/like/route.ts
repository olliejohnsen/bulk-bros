import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const card = await prisma.bulkCard.findUnique({ where: { id } });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const updated = await prisma.bulkCard.update({
    where: { id },
    data: { likes: { increment: 1 } },
  });

  return NextResponse.json(updated);
}
