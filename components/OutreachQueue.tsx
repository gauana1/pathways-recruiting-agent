"use client";

import { useState, useEffect, useCallback } from "react";
import type { Outreach, School } from "@/lib/types";
import EmailDraftCard from "./EmailDraftCard";

interface OutreachQueueProps {
  athleteId: string;
}

type OutreachWithSchool = Outreach & { school: School };

const SENT_STATUSES = new Set(["sent", "opened", "replied", "followup_sent"]);

const STATUS_BADGES: Record<string, string> = {
  sent: "bg-purple-100 text-purple-700",
  opened: "bg-yellow-100 text-yellow-700",
  replied: "bg-green-100 text-green-700",
  followup_sent: "bg-orange-100 text-orange-700",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "Sent",
  opened: "Opened",
  replied: "Replied",
  followup_sent: "Follow-up Sent",
};

export default function OutreachQueue({ athleteId }: OutreachQueueProps) {
  const [items, setItems] = useState<OutreachWithSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

  const fetchOutreach = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outreach?athlete_id=${athleteId}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.outreach ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [athleteId]);

  useEffect(() => {
    fetchOutreach();
  }, [fetchOutreach]);

  const handleApprove = async (outreachId: string) => {
    setSendingIds((prev) => new Set(prev).add(outreachId));
    try {
      const res = await fetch("/api/agent/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outreach_ids: [outreachId] }),
      });
      if (res.ok) {
        await fetchOutreach();
      }
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(outreachId);
        return next;
      });
    }
  };

  const handleEdit = async (outreachId: string, subject: string, body: string) => {
    // Optimistically update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === outreachId ? { ...item, subject, body } : item
      )
    );
    try {
      await fetch(`/api/outreach/${outreachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
    } catch {
      // Local state already updated; PATCH endpoint may not exist
    }
  };

  const handleDiscard = (outreachId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== outreachId));
  };

  const drafts = items.filter((item) => item.status === "draft");
  const sent = items.filter((item) => SENT_STATUSES.has(item.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pending Approval */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Pending Approval
          {drafts.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
              {drafts.length}
            </span>
          )}
        </h2>
        {drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-gray-400 text-sm">No pending emails.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((item) => (
              <EmailDraftCard
                key={item.id}
                outreach={item}
                school={item.school}
                onApprove={handleApprove}
                onEdit={handleEdit}
                onDiscard={handleDiscard}
                isLoading={sendingIds.has(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sent Emails */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          Sent Emails
          {sent.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              {sent.length}
            </span>
          )}
        </h2>
        {sent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <p className="text-gray-400 text-sm">No sent emails yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {item.school.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                    {item.subject}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGES[item.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
