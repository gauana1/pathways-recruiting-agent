"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import OutreachQueue from "@/components/OutreachQueue";

const DEFAULT_ATHLETE_ID = "placeholder-athlete-id";

function NavBar({ athleteId }: { athleteId: string }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <span className="font-bold text-gray-900 text-lg">🏀 Recruiting Agent</span>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/upload"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Upload Film
          </Link>
          <Link
            href="/outreach"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Outreach
          </Link>
          <Link
            href={`/profile/${athleteId}`}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>
    </nav>
  );
}

type AgentAction = "research" | "draft";

interface AgentState {
  loading: boolean;
  message: string | null;
  isError: boolean;
}

export default function OutreachPage() {
  const [athleteId, setAthleteId] = useState(DEFAULT_ATHLETE_ID);
  const [research, setResearch] = useState<AgentState>({
    loading: false,
    message: null,
    isError: false,
  });
  const [draft, setDraft] = useState<AgentState>({
    loading: false,
    message: null,
    isError: false,
  });

  useEffect(() => {
    const id = localStorage.getItem("athlete_id") ?? DEFAULT_ATHLETE_ID;
    setAthleteId(id);
  }, []);

  const runAgent = async (action: AgentAction) => {
    const setter = action === "research" ? setResearch : setDraft;
    setter({ loading: true, message: null, isError: false });
    try {
      const res = await fetch(`/api/agent/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athlete_id: athleteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      const label = action === "research" ? "Research complete!" : "Drafts created!";
      setter({ loading: false, message: label, isError: false });
    } catch (err) {
      setter({
        loading: false,
        message: err instanceof Error ? err.message : "Something went wrong.",
        isError: true,
      });
    }
  };

  const isAnyLoading = research.loading || draft.loading;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar athleteId={athleteId} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Outreach Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Research programs and send personalized emails to coaches.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Research Schools */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => runAgent("research")}
              disabled={isAnyLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {research.loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Researching…
                </>
              ) : (
                "🔍 Research Schools"
              )}
            </button>
            {research.message && (
              <p
                className={`text-xs font-medium ${research.isError ? "text-red-600" : "text-green-600"}`}
              >
                {research.isError ? "✗" : "✓"} {research.message}
              </p>
            )}
          </div>

          {/* Draft Emails */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => runAgent("draft")}
              disabled={isAnyLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {draft.loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Drafting…
                </>
              ) : (
                "✉️ Draft Emails"
              )}
            </button>
            {draft.message && (
              <p
                className={`text-xs font-medium ${draft.isError ? "text-red-600" : "text-green-600"}`}
              >
                {draft.isError ? "✗" : "✓"} {draft.message}
              </p>
            )}
          </div>
        </div>

        {/* Queue */}
        <OutreachQueue athleteId={athleteId} />
      </main>
    </div>
  );
}
