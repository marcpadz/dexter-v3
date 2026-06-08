import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: { id: true, title: true, pinned: true, updatedAt: true, model: true },
  });

  return NextResponse.json(conversations);
}
