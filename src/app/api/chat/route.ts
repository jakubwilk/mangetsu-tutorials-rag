import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { db } from "@/lib/db";
import { buildSystemPrompt } from "@/lib/prompts";
import { searchChunks } from "@/lib/search";

const openai = new OpenAI({
  apiKey: process.env.OVH_AI_API_KEY,
  baseURL: process.env.OVH_AI_ENDPOINT,
});

const DAILY_LIMIT = parseInt(process.env.DAILY_REQUEST_LIMIT ?? "20", 10);

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format żądania." }, { status: 400 });
  }

  const { message, sessionId } = body;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Pole 'message' jest wymagane." }, { status: 400 });
  }
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return NextResponse.json({ error: "Pole 'sessionId' jest wymagane." }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const now = new Date();
  const requestDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const rateLimit = await db.rateLimit.findUnique({
    where: { ip_requestDate: { ip, requestDate } },
  });

  if (rateLimit && rateLimit.count >= DAILY_LIMIT) {
    return NextResponse.json(
      { error: "Przekroczono dzienny limit zapytań. Spróbuj ponownie jutro." },
      { status: 429 }
    );
  }

  const chunks = await searchChunks(message.trim());
  const systemPrompt = buildSystemPrompt(chunks);

  let reply: string;
  let tokensUsed: number;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OVH_AI_MODEL ?? "Meta-Llama-3.1-70B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message.trim() },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    reply = completion.choices[0]?.message?.content ?? "";
    tokensUsed = completion.usage?.total_tokens ?? 0;
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Nieznany błąd";
    return NextResponse.json(
      { error: `Błąd połączenia z modelem AI: ${detail}` },
      { status: 500 }
    );
  }

  const existingConversation = await db.conversation.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
  });

  const conversationId =
    existingConversation?.id ??
    (await db.conversation.create({ data: { sessionId, ip } })).id;

  await db.message.createMany({
    data: [
      {
        conversationId,
        role: "user",
        content: message.trim(),
        tokensUsed: 0,
      },
      {
        conversationId,
        role: "assistant",
        content: reply,
        tokensUsed,
      },
    ],
  });

  const updatedRateLimit = await db.rateLimit.upsert({
    where: { ip_requestDate: { ip, requestDate } },
    create: { ip, requestDate, count: 1 },
    update: { count: { increment: 1 } },
  });

  return NextResponse.json({
    reply,
    tokensUsed,
    requestsUsed: updatedRateLimit.count,
  });
}
