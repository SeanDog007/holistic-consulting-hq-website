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
    <form onSubmit={onSubmit} className="border border-line bg-white p-8 md:p-10">
      <span className="section-label">Member access</span>
      <div className="gold-line" />
      <h1 className="font-display text-4xl text-charcoal md:text-5xl">
        The recording <em className="text-emerald italic">library</em>
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate">
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
      <button type="submit" className="btn-primary mt-6" disabled={pending}>
        {pending ? "Opening the door…" : "Enter the library"}
      </button>
    </form>
  );
}
