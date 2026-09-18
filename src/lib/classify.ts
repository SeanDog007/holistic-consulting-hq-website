import { PROGRAMS, type Program } from "@/lib/programs";

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
  "Dr. Mike T Nelson",
  "Dr Mike T Nelson",
  "Mike T Nelson",
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
  "Mike T Nelson": "Dr. Mike T Nelson",
  "Dr Mike T Nelson": "Dr. Mike T Nelson",
};

export function classifyPrograms(title: string, description = ""): Program[] {
  const haystack = `${title} ${description}`.toLowerCase();
  const found = new Set<Program>();

  if (/(herbal|botanic|materia medica|tincture|rh\(ahg\))/.test(haystack)) {
    found.add("Herbalism");
  }
  if (/\bbchn\b|board exam|board certif|nanp/.test(haystack)) {
    found.add("BCHN");
  }
  // Brain program is often mentorship/other/null — Office Hours is inferred from titles.
  // NGR = Nutritional Grand Rounds, the live drop-in / case-rounds shelf.
  if (/\boffice hours\b|\bngr(?:\b|_)|nutritional grand rounds|\blive call\b/.test(haystack)) {
    found.add("Office Hours");
  }
  if (/(community live|community call|roundtable)/.test(haystack)) {
    found.add("Community");
  }
  if (!found.has("Office Hours") && /grand rounds/.test(haystack)) {
    found.add("Community");
  }
  if (/(career|practice|client|business|niche|story|entrepreneur|traction|0 to 1)/.test(haystack)) {
    found.add("Business");
  }
  if (/(scope of practice|functional testing|amino|supplement|microbiome|mentorship|case review)/.test(haystack)) {
    found.add("Mentorship");
  }
  if (found.size === 0) {
    found.add("Other");
  }

  return PROGRAMS.filter((program) => found.has(program));
}

export function extractSpeakers(title: string, description = ""): string[] {
  const haystack = `${title} ${description}`;
  const found = new Set<string>();

  for (const name of KNOWN_SPEAKERS) {
    if (haystack.toLowerCase().includes(name.toLowerCase())) {
      found.add(SPEAKER_ALIASES[name] ?? name);
    }
  }

  const withMatch = haystack.match(/\bwith\s+([A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){1,3})/);
  if (withMatch?.[1]) {
    const guessed = withMatch[1].replace(/\s+MP\d*$/i, "").trim();
    if (!/^(elevated|us|pcc|non)\b/i.test(guessed)) {
      found.add(SPEAKER_ALIASES[guessed] ?? guessed);
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
