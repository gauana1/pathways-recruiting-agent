import type { Report } from "@/lib/types";
import MetricsDisplay from "@/components/MetricsDisplay";
import Link from "next/link";

type Props = { params: Promise<{ reportId: string }> };

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

export default async function ReportPage({ params }: Props) {
  const { reportId } = await params;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  let report: Report | null = null;
  try {
    const res = await fetch(`${baseUrl}/api/reports/${reportId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      report = data.report;
    }
  } catch {
    // Fall through to not-found state
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-semibold text-gray-700 mb-2">
            Report not found.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(report.created_at).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-800">Report</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Report header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
          <div
            className={`flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 shrink-0 ${scoreBg(report.recruitability_score)}`}
          >
            <span
              className={`text-4xl font-bold ${scoreColor(report.recruitability_score)}`}
            >
              {report.recruitability_score}
            </span>
            <span className="text-xs text-gray-500 mt-1">Recruitability</span>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {report.is_featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                  ⭐ Featured
                </span>
              )}
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${DIVISION_COLORS[report.comparable_level] ?? "bg-gray-100 text-gray-700"}`}
              >
                {report.comparable_level}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                {CONTEXT_LABELS[report.context] ?? report.context}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{report.narrative}</p>
            <p className="text-xs text-gray-400 mt-2">{formattedDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          {report.strengths.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Strengths
              </h2>
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 shrink-0 text-base">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {report.areas_for_improvement.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Areas for Improvement
              </h2>
              <ul className="space-y-2">
                {report.areas_for_improvement.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-yellow-500 mt-0.5 shrink-0 text-base">⚡</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Performance Metrics
          </h2>
          <MetricsDisplay metrics={report.metrics} />
        </div>
      </main>
    </div>
  );
}
