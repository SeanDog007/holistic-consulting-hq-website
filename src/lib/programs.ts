export const PROGRAMS = [
  "Mentorship",
  "Community",
  "Herbalism",
  "Business",
  "BCHN",
  "Office Hours",
  "Other",
] as const;

export type Program = (typeof PROGRAMS)[number];

export function isProgram(value: string): value is Program {
  return (PROGRAMS as readonly string[]).includes(value);
}
