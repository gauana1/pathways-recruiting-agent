"use client";

import { useState } from "react";
import type { Outreach, School } from "@/lib/types";

interface EmailDraftCardProps {
  outreach: Outreach;
  school: School;
  onApprove: (outreachId: string) => void;
  onEdit: (outreachId: string, subject: string, body: string) => void;
  onDiscard: (outreachId: string) => void;
  isLoading?: boolean;
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

export default function EmailDraftCard({
  outreach,
  school,
  onApprove,
  onEdit,
  onDiscard,
  isLoading = false,
}: EmailDraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [subject, setSubject] = useState(outreach.subject);
  const [body, setBody] = useState(outreach.body);

  const handleDoneEditing = () => {
    setIsEditing(false);
    onEdit(outreach.id, subject, body);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{school.name}</h3>
          <div className="text-sm text-gray-500 mt-0.5">
            {school.coach_name && <span>{school.coach_name}</span>}
            {school.coach_name && school.coach_email && <span> · </span>}
            {school.coach_email && <span>{school.coach_email}</span>}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_BADGES[outreach.status] ?? "bg-gray-100 text-gray-600"}`}
        >
          {STATUS_LABELS[outreach.status] ?? outreach.status}
        </span>
      </div>

      {/* Subject */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Subject
        </label>
        {isEditing ? (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p
            className="text-sm text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => setIsEditing(true)}
            title="Click to edit"
          >
            {subject}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Body
        </label>
        {isEditing ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
            {body}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onApprove(outreach.id)}
          disabled={isLoading || isEditing}
          className="flex-1 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending…" : "Approve & Send"}
        </button>
        <button
          onClick={isEditing ? handleDoneEditing : () => setIsEditing(true)}
          className="py-2 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {isEditing ? "Done" : "Edit"}
        </button>
        <button
          onClick={() => onDiscard(outreach.id)}
          disabled={isLoading}
          className="py-2 px-4 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
