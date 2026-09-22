/**
 * Related Content ranking for a library watch page.
 *
 * Deterministic cascade (not a blended score). Take at most `limit` rows:
 *
 * 1. Same program. Intersection of `Video.programs` labels, ignoring the
 *    classifier fallback `"Other"` (it means unclassified, not a shared
 *    curriculum). More shared programs rank above fewer.
 * 2. Overlapping topics, only after program matches are exhausted. More
 *    shared topics rank above fewer. Topic overlap also orders rows inside
 *    the program band.
 * 3. Remaining slots only: Brain embedding similarity (`searchVectorIndex`,
 *    the retrieve step behind hybrid library search) for this video’s
 *    title + description, or the opening transcript when description is
 *    empty. Scores come from catalog `youtubeId`s already on the candidate
 *    list. A score never promotes a video over a program or topic match,
 *    and a YouTube id that is not already a library row cannot appear.
 * 4. Never the current video (`id` or `youtubeId`).
 * 5. Tie-break: `publishedAt` descending, then `id` ascending
 *    (`localeCompare`). Semantic scores within 0.001 count as a tie.
 *
 * If fewer than `limit` candidates survive, return what exists.
 */

export const RELATED_LIMIT = 3;

/** Unclassified bucket written by `programsForBrainVideo` / `classifyPrograms`. */
export const GENERIC_PROGRAM = "Other";

const SEMANTIC_TIE_EPSILON = 0.001;

export type RelatedCandidate = {
  id: string;
  youtubeId: string;
  title: string;
  displayTitle: string | null;
  publishedAt: Date;
  durationSec: number;
  thumbnailUrl: string;
  programs: string[];
  topics: string[];
};

export type RelatedSource = {
  id: string;
  youtubeId: string;
  programs: string[];
  topics: string[];
};

function labelSet(values: readonly string[], dropGenericProgram: boolean): Set<string> {
  const set = new Set<string>();
  for (const value of values) {
    const label = value.trim().toLowerCase();
    if (!label) continue;
    if (dropGenericProgram && label === GENERIC_PROGRAM.toLowerCase()) continue;
    set.add(label);
  }
  return set;
}

function overlap(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const item of left) {
    if (right.has(item)) count += 1;
  }
  return count;
}

function publishedMs(value: Date): number {
  const ms = value.getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function byRecencyThenId(left: { publishedAt: Date; id: string }, right: { publishedAt: Date; id: string }): number {
  const time = publishedMs(right.publishedAt) - publishedMs(left.publishedAt);
  if (time !== 0) return time;
  return left.id.localeCompare(right.id);
}

type Scored<T> = {
  candidate: T;
  sharedPrograms: number;
  sharedTopics: number;
  semanticScore: number;
};

export function rankRelatedRecordings<T extends RelatedCandidate>(
  source: RelatedSource,
  candidates: readonly T[],
  semanticScores: ReadonlyMap<string, number> = new Map(),
  limit = RELATED_LIMIT,
): T[] {
  const sourcePrograms = labelSet(source.programs, true);
  const sourceTopics = labelSet(source.topics, false);
  const scored: Array<Scored<T>> = [];

  for (const candidate of candidates) {
    if (!candidate.id || candidate.id === source.id) continue;
    if (candidate.youtubeId && source.youtubeId && candidate.youtubeId === source.youtubeId) continue;

    const rawScore = semanticScores.get(candidate.youtubeId);
    const semanticScore = typeof rawScore === "number" && Number.isFinite(rawScore) && rawScore > 0 ? rawScore : 0;

    scored.push({
      candidate,
      sharedPrograms: overlap(sourcePrograms, labelSet(candidate.programs, true)),
      sharedTopics: overlap(sourceTopics, labelSet(candidate.topics, false)),
      semanticScore,
    });
  }

  const sameProgram = scored.filter((item) => item.sharedPrograms > 0);
  const topicOnly = scored.filter((item) => item.sharedPrograms === 0 && item.sharedTopics > 0);
  const semanticOnly = scored.filter(
    (item) => item.sharedPrograms === 0 && item.sharedTopics === 0 && item.semanticScore > 0,
  );

  sameProgram.sort((left, right) => {
    if (right.sharedPrograms !== left.sharedPrograms) return right.sharedPrograms - left.sharedPrograms;
    if (right.sharedTopics !== left.sharedTopics) return right.sharedTopics - left.sharedTopics;
    return byRecencyThenId(left.candidate, right.candidate);
  });

  topicOnly.sort((left, right) => {
    if (right.sharedTopics !== left.sharedTopics) return right.sharedTopics - left.sharedTopics;
    return byRecencyThenId(left.candidate, right.candidate);
  });

  semanticOnly.sort((left, right) => {
    const delta = right.semanticScore - left.semanticScore;
    if (Math.abs(delta) > SEMANTIC_TIE_EPSILON) return delta;
    return byRecencyThenId(left.candidate, right.candidate);
  });

  const cap = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
  return [...sameProgram, ...topicOnly, ...semanticOnly].slice(0, cap).map((item) => item.candidate);
}

export const EARLY_TRANSCRIPT_CHARS = 800;
export const RELATED_QUERY_CHARS = 1200;

/** Opening transcript, in time order, capped so the retrieve query stays a title-sized passage. */
export function earlyTranscriptText(
  segments: ReadonlyArray<{ startMs: number; text: string }>,
  maxChars = EARLY_TRANSCRIPT_CHARS,
): string {
  const ordered = [...segments].sort(
    (left, right) => left.startMs - right.startMs || left.text.localeCompare(right.text),
  );
  let text = "";
  for (const segment of ordered) {
    const piece = segment.text.replace(/\s+/g, " ").trim();
    if (!piece) continue;
    const next = text ? `${text} ${piece}` : piece;
    if (next.length >= maxChars) return next.slice(0, maxChars).trim();
    text = next;
  }
  return text;
}

/**
 * Query text for embedding retrieve.
 * Title (display title, plus the raw title when it differs) and description.
 * When description is empty — the Brain catalog case — the opening transcript is used instead.
 */
export function relatedRetrieveQuery(input: {
  title: string;
  displayTitle?: string | null;
  description?: string | null;
  earlyTranscript?: string | null;
}): string {
  const curated = input.displayTitle?.trim() ?? "";
  const raw = input.title.trim();
  const description = input.description?.trim() ?? "";
  const parts: string[] = [];
  if (curated) parts.push(curated);
  if (raw && raw !== curated) parts.push(raw);
  if (!parts.length && raw) parts.push(raw);
  if (description) parts.push(description);
  else if (input.earlyTranscript?.trim()) parts.push(input.earlyTranscript.trim());
  return parts.join("\n").slice(0, RELATED_QUERY_CHARS);
}
