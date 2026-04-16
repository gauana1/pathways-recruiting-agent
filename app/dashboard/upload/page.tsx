"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import VideoAnalyzer from "@/components/VideoAnalyzer";
import type { FilmAnalysisResult } from "@/lib/types";

const DEFAULT_ATHLETE_ID = "placeholder-athlete-id";

export default function UploadPage() {
  const [athleteId, setAthleteId] = useState(DEFAULT_ATHLETE_ID);
  const [saving, setSaving] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("athlete_id") ?? DEFAULT_ATHLETE_ID;
    setAthleteId(id);
  }, []);

  const handleComplete = async (result: FilmAnalysisResult) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athlete_id: result.athlete_id,
          sport: result.sport,
          context: result.context,
          metrics: result.metrics,
          narrative: "Analysis complete. View your metrics below.",
          strengths: [],
          areas_for_improvement: [],
          recruitability_score: 50,
          comparable_level: "D3" as const,
          is_featured: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      setSavedReportId(data.report?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report.");
    } finally {
      setSaving(false);
    }
  };

  const handleError = (err: Error) => {
    setError(err.message);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple top bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← Back to Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-800">Upload Film</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload &amp; Analyze Film</h1>
          <p className="text-gray-500 mt-1">
            Upload a game film or drill video to generate your recruiting report.
          </p>
        </div>

        {/* Saving state */}
        {saving && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
            Saving analysis…
          </div>
        )}

        {/* Success */}
        {savedReportId && (
          <div className="mb-6 px-4 py-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-sm font-semibold text-green-800 mb-1">
              ✓ Analysis saved!
            </p>
            <Link
              href={`/report/${savedReportId}`}
              className="text-sm text-green-700 underline hover:text-green-900"
            >
              View your report →
            </Link>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <VideoAnalyzer
          athleteId={athleteId}
          onComplete={handleComplete}
          onError={handleError}
        />
      </main>
    </div>
  );
}
