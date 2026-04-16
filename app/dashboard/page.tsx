"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Report } from "@/lib/types";
import ReportCard from "@/components/ReportCard";

const DEFAULT_ATHLETE_ID = "placeholder-athlete-id";

function NavBar({ athleteId }: { athleteId: string }) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <span className="font-bold text-gray-900 text-lg">🏀 Recruiting Agent</span>
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
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

interface Stats {
  reportCount: number;
  sentCount: number;
  replyCount: number;
}

export default function DashboardPage() {
  const [athleteId, setAthleteId] = useState(DEFAULT_ATHLETE_ID);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats>({ reportCount: 0, sentCount: 0, replyCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [reportsRes, outreachRes] = await Promise.all([
        fetch(`/api/reports?athlete_id=${id}`),
        fetch(`/api/outreach?athlete_id=${id}`),
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports ?? []);
        setStats((prev) => ({ ...prev, reportCount: (data.reports ?? []).length }));
      }

      if (outreachRes.ok) {
        const data = await outreachRes.json();
        const outreach = data.outreach ?? [];
        const sent = outreach.filter((o: { status: string }) =>
          ["sent", "opened", "replied", "followup_sent"].includes(o.status)
        ).length;
        const replies = outreach.filter(
          (o: { status: string }) => o.status === "replied"
        ).length;
        setStats((prev) => ({ ...prev, sentCount: sent, replyCount: replies }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = localStorage.getItem("athlete_id") ?? DEFAULT_ATHLETE_ID;
    setAthleteId(id);
    fetchData(id);
  }, [fetchData]);

  const handleMarkFeatured = async (reportId: string) => {
    await fetch(`/api/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: true }),
    });
    fetchData(athleteId);
  };

  const recentReports = reports.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar athleteId={athleteId} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Recruiting Agent
          </h1>
          <p className="text-gray-500 mt-2">
            Upload your film, get analyzed, and connect with coaches.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-gray-900">{stats.reportCount}</p>
            <p className="text-sm text-gray-500 mt-1">Reports</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-purple-600">{stats.sentCount}</p>
            <p className="text-sm text-gray-500 mt-1">Emails Sent</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.replyCount}</p>
            <p className="text-sm text-gray-500 mt-1">Replies</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mb-10">
          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors shadow-sm"
          >
            🎬 Upload Film &amp; Analyze
          </Link>
        </div>

        {/* Recent Reports */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Reports
            </h2>
            <Link
              href="/outreach"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All Outreach →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <p className="text-gray-400 text-sm">
                No reports yet. Upload your first film to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.map((report) => (
                <Link key={report.id} href={`/report/${report.id}`}>
                  <ReportCard
                    report={report}
                    onMarkFeatured={handleMarkFeatured}
                    className="hover:shadow-md transition-shadow cursor-pointer h-full"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
