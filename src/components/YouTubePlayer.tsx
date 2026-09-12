"use client";

import { useEffect, useImperativeHandle, useRef } from "react";

export type YouTubePlayerHandle = {
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
};

type Props = {
  videoId: string;
  startSec?: number;
  onTime?: (seconds: number) => void;
  playerRef?: React.Ref<YouTubePlayerHandle>;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YtPlayer }) => void;
          };
        },
      ) => YtPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  destroy: () => void;
};

function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const existing = document.querySelector("script[data-yt-api]");
    if (existing) {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.dataset.ytApi = "true";
    document.body.appendChild(script);
  });
}

export function YouTubePlayer({ videoId, startSec = 0, onTime, playerRef }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<YtPlayer | null>(null);

  useImperativeHandle(playerRef, () => ({
    seekTo(seconds: number) {
      playerInstance.current?.seekTo(seconds, true);
    },
    getCurrentTime() {
      return playerInstance.current?.getCurrentTime() ?? 0;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function setup() {
      await loadApi();
      if (cancelled || !hostRef.current || !window.YT) return;
      playerInstance.current?.destroy();
      playerInstance.current = new window.YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          start: Math.max(0, Math.floor(startSec)),
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            if (startSec > 0) event.target.seekTo(startSec, true);
          },
        },
      });
      timer = window.setInterval(() => {
        if (!playerInstance.current || !onTime) return;
        onTime(playerInstance.current.getCurrentTime());
      }, 500);
    }

    void setup();
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      playerInstance.current?.destroy();
      playerInstance.current = null;
    };
  }, [videoId, startSec, onTime]);

  return (
    <div className="player-frame">
      <div ref={hostRef} className="h-full w-full" />
    </div>
  );
}
