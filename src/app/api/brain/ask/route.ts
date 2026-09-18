import { NextResponse } from "next/server";
import { askBrain, normalizeQuestion } from "@/lib/brain-ask";
import { BRAIN_DISCLAIMER } from "@/lib/brain-citations";

export const dynamic = "force-dynamic";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow" };

/**
 * Internal CoS Brain Q&A. Cited clips only — no unsourced synthesis.
 * Retrieval is the same hybrid path as GET /api/library/search.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = normalizeQuestion(body?.question);
  if (!question) {
    return NextResponse.json(
      {
        error: "Send JSON { question: string } (1–500 characters).",
        disclaimer: BRAIN_DISCLAIMER,
      },
      { status: 400, headers: NOINDEX },
    );
  }

  const result = await askBrain(question);
  return NextResponse.json(result, { headers: NOINDEX });
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST { question: string }.",
      example: {
        question: "What has Betsy said about herbal safety?",
      },
      disclaimer: BRAIN_DISCLAIMER,
    },
    { status: 405, headers: { ...NOINDEX, Allow: "POST" } },
  );
}
