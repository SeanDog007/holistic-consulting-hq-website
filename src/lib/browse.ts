import { canonicalProgramFilter } from "./taxonomy";

/** Slim filter shape so this file does not import `@/lib/search`. */
export type BrowseQuery = {
  q?: string;
  browse?: string;
  program?: string;
  recordingType?: string;
  speaker?: string;
  year?: string;
  topic?: string;
  page?: string;
};

/**
 * Browse-the-Library shelves.
 *
 * Programs are curriculum (Functional Nutrition Mentorship, Herbalism,
 * BCHN Exam Prep, Business Mentorship). Recording Type is the session
 * format and has its own dropdown. Clinical Practice stays a topic/title
 * shelf. Community is a curated shelf of community session types
 * (Community Live, Orientation, Member Story) — not a program.
 * Office Hours is a Recording Type (New Graduate Roundtable, Live Call,
 * Nutritional Grand Rounds).
 *
 * Chip → filter mapping (also listed in README):
 * - Clinical Practice                  → `browse=clinical`
 * - Functional Nutrition Mentorship    → `program=Functional Nutrition Mentorship`
 * - Business Mentorship                → `program=Business Mentorship`
 * - Herbalism                          → `program=Herbalism`
 * - BCHN Exam Prep                     → `program=BCHN Exam Prep`
 * - Community                          → `browse=community`
 * - Office Hours                       → `recordingType=Office Hours`
 */
export const BROWSE_SHELVES = [
  {
    id: "clinical",
    label: "Clinical Practice",
    href: "/library?browse=clinical",
    kind: "browse" as const,
  },
  {
    id: "fn-mentorship",
    label: "Functional Nutrition Mentorship",
    href: "/library?program=Functional%20Nutrition%20Mentorship",
    kind: "program" as const,
    program: "Functional Nutrition Mentorship",
  },
  {
    id: "business",
    label: "Business Mentorship",
    href: "/library?program=Business%20Mentorship",
    kind: "program" as const,
    program: "Business Mentorship",
  },
  {
    id: "herbalism",
    label: "Herbalism",
    href: "/library?program=Herbalism",
    kind: "program" as const,
    program: "Herbalism",
  },
  {
    id: "bchn",
    label: "BCHN Exam Prep",
    href: "/library?program=BCHN%20Exam%20Prep",
    kind: "program" as const,
    program: "BCHN Exam Prep",
  },
  {
    id: "community",
    label: "Community",
    href: "/library?browse=community",
    kind: "browse" as const,
  },
  {
    id: "office-hours",
    label: "Office Hours",
    href: "/library?recordingType=Office%20Hours",
    kind: "recordingType" as const,
    recordingType: "Office Hours",
  },
] as const;

export type BrowseId = (typeof BROWSE_SHELVES)[number]["id"];

export function isBrowseId(value: string | undefined): value is BrowseId {
  return BROWSE_SHELVES.some((shelf) => shelf.id === value);
}

const CLINICAL_TOPICS = [
  "digestive health",
  "microbiome",
  "functional testing",
  "supplements",
] as const;

// Title keywords taken from the live Brain catalog — do not invent empty clinical tags.
const CLINICAL_TITLE_KEYWORDS = [
  "histamine",
  "gerd",
  "ibs",
  "sibo",
  "microbiome",
  "digest",
  "candida",
  "immune balance",
  "sporebiotic",
  "psychobiotic",
  "nutrigenom",
  "functional testing",
  "bloodwork",
  "blood work",
  "lab panel",
  "immunoglobulin",
  "food sensitivity",
  "anemia",
  "kidney",
  "parkinson",
  "cancer",
  "inflamm",
  "infertil",
  "adhd",
  "pcos",
  "constipation",
  "melatonin",
  "restorative sleep",
  "luteal",
  "menopause",
  "hypertension",
  "cholesterol",
  "maca",
  "inositol",
  "amino acid",
  "thyroid",
  "obesity",
  "weight loss",
  "detox",
  "adrenal",
  "bone metabolism",
  "bone health",
  "blood sugar",
  "blood pressure",
  "blood lipid",
  "metabolomic",
  "akkermansia",
  "mental health",
  "neurological",
  "reproductive",
  "healthy aging",
  "napro",
  "eczema",
  "toxicity",
  "mitochondrial",
  "chronic fatigue",
  "eye health",
  "sweetener",
  "foundational gi",
  "gi digestive",
  "gi dysfunction",
  "gi support",
  "bacozest",
  "conventional blood",
  "lipski",
];

