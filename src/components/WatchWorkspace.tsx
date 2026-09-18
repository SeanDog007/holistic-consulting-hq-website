"use client";

import { useMemo, useRef, useState } from "react";
import { HighlightedText } from "@/components/HighlightedText";
import { YouTubePlayer, type YouTubePlayerHandle } from "@/components/YouTubePlayer";
import { formatTimestamp, youtubeWatchUrl } from "@/lib/format";

type Segment = {
  id: string;
  startMs: number;
  endMs: number | null;
  text: string;
};

export function WatchWorkspace({
  youtubeId,
  startSec = 0,
  segments,
}: {
  youtubeId: string;
  startSec?: number;
  segments: Segment[];
}) {
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const [query, setQuery] = useState("");
  const [currentSec, setCurrentSec] = useState(startSec);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return segments;
    return segments.filter((segment) => segment.text.toLowerCase().includes(needle));
  }, [query, segments]);

  const activeId = useMemo(() => {
    const ms = currentSec * 1000;
    return (
      segments.find((segment) => {
        const end = segment.endMs ?? segment.startMs + 12000;
        return ms >= segment.startMs && ms < end;
      })?.id ?? null
    );
  }, [currentSec, segments]);

  function seekTo(startMs: number) {
    const seconds = startMs / 1000;
    playerRef.current?.seekTo(seconds);
    setCurrentSec(seconds);
    const url = new URL(window.location.href);
    url.searchParams.set("t", String(Math.floor(seconds)));
    window.history.replaceState({}, "", url);
  }

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
      <div className="bg-forest-deep">
        <YouTubePlayer
          videoId={youtubeId}
          startSec={startSec}
          playerRef={playerRef}
          onTime={setCurrentSec}
        />
      </div>

      <aside className="flex max-h-[720px] flex-col bg-white">
        <div className="border-b border-line p-5">
          <span className="section-label !mb-2">Spoken words</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this transcript…"
            className="field"
          />
          <p className="mt-2 text-[0.72rem] text-slate">
            {filtered.length} {filtered.length === 1 ? "moment" : "moments"}
            {query ? " matching" : ""}
          </p>
          <a
            href={youtubeWatchUrl(youtubeId, currentSec)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[0.7rem] font-semibold tracking-[0.08em] text-emerald uppercase hover:underline"
          >
            YouTube at this timestamp ↗
          </a>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-5 text-sm leading-7 text-slate">
              No spoken lines match that search. Try a single clinical word — safety, client,
              microbiome, BCHN.
            </p>
          ) : (
            <ul>
              {filtered.map((segment) => (
                <li key={segment.id}>
                  <button
                    type="button"
                    onClick={() => seekTo(segment.startMs)}
                    className={`w-full border-b border-line px-5 py-4 text-left transition-colors hover:bg-warm-gray ${
                      activeId === segment.id ? "bg-sage" : "bg-white"
                    }`}
                  >
                    <span className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold uppercase">
                      {formatTimestamp(segment.startMs)}
                    </span>
                    <p className="mt-1 text-sm leading-6 text-charcoal">
                      <HighlightedText text={segment.text} query={query} />
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
