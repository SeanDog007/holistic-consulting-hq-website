import { BRAIN_NOT_FOUND, pickCitations, templateAnswer, type BrainCitation } from "../src/lib/brain-citations";
import { askBrain, normalizeQuestion } from "../src/lib/brain-ask";
import type { LibraryResult } from "../src/lib/search";

function video(partial: {
  id: string;
  youtubeId: string;
  title: string;
  speakers?: string[];
  score: number;
  hits: LibraryResult["hits"];
}): LibraryResult {
  return {
    id: partial.id,
    youtubeId: partial.youtubeId,
    title: partial.title,
    displayTitle: null,
    description: "",
    publishedAt: new Date("2024-01-01"),
    durationSec: 3600,
    thumbnailUrl: "",
    speakers: partial.speakers ?? [],
    programs: [],
    topics: [],
    hits: partial.hits,
    score: partial.score,
  };
}

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

function unitTests(): number {
  let failed = 0;
  const run = (label: string, fn: () => void) => {
    try {
      fn();
      console.log(`PASS  unit: ${label}`);
    } catch (error) {
      failed += 1;
      console.log(`FAIL  unit: ${label}\n       ${error instanceof Error ? error.message : error}`);
    }
  };

  run("refuse empty / oversized questions", () => {
    assert(normalizeQuestion("") === null, "empty should be null");
    assert(normalizeQuestion("   ") === null, "whitespace should be null");
    assert(normalizeQuestion("x".repeat(501)) === null, "oversize should be null");
    assert(normalizeQuestion("What has Betsy said about herbal safety?") === "What has Betsy said about herbal safety?", "trim keep");
  });

  run("diversify ≤2 hits/video and cap at 4", () => {
    const results = [
      video({
        id: "a",
        youtubeId: "vidA",
        title: "Talk A",
        speakers: ["Betsy Miller"],
        score: 0.9,
        hits: [
          { startMs: 1000, endMs: 2000, text: "safety one", source: "keyword" },
          { startMs: 3000, endMs: 4000, text: "safety two", source: "keyword" },
          { startMs: 5000, endMs: 6000, text: "safety three", source: "keyword" },
        ],
      }),
      video({
        id: "b",
        youtubeId: "vidB",
        title: "Talk B",
        score: 0.8,
        hits: [
          { startMs: 1000, endMs: 2000, text: "clip b1", source: "semantic" },
          { startMs: 3000, endMs: 4000, text: "clip b2", source: "semantic" },
        ],
      }),
      video({
        id: "c",
        youtubeId: "vidC",
        title: "Talk C",
        score: 0.7,
        hits: [{ startMs: 8000, endMs: 9000, text: "clip c", source: "both" }],
      }),
    ];
    const citations = pickCitations(results, "herbal safety clip");
    assert(citations.length === 4, `expected 4 citations, got ${citations.length}`);
    const perVideo = new Map<string, number>();
    for (const citation of citations) {
      perVideo.set(citation.videoId, (perVideo.get(citation.videoId) ?? 0) + 1);
      assert(citation.libraryUrl.includes("?t="), "libraryUrl needs ?t=");
      assert(citation.youtubeUrl.includes("&t="), "youtubeUrl needs &t=");
    }
    assert([...perVideo.values()].every((count) => count <= 2), "more than 2 hits/video");
    assert(citations[0]?.speaker === "Betsy Miller", "optional speaker missing");
    assert(citations.every((citation, index) => citation.n === index + 1), "citation numbers");
  });

  run("low-confidence or ungrounded semantic-only → refuse", () => {
    const weak = pickCitations(
      [
        video({
          id: "weak",
          youtubeId: "weak1",
          title: "Unrelated",
          score: 0.12,
          hits: [{ startMs: 1000, endMs: 2000, text: "hello there", source: "semantic" }],
        }),
      ],
      "herbal safety",
    );
    assert(weak.length === 0, `expected weak refuse, got ${weak.length}`);
    const ungrounded = pickCitations(
      [
        video({
          id: "hash",
          youtubeId: "hash1",
          title: "Mastermind dump",
          score: 0.55,
          hits: [{ startMs: 1000, endMs: 2000, text: "thanks everyone for coming tonight", source: "semantic" }],
        }),
      ],
      "zzzxqwt vbnm plkjhgfds",
    );
    assert(ungrounded.length === 0, `expected ungrounded refuse, got ${ungrounded.length}`);
  });

  run("template summary cites excerpts only", () => {
    const citations: BrainCitation[] = [
      {
        n: 1,
        videoId: "v1",
        youtubeId: "abc",
        title: "Herbal Safety",
        speaker: "Betsy Miller",
        startSec: 2280,
        endSec: 2320,
        text: "We talk about herb-drug interactions in this window.",
        source: "keyword",
        libraryUrl: "/library/v1?t=2280",
        youtubeUrl: "https://www.youtube.com/watch?v=abc&t=2280s",
        score: 0.9,
      },
    ];
    const answer = templateAnswer(citations);
    assert(answer.includes("[1]"), "template must force [1]");
    assert(answer.includes("herb-drug interactions"), "template must use clip text");
    assert(answer.includes("not clinical advice"), "template must keep the guardrail");
    assert(templateAnswer([]) === BRAIN_NOT_FOUND, "empty template should refuse");
  });

  return failed;
}

