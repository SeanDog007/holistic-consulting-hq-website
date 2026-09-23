import type { Program } from "./programs";
import { programsFor, recordingTypeFor } from "./taxonomy";

const KNOWN_SPEAKERS = [
  "Sean Emery",
  "Dr. David Feuz",
  "David Feuz",
  "Betsy Miller",
  "Dr. Rachel Knowles",
  "Rachel Knowles",
  "Laura Waldo",
  "Dr. Oscar Coetzee",
  "Oscar Coetzee",
  "Dr. Kim Ross",
  "Kim Ross",
  "Dr. Jose Vega",
  "Jose Vega",
  "Liz Lipski",
  "Elizabeth Lipski",
  "Dr. Mike T. Nelson",
  "Dr. Mike T Nelson",
  "Dr Mike T Nelson",
  "Mike T Nelson",
  "Jordan Passwaters",
  "Yvonne Matthews",
  "Morgan Liner",
] as const;

const SPEAKER_ALIASES: Record<string, string> = {
  "David Feuz": "Dr. David Feuz",
  "Rachel Knowles": "Dr. Rachel Knowles",
  "Dr Rachel Knowles": "Dr. Rachel Knowles",
  "Oscar Coetzee": "Dr. Oscar Coetzee",
  "Kim Ross": "Dr. Kim Ross",
  "Dr Kim Ross": "Dr. Kim Ross",
  "Jose Vega": "Dr. Jose Vega",
  "Dr Jose Vega": "Dr. Jose Vega",
  "Elizabeth Lipski": "Liz Lipski",
  "Mike T Nelson": "Dr. Mike T. Nelson",
  "Dr Mike T Nelson": "Dr. Mike T. Nelson",
  "Dr. Mike T Nelson": "Dr. Mike T. Nelson",
};

export function classifyPrograms(title: string, description = ""): Program[] {
  return programsFor({ title, description });
}

/** Session format. Empty string when the title is a course module or unclassified. */
export function classifyRecordingType(title: string, description = ""): string {
  return recordingTypeFor({ title, description });
}

export function canonicalSpeaker(name: string): string {
  const trimmed = name.trim();
  return SPEAKER_ALIASES[trimmed] ?? trimmed;
}

export function mergeSpeakers(...lists: Array<string[] | string | null | undefined>): string[] {
  const found = new Set<string>();
  for (const list of lists) {
    const items = Array.isArray(list) ? list : list ? [list] : [];
    for (const item of items) {
      const speaker = canonicalSpeaker(item);
      if (speaker) found.add(speaker);
    }
  }
  return [...found];
}

export function extractSpeakers(title: string, description = ""): string[] {
  const haystack = `${title} ${description}`;
  const found = new Set<string>();

  for (const name of KNOWN_SPEAKERS) {
    if (haystack.toLowerCase().includes(name.toLowerCase())) {
      found.add(canonicalSpeaker(name));
    }
  }

  const withMatch = haystack.match(/\bwith\s+([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,3})/);
  if (withMatch?.[1]) {
    const guessed = withMatch[1].replace(/\s+MP\d*$/i, "").trim();
    if (!/^(elevated|us|pcc|non)\b/i.test(guessed)) {
      found.add(canonicalSpeaker(guessed));
    }
  }

  return [...found];
}

export function classifyTopics(title: string, description = ""): string[] {
  const haystack = `${title} ${description}`.toLowerCase();
  const topics: Array<[string, RegExp]> = [
    ["herbal safety", /herbal safety|contraindicat/],
    ["practice building", /practice|client|traction|0 to 1/],
    ["career", /career|roundtable|job/],
    ["scope of practice", /scope of practice/],
    ["functional testing", /functional testing|lab/],
    ["supplements", /supplement|amino|maca|inositol/],
    ["microbiome", /microbiome|eczema|gut/],
    ["digestive health", /digest|lipski|gi /],
    ["mindset", /mindset|non-compliant|non compliant/],
    ["storytelling", /story|niche/],
    ["BCHN", /\bbchn\b|board exam/],
  ];
  return topics.filter(([, pattern]) => pattern.test(haystack)).map(([label]) => label);
}
