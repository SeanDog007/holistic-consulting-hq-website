import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { videoMatchesBrowse } from "./browse.ts";
import { brainVideoRecord, type BrainVideo } from "./brain-catalog.ts";
import { loadDisplayTitleOverrides, loadSpeakerOverrides } from "./display-title.ts";
import { isProgram, PROGRAMS } from "./programs.ts";
import { isRecordingType, RECORDING_TYPES } from "./recording-types.ts";
import { normalizeLibraryFilters, taxonomyForBrainVideo } from "./taxonomy.ts";

function catalogRows() {
  const videos = JSON.parse(readFileSync(new URL("../../data/brain/videos.json", import.meta.url), "utf8")) as BrainVideo[];
  const titles = loadDisplayTitleOverrides();
  const speakers = loadSpeakerOverrides();
  return videos.filter((video) => video?.video_id).map((video) => brainVideoRecord(video, titles, speakers));
}

describe("taxonomyForBrainVideo", () => {
  it("keeps Community Live off the program list", () => {
    const row = taxonomyForBrainVideo({
      title: "Community Live 09152026",
      displayTitle: "Community Live — Sep 15, 2026",
      series: "Community Live",
      brainProgram: "mentorship",
    });
    assert.equal(row.recordingType, "Community Live");
    assert.deepEqual(row.programs, []);
  });

  it("maps Business Mastermind to Business Mentorship, not Functional Nutrition Mentorship", () => {
    const row = taxonomyForBrainVideo({
      title: "Business Mastermind Call",
      displayTitle: "Business Mastermind — Sep 8, 2026",
      series: "Business Mastermind",
      brainProgram: "mentorship",
    });
    assert.equal(row.recordingType, "Mastermind");
    assert.deepEqual(row.programs, ["Business Mentorship"]);
  });

  it("maps New Graduate Roundtable to Office Hours inside Functional Nutrition Mentorship", () => {
    const row = taxonomyForBrainVideo({
      title: "NGR 8_20_2026",
      displayTitle: "New Graduate Roundtable — Aug 20, 2026",
      series: "New Graduate Roundtable",
      brainProgram: "mentorship",
    });
    assert.equal(row.recordingType, "Office Hours");
    assert.deepEqual(row.programs, ["Functional Nutrition Mentorship"]);
  });

  it("does not let a clinical title inside Business & Career become only a business program", () => {
    const row = taxonomyForBrainVideo({
      title: "Small Intestinal Bacterial Overgrowth",
      series: "Business & Career",
      brainProgram: null,
    });
    assert.deepEqual(row.programs, ["Functional Nutrition Mentorship"]);
    assert.equal(row.recordingType, "");
  });

  it("maps herbal and BCHN series onto the curriculum labels", () => {
    assert.deepEqual(
      taxonomyForBrainVideo({ title: "Intro to Herbalism", series: "Herbalism", brainProgram: "herbal" }).programs,
      ["Herbalism"],
    );
    assert.deepEqual(
      taxonomyForBrainVideo({ title: "BCHN Info Session", series: "BCHN", brainProgram: "BCHN" }).programs,
      ["BCHN Exam Prep"],
    );
  });

  it("leaves Brain program other unclassified", () => {
    const row = taxonomyForBrainVideo({
      title: "Recording — Apr 29, 2026",
      series: "Guest Teaching",
      brainProgram: "other",
    });
    assert.equal(row.recordingType, "Guest Lecture");
    assert.deepEqual(row.programs, []);
  });
});

describe("normalizeLibraryFilters", () => {
  it("rewrites retired program query values", () => {
    assert.equal(normalizeLibraryFilters({ program: "Business" }).program, "Business Mentorship");
    assert.equal(normalizeLibraryFilters({ program: "BCHN" }).program, "BCHN Exam Prep");
    assert.equal(
      normalizeLibraryFilters({ program: "Mentorship" }).program,
      "Functional Nutrition Mentorship",
    );
    const office = normalizeLibraryFilters({ program: "Office Hours" });
    assert.equal(office.program, undefined);
    assert.equal(office.recordingType, "Office Hours");
    const community = normalizeLibraryFilters({ program: "Community" });
    assert.equal(community.program, undefined);
    assert.equal(community.browse, "community");
    assert.equal(normalizeLibraryFilters({ program: "Other" }).program, undefined);
  });
});

describe("catalog taxonomy", () => {
  const rows = catalogRows();

  it("uses only the four curriculum programs and real recording types", () => {
    const programCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();
    for (const row of rows) {
      for (const program of row.programs) {
        assert.equal(isProgram(program), true, program);
        programCounts.set(program, (programCounts.get(program) ?? 0) + 1);
      }
      if (row.recordingType) {
        assert.equal(isRecordingType(row.recordingType), true, row.recordingType);
        typeCounts.set(row.recordingType, (typeCounts.get(row.recordingType) ?? 0) + 1);
      }
      assert.equal(row.programs.includes("Community"), false);
      assert.equal(row.programs.includes("Other"), false);
      assert.equal(row.programs.includes("Office Hours"), false);
    }
    for (const program of PROGRAMS) {
      assert.ok((programCounts.get(program) ?? 0) > 0, program);
    }
    for (const type of RECORDING_TYPES) {
      assert.ok((typeCounts.get(type) ?? 0) > 0, type);
    }
    const community = rows.find((row) => row.youtubeId === "WmxHXioxJsI");
    assert.equal(community?.recordingType, "Community Live");
    assert.deepEqual(community?.programs, []);
  });

  it("keeps the community shelf and office hours shelf populated", () => {
    const community = rows.filter((row) =>
      videoMatchesBrowse("community", {
        title: row.title,
        displayTitle: row.displayTitle,
        programs: row.programs,
        topics: row.topics,
        recordingType: row.recordingType,
      }),
    );
    const office = rows.filter((row) => row.recordingType === "Office Hours");
    assert.ok(community.length > 5);
    assert.ok(office.length >= 20);
    assert.equal(
      community.some((row) => row.recordingType === "Mastermind"),
      false,
    );
  });
});
