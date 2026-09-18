"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { BrainAskResult } from "@/lib/brain-types";
import { formatTimestamp } from "@/lib/format";

const SAMPLES = [
  "What has Betsy said about herbal safety?",
  "Gut bacteria overgrowth in the small bowel",
  "Principles of plant safety",
];

export function BrainAskForm() {
  const [question, setQuestion] = useState(SAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrainAskResult | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();
    if (!nextQuestion) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/brain/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: nextQuestion }),
      });
      const payload = (await response.json()) as BrainAskResult & { error?: string };
      if (!response.ok) {
        setResult(null);
        setError(payload.error || "Ask failed.");
        return;
      }
      setResult(payload);
    } catch {
      setResult(null);
      setError("Ask failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onSubmit} className="relative bg-white px-6 py-8 md:px-10 md:py-10">
        <span className="pathway-num absolute top-4 right-6" aria-hidden>
          Q
        </span>
        <label className="section-label" htmlFor="brain-question">
          Ask the library
        </label>
        <textarea
          id="brain-question"
          name="question"
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          placeholder="What has Betsy said about herbal safety?"
          className="field min-h-[6.5rem] resize-y"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Searching…" : "Ask with citations"}
          </button>
          <Link href="/library" className="btn-outline">
            Back to search
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {SAMPLES.map((sample) => (
            <button
              key={sample}
              type="button"
              className="browse-chip"
              onClick={() => setQuestion(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
      </form>

      {error ? (
        <p className="bg-white px-6 py-4 text-sm text-slate" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="space-y-6 bg-white px-6 py-8 md:px-10" aria-live="polite">
          <div>
            <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-gold uppercase">
              {result.found ? "Cited answer" : "No match"}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-base leading-8 text-charcoal">{result.answer}</p>
          </div>

          {result.citations.length > 0 ? (
            <ol className="space-y-4">
              {result.citations.map((citation) => (
                <li key={`${citation.videoId}-${citation.startSec}`} className="bg-sage px-5 py-4">
                  <p className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold uppercase">
                    [{citation.n}] {formatTimestamp(citation.startSec * 1000)}
                    {citation.speaker ? ` · ${citation.speaker}` : ""}
                  </p>
                  <p className="mt-1 font-display text-2xl leading-snug text-charcoal">{citation.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate">“{citation.text}”</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] font-semibold tracking-[0.06em] uppercase">
                    <Link href={citation.libraryUrl} className="text-gold hover:text-gold-lt">
                      Open in library
                    </Link>
                    <a
                      href={citation.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald hover:underline"
                    >
                      Watch on YouTube ↗
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          <p className="border-t border-line pt-4 text-xs leading-6 text-slate">{result.disclaimer}</p>
        </section>
      ) : null}
    </div>
  );
}
