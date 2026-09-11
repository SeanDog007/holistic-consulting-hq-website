export function BotanicalMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 320 320"
      fill="none"
      aria-hidden
    >
      <path
        d="M160 300c-8-52 14-88 48-118 28-24 56-38 72-42-18 28-22 62-8 96-32-8-70 8-112 64Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M160 300c8-56-18-92-54-120-30-24-60-36-78-38 22 30 24 64 6 98 34-6 74 12 126 60Z"
        fill="currentColor"
      />
      <path
        d="M160 292c2-70 4-128 0-188"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M158 160c-28-18-58-22-86-14M162 128c30-16 62-18 90-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
