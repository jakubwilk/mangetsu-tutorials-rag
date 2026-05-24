import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? []).slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ valid: [] });
  }

  const conversations = await db.conversation.findMany({
    where: { sessionId: { in: ids } },
    select: { sessionId: true },
  });

  const valid = [...new Set(conversations.map((c) => c.sessionId))];

  return NextResponse.json({ valid });
}
