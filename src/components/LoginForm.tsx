"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/library";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next: nextPath }),
    });
    setPending(false);
    if (!response.ok) {
      setError("That password did not match. Try again, or write the Institute if you need access.");
      return;
    }
    router.push(nextPath.startsWith("/library") ? nextPath : "/library");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <div className="mb-6 flex items-center gap-4">
        <span className="section-label !mb-0">Member access</span>
        <span className="h-px w-14 bg-gold" />
      </div>
      <h1 className="font-display text-5xl leading-[1.08] text-charcoal md:text-6xl">
        The recording
        <br />
        <em className="text-emerald italic">library</em>
      </h1>
      <p className="mt-5 max-w-md text-base leading-8 text-slate">
        Live calls, lectures, and office hours for Holistic Consulting members. Enter the library
        password to browse and search the shelves.
      </p>
      <label className="mt-8 block">
        <span className="mb-2 block text-[0.65rem] font-semibold tracking-[0.14em] text-slate uppercase">
          Library password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
          required
        />
      </label>
      {error ? <p className="mt-3 text-sm text-[#8a3b2a]">{error}</p> : null}
      <button type="submit" className="btn-primary mt-7" disabled={pending}>
        {pending ? "Opening the door…" : "Enter the library"}
      </button>
    </form>
  );
}