async function integrationTests(): Promise<number> {
  let failed = 0;
  const cases: Array<{
    question: string;
    expectFound: boolean;
    expectYoutubeId?: string | string[];
    startSecMin?: number;
    startSecMax?: number;
  }> = [
    {
      question: "What has Betsy said about herbal safety?",
      expectFound: true,
      expectYoutubeId: "mowBWYHvJwg",
      startSecMin: 2280,
      startSecMax: 2600,
    },
    {
      question: "gut bacteria overgrowth in the small bowel",
      expectFound: true,
      expectYoutubeId: ["tkINS6S4FDs", "9n9oLpV3uag"],
    },
    {
      question: "zzzxqwt vbnm plkjhgfds 99999",
      expectFound: false,
    },
  ];

  for (const test of cases) {
    const result = await askBrain(test.question);
    const expectedIds = test.expectYoutubeId
      ? Array.isArray(test.expectYoutubeId)
        ? test.expectYoutubeId
        : [test.expectYoutubeId]
      : [];
    const match = expectedIds.length
      ? result.citations.find((citation) => {
          if (!expectedIds.includes(citation.youtubeId)) return false;
          if (test.startSecMin != null && citation.startSec < test.startSecMin) return false;
          if (test.startSecMax != null && citation.startSec > test.startSecMax) return false;
          return true;
        })
      : undefined;
    const perVideo = new Map<string, number>();
    let diversityOk = true;
    for (const citation of result.citations) {
      const used = (perVideo.get(citation.videoId) ?? 0) + 1;
      perVideo.set(citation.videoId, used);
      if (used > 2) diversityOk = false;
    }
    const foundOk = result.found === test.expectFound;
    const citeOk = test.expectFound ? Boolean(match) : result.citations.length === 0;
    const answerOk = test.expectFound
      ? result.answer.includes("[1]") && result.answer !== BRAIN_NOT_FOUND
      : result.answer === BRAIN_NOT_FOUND;
    const countOk = !test.expectFound || (result.citations.length >= 1 && result.citations.length <= 4);
    const ok = foundOk && citeOk && answerOk && countOk && diversityOk && result.disclaimer.includes("Not clinical advice");
    if (!ok) failed += 1;
    console.log(
      `${ok ? "PASS" : "FAIL"}  ask: ${test.question}\n` +
        `       found=${result.found} synthesis=${result.synthesis} cites=${result.citations.length}` +
        `${match ? ` hit=${match.youtubeId} t=${match.startSec}` : ""}` +
        `${diversityOk ? "" : " diversity>2"}`,
    );
  }

  return failed;
}

async function main() {
  const unitFailed = unitTests();
  const integrationFailed = await integrationTests();
  const failed = unitFailed + integrationFailed;
  if (failed) {
    console.error(`\n${failed} Brain Q&A check(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll Brain Q&A checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
