export type BrainClipSource = "keyword" | "semantic" | "both";

export type BrainCitation = {
  n: number;
  videoId: string;
  youtubeId: string;
  title: string;
  speaker: string | null;
  startSec: number;
  endSec: number | null;
  text: string;
  source: BrainClipSource;
  libraryUrl: string;
  youtubeUrl: string;
  score: number;
};

export type BrainAskResult = {
  question: string;
  found: boolean;
  answer: string;
  citations: BrainCitation[];
  disclaimer: string;
  synthesis: "llm" | "template" | "refused";
  llmProvider: "openai" | "anthropic" | null;
  retrieval: {
    provider: string | null;
    semanticUsed: boolean;
  };
};
