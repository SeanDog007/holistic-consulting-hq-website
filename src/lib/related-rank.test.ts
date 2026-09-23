import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  earlyTranscriptText,
  rankRelatedRecordings,
  relatedRetrieveQuery,
  type RelatedCandidate,
} from "./related-rank.ts";

function video(partial: Partial<RelatedCandidate> & Pick<RelatedCandidate, "id">): RelatedCandidate {
  return {
    youtubeId: partial.youtubeId ?? partial.id,
    title: partial.title ?? partial.id,
    displayTitle: partial.displayTitle ?? null,
    publishedAt: partial.publishedAt ?? new Date("2024-01-01T00:00:00.000Z"),
    durationSec: partial.durationSec ?? 60,
    thumbnailUrl: partial.thumbnailUrl ?? "",
    programs: partial.programs ?? [],
    topics: partial.topics ?? [],
    ...partial,
  };
}

const source = {
  id: "current",
  youtubeId: "yt-current",
  programs: ["Mentorship"],
  topics: ["microbiome"],
};

describe("rankRelatedRecordings", () => {
  it("prefers a shared program over a higher semantic score", () => {
    const programMatch = video({
      id: "program",
      youtubeId: "yt-program",
      programs: ["Mentorship"],
      publishedAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const semantic = video({
      id: "semantic",
      youtubeId: "yt-semantic",
      programs: ["Herbalism"],
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(source, [semantic, programMatch], new Map([["yt-semantic", 0.99]]));
    assert.equal(ranked[0]?.id, "program");
  });

  it("prefers more shared programs, then more shared topics", () => {
    const dual = video({
      id: "dual",
      programs: ["Mentorship", "Business"],
      topics: ["microbiome"],
      publishedAt: new Date("2020-06-01T00:00:00.000Z"),
    });
    const oneProgramTwoTopics = video({
      id: "topics",
      programs: ["Mentorship"],
      topics: ["microbiome", "digestive health"],
      publishedAt: new Date("2026-06-01T00:00:00.000Z"),
    });
    const oneProgram = video({
      id: "plain",
      programs: ["Mentorship"],
      topics: [],
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(
      { ...source, programs: ["Mentorship", "Business"], topics: ["microbiome", "digestive health"] },
      [oneProgram, oneProgramTwoTopics, dual],
    );
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["dual", "topics", "plain"],
    );
  });

  it("fills remaining slots from embedding scores without passing program or topic matches", () => {
    const program = video({ id: "program", programs: ["Mentorship"], topics: [] });
    const topic = video({
      id: "topic",
      programs: ["Herbalism"],
      topics: ["microbiome"],
      publishedAt: new Date("2019-01-01T00:00:00.000Z"),
    });
    const strong = video({ id: "strong", programs: ["Business"], youtubeId: "yt-strong" });
    const weak = video({
      id: "weak",
      programs: ["Business"],
      youtubeId: "yt-weak",
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(
      source,
      [weak, strong, topic, program],
      new Map([
        ["yt-strong", 0.8],
        ["yt-weak", 0.4],
        ["yt-not-in-catalog", 0.99],
      ]),
    );
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["program", "topic", "strong"],
    );
  });

  it("does not treat Community or Office Hours as shared curriculum", () => {
    const community = video({
      id: "community",
      programs: ["Community"],
      topics: [],
    });
    const officeHours = video({
      id: "office",
      programs: ["Office Hours"],
      topics: ["microbiome"],
    });
    const ranked = rankRelatedRecordings(
      { id: "current", youtubeId: "yt-current", programs: ["Community", "Office Hours"], topics: [] },
      [community, officeHours],
    );
    assert.equal(ranked.length, 0);
  });

  it("does not treat Other as a shared program", () => {
    const other = video({
      id: "other",
      programs: ["Other"],
      publishedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(
      { id: "current", youtubeId: "yt-current", programs: ["Other"], topics: [] },
      [other],
      new Map([["other", 0.42]]),
    );
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["other"],
    );

    const withoutScore = rankRelatedRecordings(
      { id: "current", youtubeId: "yt-current", programs: ["Other"], topics: [] },
      [other],
    );
    assert.equal(withoutScore.length, 0);
  });

  it("breaks ties by publishedAt descending, then id ascending", () => {
    const older = video({
      id: "b",
      programs: ["Mentorship"],
      publishedAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    const newerB = video({
      id: "b-newer",
      programs: ["Mentorship"],
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const newerA = video({
      id: "a-newer",
      programs: ["Mentorship"],
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(source, [older, newerB, newerA]);
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["a-newer", "b-newer", "b"],
    );
  });

  it("treats near-equal semantic scores as a tie", () => {
    const older = video({
      id: "older",
      youtubeId: "yt-older",
      programs: [],
      publishedAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const newer = video({
      id: "newer",
      youtubeId: "yt-newer",
      programs: [],
      publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    });
    const ranked = rankRelatedRecordings(
      { id: "current", youtubeId: "yt-current", programs: [], topics: [] },
      [older, newer],
      new Map([
        ["yt-older", 0.5],
        ["yt-newer", 0.5004],
      ]),
    );
    assert.equal(ranked[0]?.id, "newer");
  });

  it("drops the current video and stops at three", () => {
    const candidates = ["a", "b", "c", "d", "current"].map((id, index) =>
      video({
        id,
        youtubeId: id === "current" ? "yt-current" : `yt-${id}`,
        programs: ["Mentorship"],
        publishedAt: new Date(Date.UTC(2024, 0, index + 1)),
      }),
    );
    const ranked = rankRelatedRecordings(source, candidates);
    assert.equal(ranked.length, 3);
    assert.equal(
      ranked.some((item) => item.id === "current" || item.youtubeId === "yt-current"),
      false,
    );
  });

  it("returns fewer than three when the catalog cannot fill the row", () => {
    const ranked = rankRelatedRecordings(source, [
      video({ id: "only", programs: ["Mentorship"] }),
    ]);
    assert.deepEqual(
      ranked.map((item) => item.id),
      ["only"],
    );
  });

  it("matches program and topic labels case-insensitively", () => {
    const ranked = rankRelatedRecordings(source, [
      video({ id: "case", programs: ["mentorship"], topics: ["Microbiome"] }),
    ]);
    assert.equal(ranked[0]?.id, "case");
  });
});

describe("related retrieve query", () => {
  it("uses title and description when a description exists", () => {
    const query = relatedRetrieveQuery({
      title: "Raw title",
      displayTitle: "Display title",
      description: "A clinical description",
      earlyTranscript: "should not be included",
    });
    assert.match(query, /Display title/);
    assert.match(query, /Raw title/);
    assert.match(query, /A clinical description/);
    assert.equal(query.includes("should not be included"), false);
  });

  it("uses the opening transcript when description is empty", () => {
    const early = earlyTranscriptText(
      [
        { startMs: 5000, text: "later line" },
        { startMs: 0, text: "opening line" },
      ],
      800,
    );
    assert.equal(early.startsWith("opening line"), true);
    const query = relatedRetrieveQuery({
      title: "SIBO lecture",
      displayTitle: null,
      description: "  ",
      earlyTranscript: early,
    });
    assert.match(query, /SIBO lecture/);
    assert.match(query, /opening line/);
  });
});
