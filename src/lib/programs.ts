/**
 * Curriculum programs only. Session formats (Community Live, Office Hours,
 * Mastermind, …) are Recording Types — see `src/lib/recording-types.ts`.
 * Unclassified videos store an empty `programs` array. Do not write "Other"
 * or "Community" here; Related Content ignores those labels on purpose.
 */
export const PROGRAMS = [
  "Functional Nutrition Mentorship",
  "Herbalism",
  "BCHN Exam Prep",
  "Business Mentorship",
] as const;

export type Program = (typeof PROGRAMS)[number];

export function isProgram(value: string): value is Program {
  return (PROGRAMS as readonly string[]).includes(value);
}
