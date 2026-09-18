import { BRAIN_NOT_FOUND, templateAnswer, type BrainCitation } from "@/lib/brain-citations";

export type LlmProviderName = "openai" | "anthropic";

export type SynthesisResult = {
  answer: string;
  mode: "llm" | "template";
  llmProvider: LlmProviderName | null;
};

type ResolvedLlm = {
  name: LlmProviderName;
  apiKey: string;
  model: string;
};

const SYSTEM_PROMPT = [
  "You are a cite-only librarian for Holistic Consulting Institute recordings.",
  "Restate ONLY what the numbered transcript clips say.",
  "Every sentence must include at least one citation marker like [1] or [2].",
  "Do not give clinical advice, protocols, dosages, diagnoses, or outside knowledge.",
  "Write 2–5 short sentences.",
  `If the clips do not address the question, reply exactly: ${BRAIN_NOT_FOUND}`,
].join(" ");

export function resolveLlmProvider(): ResolvedLlm | null {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      name: "openai",
      apiKey: openai,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    };
  }
  const anthropic = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) {
    return {
      name: "anthropic",
      apiKey: anthropic,
      model: process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-haiku-20241022",
    };
  }
  return null;
}

function clipBlock(citations: BrainCitation[]): string {
  return citations
    .map((citation) => {
      const speaker = citation.speaker ? `Speaker: ${citation.speaker}\n` : "";
      return `[${citation.n}] Title: ${citation.title}\n${speaker}Start: ${citation.startSec}s\nText: ${citation.text}`;
    })
    .join("\n\n");
}

function hasCitationMarker(answer: string, citations: BrainCitation[]): boolean {
  return citations.some((citation) => answer.includes(`[${citation.n}]`));
}

async function completeOpenAI(provider: ResolvedLlm, user: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}`);
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function completeAnthropic(provider: ResolvedLlm, user: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    throw new Error(`Anthropic ${response.status}`);
  }
  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  return (
    payload.content
      ?.filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim() ?? ""
  );
}

export async function synthesizeAnswer(
  question: string,
  citations: BrainCitation[],
): Promise<SynthesisResult> {
  if (!citations.length) {
    return { answer: BRAIN_NOT_FOUND, mode: "template", llmProvider: null };
  }

  const fallback = templateAnswer(citations);
  const provider = resolveLlmProvider();
  if (!provider) {
    return { answer: fallback, mode: "template", llmProvider: null };
  }

  const user = `Question: ${question}\n\nClips:\n${clipBlock(citations)}`;

  try {
    const raw =
      provider.name === "openai"
        ? await completeOpenAI(provider, user)
        : await completeAnthropic(provider, user);
    const answer = raw.replace(/\s+$/u, "").trim();
    if (!answer || answer === BRAIN_NOT_FOUND || !hasCitationMarker(answer, citations)) {
      return { answer: fallback, mode: "template", llmProvider: provider.name };
    }
    return { answer, mode: "llm", llmProvider: provider.name };
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "brain_ask_llm_fallback",
        llmProvider: provider.name,
        reason: error instanceof Error ? error.message : "llm_error",
      }),
    );
    return { answer: fallback, mode: "template", llmProvider: provider.name };
  }
}
