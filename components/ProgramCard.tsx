"use client";

import type { School, Outreach } from "@/lib/types";

interface ProgramCardProps {
  school: School;
  outreach?: Outreach;
  className?: string;
}

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  opened: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
  followup_sent: "bg-orange-100 text-orange-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  approved: "Approved",
  sent: "Sent",
  opened: "Opened",
  replied: "Replied",
  followup_sent: "Follow-up Sent",
};

const DIVISION_COLORS: Record<string, string> = {
  D1: "bg-blue-100 text-blue-700",
  D2: "bg-purple-100 text-purple-700",
  D3: "bg-gray-100 text-gray-700",
  NAIA: "bg-orange-100 text-orange-700",
};

export default function ProgramCard({
  school,
  outreach,
  className = "",
}: ProgramCardProps) {
  const rosterNeeds = school.research_output.roster_needs.slice(0, 3);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-5 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-base">{school.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${DIVISION_COLORS[school.division] ?? "bg-gray-100 text-gray-700"}`}
            >
              {school.division}
            </span>
            {school.conference && (
              <span className="text-xs text-gray-500">{school.conference}</span>
            )}
            {school.location && (
              <span className="text-xs text-gray-400">📍 {school.location}</span>
            )}
          </div>
        </div>
        {outreach && (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_BADGES[outreach.status] ?? "bg-gray-100 text-gray-600"}`}
          >
            {STATUS_LABELS[outreach.status] ?? outreach.status}
          </span>
        )}
      </div>

      {/* Coach info */}
      {(school.coach_name || school.coach_email) && (
        <div className="mb-3 text-sm">
          {school.coach_name && (
            <p className="font-medium text-gray-700">{school.coach_name}</p>
          )}
          {school.coach_email && (
            <p className="text-gray-500">{school.coach_email}</p>
          )}
        </div>
      )}

      {/* Roster summary */}
      {school.roster_summary && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {school.roster_summary}
        </p>
      )}

      {/* Roster needs */}
      {rosterNeeds.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Roster Needs
          </p>
          <ul className="space-y-1">
            {rosterNeeds.map((need, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                <span>{need}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
