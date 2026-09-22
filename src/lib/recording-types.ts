/**
 * Session format for a recording. One value per video.
 * Derived from Brain `series` and titles that actually occur in the catalog.
 * An empty string means the recording has no special session format
 * (a course lecture or unclassified standalone).
 */
export const RECORDING_TYPES = [
  "Community Live",
  "Office Hours",
  "Mastermind",
  "Roundtable",
  "Grand Rounds",
  "Guest Lecture",
  "Orientation",
  "Member Story",
] as const;

export type RecordingType = (typeof RECORDING_TYPES)[number];

export function isRecordingType(value: string): value is RecordingType {
  return (RECORDING_TYPES as readonly string[]).includes(value);
}
