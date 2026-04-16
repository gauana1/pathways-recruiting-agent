"use client";

import type { Report } from "@/lib/types";

interface ReportCardProps {
  report: Report;
  onMarkFeatured?: (reportId: string) => void;
  className?: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  game_film: "Game Film",
  practice: "Practice",
  drill: "Drill",
};

const DIVISION_COLORS: Record<string, string> = {
  D1: "bg-blue-100 text-blue-700",
  D2: "bg-purple-100 text-purple-700",
  D3: "bg-gray-100 text-gray-700",
  NAIA: "bg-orange-100 text-orange-700",
};

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-green-50 border-green-200";
  if (score >= 50) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export default function ReportCard({
  report,
  onMarkFeatured,
  className = "",
}: ReportCardProps) {
  const formattedDate = new Date(report.created_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const topStrengths = report.strengths.slice(0, 3);
  const topAreas = report.areas_for_improvement.slice(0, 2);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 ${scoreBg(report.recruitability_score)}`}
        >
          <span
            className={`text-3xl font-bold ${scoreColor(report.recruitability_score)}`}
          >
            {report.recruitability_score}
          </span>
          <span className="text-xs text-gray-500 mt-0.5">score</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          {report.is_featured && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
              ⭐ Featured
            </span>
          )}
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${DIVISION_COLORS[report.comparable_level] ?? "bg-gray-100 text-gray-700"}`}
          >
            {report.comparable_level}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
            {CONTEXT_LABELS[report.context] ?? report.context}
          </span>
        </div>
      </div>

      {/* Narrative */}
      {report.narrative && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {report.narrative}
        </p>
      )}

      {/* Strengths */}
      {topStrengths.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Strengths
          </p>
          <ul className="space-y-1">
            {topStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for improvement */}
      {topAreas.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Areas to Improve
          </p>
          <ul className="space-y-1">
            {topAreas.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-yellow-500 mt-0.5 shrink-0">⚡</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formattedDate}</span>
        {onMarkFeatured && !report.is_featured && (
          <button
            onClick={() => onMarkFeatured(report.id)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Mark as Featured
          </button>
        )}
      </div>
    </div>
  );
}