const COMMUNITY_TITLE_PATTERNS = [
  /community live/i,
  /community call/i,
  /mentorship program/i,
  /welcome to holistic/i,
  /program welcome/i,
  /working with us/i,
  /member roundtable/i,
  /interested in working/i,
  /options to continue/i,
  /fma welcome/i,
  /cohort intro/i,
  /group call/i,
  /sean\s*&\s*david program/i,
];

/** Community chip: session types, not a curriculum program. */
const COMMUNITY_SHELF_TYPES = new Set(["Community Live", "Orientation", "Member Story"]);

export type BrowseVideoFields = {
  title: string;
  displayTitle?: string | null;
  programs: string[];
  topics: string[];
  recordingType?: string | null;
};

function haystackFor(video: BrowseVideoFields): string {
  return `${video.title} ${video.displayTitle ?? ""}`.toLowerCase();
}

function matchesClinical(video: BrowseVideoFields): boolean {
  const haystack = haystackFor(video);
  if (/mastermind/i.test(haystack) || /testimonial/i.test(haystack)) return false;
  if (video.topics.some((topic) => (CLINICAL_TOPICS as readonly string[]).includes(topic))) {
    return true;
  }
  return CLINICAL_TITLE_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function matchesCommunity(video: BrowseVideoFields): boolean {
  const haystack = haystackFor(video);
  if (/mastermind/i.test(haystack) || video.recordingType === "Mastermind") return false;
  if (video.recordingType && COMMUNITY_SHELF_TYPES.has(video.recordingType)) return true;
  if (video.recordingType) return false;
  return COMMUNITY_TITLE_PATTERNS.some((pattern) => pattern.test(haystack));
}

function matchesOfficeHours(video: BrowseVideoFields): boolean {
  if (video.recordingType) return video.recordingType === "Office Hours";
  const haystack = haystackFor(video);
  return /\boffice hours\b|\bngr(?:\b|_)|nutritional grand rounds|\blive call\b/.test(haystack);
}

export function videoMatchesBrowse(browse: string, video: BrowseVideoFields): boolean {
  switch (browse) {
    case "clinical":
      return matchesClinical(video);
    case "community":
      return matchesCommunity(video);
    case "office-hours":
      return matchesOfficeHours(video);
    case "business":
      return video.programs.includes("Business Mentorship");
    case "herbalism":
      return video.programs.includes("Herbalism");
    case "bchn":
      return video.programs.includes("BCHN Exam Prep");
    case "fn-mentorship":
      return video.programs.includes("Functional Nutrition Mentorship");
    default:
      return false;
  }
}

export function activeBrowseId(filters: BrowseQuery): BrowseId | null {
  if (filters.browse && isBrowseId(filters.browse)) return filters.browse;
  if (filters.recordingType && !filters.program) {
    const match = BROWSE_SHELVES.find(
      (shelf) => shelf.kind === "recordingType" && shelf.recordingType === filters.recordingType,
    );
    if (match) return match.id;
  }
  if (filters.program) {
    const program = canonicalProgramFilter(filters.program) ?? filters.program;
    const match = BROWSE_SHELVES.find(
      (shelf) => shelf.kind === "program" && shelf.program === program,
    );
    if (match) return match.id;
    if (filters.program === "Community") return "community";
  }
  return null;
}

export function librarySearchHref(filters: BrowseQuery, page = 1): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.browse && isBrowseId(filters.browse)) params.set("browse", filters.browse);
  if (filters.program) params.set("program", filters.program);
  if (filters.recordingType) params.set("recordingType", filters.recordingType);
  if (filters.speaker) params.set("speaker", filters.speaker);
  if (filters.year) params.set("year", filters.year);
  if (filters.topic) params.set("topic", filters.topic);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/library?${query}` : "/library";
}
