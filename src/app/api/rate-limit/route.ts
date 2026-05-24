import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const now = new Date();
  const requestDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const rateLimit = await db.rateLimit.findUnique({
    where: { ip_requestDate: { ip, requestDate } },
  });

  return NextResponse.json({ requestsUsed: rateLimit?.count ?? 0 });
}
