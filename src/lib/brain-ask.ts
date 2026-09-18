import { BRAIN_DISCLAIMER, BRAIN_NOT_FOUND, pickCitations, type BrainCitation } from "@/lib/brain-citations";
import type { BrainAskResult } from "@/lib/brain-types";
import { synthesizeAnswer, type LlmProviderName } from "@/lib/brain-synthesize";
import { searchLibrary } from "@/lib/search";
import { loadVectorIndex } from "@/lib/vector-index";

export type { BrainAskResult } from "@/lib/brain-types";

export const MAX_QUESTION_LENGTH = 500;

export function normalizeQuestion(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const question = value.replace(/\s+/g, " ").trim();
  if (!question || question.length > MAX_QUESTION_LENGTH) return null;
  return question;
}

function logAsk(payload: {
  question: string;
  found: boolean;
  synthesis: BrainAskResult["synthesis"];
  llmProvider: LlmProviderName | null;
  semanticUsed: boolean;
  citations: BrainCitation[];
}): void {
  console.info(
    JSON.stringify({
      event: "brain_ask",
      question: payload.question,
      found: payload.found,
      synthesis: payload.synthesis,
      llmProvider: payload.llmProvider,
      semanticUsed: payload.semanticUsed,
      citationCount: payload.citations.length,
      citations: payload.citations.map((citation) => ({
        n: citation.n,
        youtubeId: citation.youtubeId,
        startSec: citation.startSec,
        source: citation.source,
        score: citation.score,
      })),
    }),
  );
}

/**
 * Cite-only Q&A over the live hybrid library search.
 * Better embeddings improve this automatically because retrieval is `searchLibrary`.
 */
export async function askBrain(question: string): Promise<BrainAskResult> {
  const page = await searchLibrary({ q: question });
  const citations = pickCitations(page.results, question);
  const index = loadVectorIndex();
  const retrieval = {
    provider: index?.provider ?? null,
    semanticUsed: page.semanticUsed,
  };

  if (!citations.length) {
    logAsk({
      question,
      found: false,
      synthesis: "refused",
      llmProvider: null,
      semanticUsed: page.semanticUsed,
      citations,
    });
    return {
      question,
      found: false,
      answer: BRAIN_NOT_FOUND,
      citations: [],
      disclaimer: BRAIN_DISCLAIMER,
      synthesis: "refused",
      llmProvider: null,
      retrieval,
    };
  }

  const synthesized = await synthesizeAnswer(question, citations);
  const result: BrainAskResult = {
    question,
    found: true,
    answer: synthesized.answer,
    citations,
    disclaimer: BRAIN_DISCLAIMER,
    synthesis: synthesized.mode,
    llmProvider: synthesized.llmProvider,
    retrieval,
  };
  logAsk({
    question,
    found: true,
    synthesis: result.synthesis,
    llmProvider: result.llmProvider,
    semanticUsed: page.semanticUsed,
    citations,
  });
  return result;
}
