import type { Report } from "@/lib/types";
import MetricsDisplay from "@/components/MetricsDisplay";
import Link from "next/link";

type Props = { params: Promise<{ athleteId: string }> };

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

export default async function ProfilePage({ params }: Props) {
  const { athleteId } = await params;

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  let reports: Report[] = [];
  try {
    const res = await fetch(
      `${baseUrl}/api/reports?athlete_id=${athleteId}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      reports = data.reports ?? [];
    }
  } catch {
    // Fall through to empty state
  }

  const featuredReport =
    reports.find((r) => r.is_featured) ?? reports[0] ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <span className="font-bold text-gray-900 text-lg">🏀 Recruiting Agent</span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl mx-auto mb-3">
            🏀
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Recruiting Profile</h1>
          <p className="text-sm text-gray-400 mt-1 font-mono">{athleteId}</p>
        </div>

        {!featuredReport ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-gray-400 text-sm mb-2">No featured report yet.</p>
            <Link
              href="/dashboard/upload"
              className="text-sm text-blue-600 hover:underline"
            >
              Upload film to generate a report →
            </Link>
          </div>
        ) : (
          <>
            {/* Featured Report Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-start gap-5 mb-4">
                <div
                  className={`flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 shrink-0 ${scoreBg(featuredReport.recruitability_score)}`}
                >
                  <span
                    className={`text-3xl font-bold ${scoreColor(featuredReport.recruitability_score)}`}
                  >
                    {featuredReport.recruitability_score}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">score</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      ⭐ Featured Report
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${DIVISION_COLORS[featuredReport.comparable_level] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {featuredReport.comparable_level}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {featuredReport.narrative}
                  </p>
                </div>
              </div>

              {featuredReport.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Strengths
                  </p>
                  <ul className="space-y-1">
                    {featuredReport.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Performance Metrics
              </h2>
              <MetricsDisplay metrics={featuredReport.metrics} />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center">
        <p className="text-xs text-gray-400">Powered by Recruiting Agent</p>
      </footer>
    </div>
  );
}
