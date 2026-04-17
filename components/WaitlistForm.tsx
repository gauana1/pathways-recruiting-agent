"use client";

import { FormEvent, useState } from "react";

type WaitlistState = "idle" | "submitting" | "joined";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<WaitlistState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      setStatus("joined");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  if (status === "joined") {
    return (
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-900">
        You&apos;re in. We&apos;ll contact you first.
      </p>
    );
  }

  return (
    <form
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="waitlist-email">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        disabled={status === "submitting"}
        required
        placeholder="Email"
        className="h-12 w-full border border-zinc-900 px-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="h-12 bg-zinc-900 px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-zinc-700 focus:outline-none"
      >
        {status === "submitting" ? "Joining..." : "Join Waitlist"}
      </button>
      {error ? (
        <p className="text-sm font-medium text-zinc-700 sm:basis-full" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
