"use client";

import { FormEvent, useState } from "react";

type WaitlistState = "idle" | "submitting" | "joined";
type WaitlistPayload = {
  email: string;
  user_type?: string;
};

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("");
  const [status, setStatus] = useState<WaitlistState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setError(null);

    try {
      const payload: WaitlistPayload = { email: email.trim().toLowerCase() };
      if (userType) payload.user_type = userType;

      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      setStatus("joined");
      setEmail("");
      setUserType("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  if (status === "joined") {
    return (
      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-zinc-900">
        You&apos;re in. We&apos;ll share launch access first.
      </p>
    );
  }

  return (
    <form className="flex w-full max-w-3xl flex-col gap-3" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
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
          placeholder="Email (required)"
          className="h-12 w-full border border-zinc-900 px-4 text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        />
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[23rem]">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="h-12 border-2 border-zinc-900 bg-zinc-900 px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(24,24,27,0.28)] transition-all hover:bg-black focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {status === "submitting" ? "Joining..." : "Get Early Access"}
          </button>
          <div className="space-y-1 text-xs font-medium text-zinc-700">
            <p>Join early access for Pathways hardware</p>
            <p>Limited access for athletes, coaches, and training programs</p>
            <p>Real-time training system — early release beta</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:max-w-sm">
        <label className="sr-only" htmlFor="waitlist-user-type">
          User type
        </label>
        <select
          id="waitlist-user-type"
          value={userType}
          onChange={(event) => setUserType(event.target.value)}
          disabled={status === "submitting"}
          className="h-12 w-full border border-zinc-900 bg-white px-4 text-sm font-medium text-zinc-900 focus:outline-none"
        >
          <option value="">User type (optional)</option>
          <option value="athlete">Athlete</option>
          <option value="coach">Coach</option>
          <option value="parent">Parent</option>
        </select>
      </div>

      {error ? (
        <p className="text-sm font-medium text-zinc-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
