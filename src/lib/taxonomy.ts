import { PROGRAMS, isProgram, type Program } from "./programs";
import { RECORDING_TYPES, isRecordingType, type RecordingType } from "./recording-types";

/**
 * Program vs Recording Type vs Topic.
 *
 * Program — shared curriculum. Only the four labels in `PROGRAMS`.
 * A video may carry more than one when the talk clearly belongs to two
 * curricula (an herbal lecture on a clinical condition, a business talk
 * inside a clinical series). Empty means unclassified. Brain `program:
 * mentorship` is NOT mapped: that export value is mostly Business
 * Mastermind dumps. Brain `other` and Community are not programs.
 *
 * Recording Type — how the session was held (one label). Live formats
 * already in the catalog: Community Live, Office Hours (New Graduate
 * Roundtable, titled Live Call, Nutritional Grand Rounds), Mastermind,
 * Roundtable, Grand Rounds, Guest Lecture, Orientation, Member Story.
 * Course modules with no session format stay blank.
 *
 * Topic — free-form subject tags from `classifyTopics`. Not collapsed
 * into programs.
 */

const SERIES_PROGRAM: Record<string, readonly Program[]> = {
  herbalism: ["Herbalism"],
  "hrb 637": ["Herbalism"],
  bchn: ["BCHN Exam Prep"],
  nanp: ["BCHN Exam Prep"],
  "business mastermind": ["Business Mentorship"],
  "finding your first client": ["Business Mentorship"],
  "career roundtable": ["Business Mentorship"],
  "tools & platforms": ["Business Mentorship"],
  "clinical education": ["Functional Nutrition Mentorship"],
  "gi & microbiome": ["Functional Nutrition Mentorship"],
  "functional testing": ["Functional Nutrition Mentorship"],
  "nutritional genomics": ["Functional Nutrition Mentorship"],
  "microbiome & sporebiotics": ["Functional Nutrition Mentorship"],
  "immune balance": ["Functional Nutrition Mentorship"],
  "grand rounds": ["Functional Nutrition Mentorship"],
  "clinical roundtable": ["Functional Nutrition Mentorship"],
  "case roundtable": ["Functional Nutrition Mentorship"],
  "new graduate roundtable": ["Functional Nutrition Mentorship"],
};

/** Brain `program` values that name a curriculum. `mentorship` is intentionally absent. */
const BRAIN_PROGRAM: Record<string, Program> = {
  herbal: "Herbalism",
  herbalism: "Herbalism",
  bchn: "BCHN Exam Prep",
};

const HERBAL_TITLE = /herbal|botanic|materia medica|tincture|glycerite|\brh\(ahg\)/;

const BCHN_TITLE = /\bbchn\b|board exam|board certif|\bnanp\b/;

const BUSINESS_TITLE =
  /\bbusiness\b|\bcareer\b|entrepreneur|\bniche\b|0 to 1|first client|sales funnel|ethical sales|linkedin|\bresume\b|discovery call|networking|non-compliant|content marketing|email marketing|practice building|\bmastermind\b|pricing|session package|lead funnel|accounting|\bemployment\b|interview prep|market research|per-session|start with 1:1|client consultation|client's journey|\broadmap\b|\boutreach\b|follow(?:ing)? up|\bstory\b|\bstories\b|\bfunnel\b|\bleads?\b|\bmindset\b|procrastination|monthly coach|ongoing action plan|core values|dream end state|goal setting|trying to build|who do you serve|destination intro|\bi help\b|\bopportunities\b|\broadblock\b|\bfullscript\b/;

const CLINICAL_TITLE =
  /sibo|small intestinal|\bgerd\b|\bibs\b|histamine|microbiome|sporebiotic|psychobiotic|nutrigenom|functional testing|bloodwork|blood work|lab panel|immunoglobulin|food sensitivity|\banemia\b|kidney|parkinson|\bcancer\b|inflamm|infertil|\badhd\b|\bpcos\b|constipation|melatonin|restorative sleep|luteal|menopause|hypertension|cholesterol|\bmaca\b|inositol|amino acid|thyroid|obesity|weight loss|\bdetox|adrenal|bone metabolism|bone health|blood sugar|blood pressure|blood lipid|metabolomic|akkermansia|mental health|neurological|reproductive|healthy aging|napro|eczema|toxicity|mitochondrial|chronic fatigue|eye health|sweetener|foundational gi|\bdigestive\b|bacozest|conventional blood|lipski|scope of practice|evidence-informed|evidence informed|nutritional counseling|metabolomics|immune balance|\bcandida\b|pub\s?med|hdl cholesterol|blood pattern|\bsupplements?\b|\bphysiology\b/;

const LEGACY_PROGRAMS: Record<string, Program> = {
  business: "Business Mentorship",
  "business & career": "Business Mentorship",
  "business and career": "Business Mentorship",
  mentorship: "Functional Nutrition Mentorship",
  "functional nutrition": "Functional Nutrition Mentorship",
  "functional nutrition mentorship": "Functional Nutrition Mentorship",
  bchn: "BCHN Exam Prep",
  "bchn exam prep": "BCHN Exam Prep",
  herbal: "Herbalism",
  herbalism: "Herbalism",
  "business mentorship": "Business Mentorship",
};

export type TaxonomyInput = {
  title?: string | null;
  displayTitle?: string | null;
  description?: string | null;
  series?: string | null;
  brainProgram?: string | null;
};

export type RecordingTaxonomy = {
  programs: Program[];
  recordingType: RecordingType | "";
};

export type LibraryFilterInput = {
  q?: string;
  browse?: string;
  program?: string;
  recordingType?: string;
  speaker?: string;
  year?: string;
  topic?: string;
  page?: string;
};

function haystack(input: TaxonomyInput): string {
  return [input.displayTitle, input.title, input.description]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function seriesKey(series: string | null | undefined): string {
  return series?.trim().toLowerCase() ?? "";
}

function addTitlePrograms(found: Set<Program>, text: string) {
  if (HERBAL_TITLE.test(text)) found.add("Herbalism");
  if (BCHN_TITLE.test(text)) found.add("BCHN Exam Prep");
  if (BUSINESS_TITLE.test(text)) found.add("Business Mentorship");
  if (CLINICAL_TITLE.test(text)) found.add("Functional Nutrition Mentorship");
}

/**
 * Ordered, first match wins. Office Hours is checked before Grand Rounds
 * so "Nutritional Grand Rounds" stays on the Office Hours shelf. NGR is
 * Office Hours, not Roundtable — that is the existing member-facing shelf.
 */
const RECORDING_TYPE_RULES: Array<{ type: RecordingType; test: (series: string, text: string) => boolean }> = [
  {
    type: "Community Live",
    test: (series, text) => series === "community live" || /community live|community call/.test(text),
  },
  {
    type: "Mastermind",
    test: (series, text) => series === "business mastermind" || /\bmastermind\b/.test(text),
  },
  {
    type: "Office Hours",
    test: (series, text) =>
      series === "new graduate roundtable" ||
      /\boffice hours\b|\bngr(?:\b|_)|nutritional grand rounds|\blive call\b/.test(text),
  },
  {
    type: "Grand Rounds",
    test: (series, text) => series === "grand rounds" || /\bgrand rounds\b/.test(text),
  },
  {
    type: "Roundtable",
    test: (series, text) => series.includes("roundtable") || /\broundtable\b/.test(text),
  },
  {
    type: "Guest Lecture",
    test: (series) => series === "guest teaching",
  },
  {
    type: "Member Story",
    test: (series, text) => series === "member stories" || /\btestimonial\b/.test(text),
  },
  {
    type: "Orientation",
    test: (series, text) =>
      series === "program orientation" ||
      /\bfma welcome\b|\bcohort intro\b|\bprogram welcome\b|\bprogram overview\b|\bwelcome to holistic\b|\bgroup call\b/.test(
        text,
      ),
  },
];

export function recordingTypeFor(input: TaxonomyInput): RecordingType | "" {
  const series = seriesKey(input.series);
  const text = haystack(input);
  for (const rule of RECORDING_TYPE_RULES) {
    if (rule.test(series, text)) return rule.type;
  }
  return "";
}

export function programsFor(input: TaxonomyInput): Program[] {
  const found = new Set<Program>();
  const series = seriesKey(input.series);
  const text = haystack(input);

  if (series === "business & career") {
    const clinical = CLINICAL_TITLE.test(text);
    const business = BUSINESS_TITLE.test(text);
    if (business || !clinical) found.add("Business Mentorship");
    if (clinical) found.add("Functional Nutrition Mentorship");
  } else {
    for (const program of SERIES_PROGRAM[series] ?? []) found.add(program);
  }

  addTitlePrograms(found, text);

  const brain = input.brainProgram?.trim().toLowerCase() ?? "";
  const mapped = BRAIN_PROGRAM[brain];
  if (mapped) found.add(mapped);

  return PROGRAMS.filter((program) => found.has(program));
}

export function taxonomyForBrainVideo(input: TaxonomyInput): RecordingTaxonomy {
  return {
    programs: programsFor(input),
    recordingType: recordingTypeFor(input),
  };
}

export function canonicalProgramFilter(value: string | undefined): Program | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (isProgram(trimmed)) return trimmed;
  return LEGACY_PROGRAMS[trimmed.toLowerCase()];
}

/**
 * Old browse links used session styles as programs (`Office Hours`, `Community`)
 * and short curriculum names (`Business`, `BCHN`, `Mentorship`).
 */
export function normalizeLibraryFilters<T extends LibraryFilterInput>(filters: T): T {
  let next: T = { ...filters };
  const program = next.program?.trim();
  if (program) {
    const key = program.toLowerCase();
    if (key === "office hours") {
      next = { ...next, program: undefined };
      if (!next.recordingType) next.recordingType = "Office Hours";
    } else if (key === "community") {
      next = { ...next, program: undefined };
      if (!next.browse) next.browse = "community";
    } else if (key === "other") {
      next = { ...next, program: undefined };
    } else {
      const canonical = canonicalProgramFilter(program);
      if (canonical && canonical !== program) next = { ...next, program: canonical };
    }
  }
  if (next.recordingType) {
    const type = canonicalRecordingTypeFilter(next.recordingType);
    next = { ...next, recordingType: type };
  }
  return next;
}

export function canonicalRecordingTypeFilter(value: string | undefined): RecordingType | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (isRecordingType(trimmed)) return trimmed;
  const match = RECORDING_TYPES.find((type) => type.toLowerCase() === trimmed.toLowerCase());
  return match;
}
