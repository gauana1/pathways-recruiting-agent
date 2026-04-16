import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { draftFollowup } from "@/lib/agent/followup";
import { sendEmail } from "@/lib/resend";
import type { Athlete, School, Report, Outreach, FollowupResult } from "@/lib/types";

const FOLLOWUP_THRESHOLD_DAYS = 7;

export async function POST() {
  try {
    const db = createServerClient();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - FOLLOWUP_THRESHOLD_DAYS);

    const { data: overdueOutreach, error } = await db
      .from("outreach")
      .select("*")
      .eq("status", "sent")
      .lt("sent_at", cutoff.toISOString());

    if (error) throw error;

    const results: FollowupResult[] = [];

    for (const outreach of overdueOutreach ?? []) {
      try {
        const [{ data: athlete }, { data: school }, { data: report }] = await Promise.all([
          db.from("athletes").select("*").eq("id", (outreach as Outreach).athlete_id).single(),
          db.from("schools").select("*").eq("id", (outreach as Outreach).school_id).single(),
          db.from("reports").select("*").eq("id", (outreach as Outreach).report_id).single(),
        ]);

        if (!athlete || !school || !report) {
          console.warn(`Missing data for outreach ${outreach.id}, skipping`);
          continue;
        }

        if (!(school as School).coach_email) {
          console.warn(`No coach email for outreach ${outreach.id}, skipping`);
          continue;
        }

        const days_since_sent = Math.floor(
          (Date.now() - new Date((outreach as Outreach).sent_at!).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const result = await draftFollowup({
          athlete: athlete as Athlete,
          school: school as School,
          report: report as Report,
          outreach: outreach as Outreach,
          days_since_sent,
        });

        await sendEmail({
          to: (school as School).coach_email!,
          subject: result.followup.subject,
          html: result.followup.body,
        });

        await db
          .from("outreach")
          .update({
            status: "followup_sent",
            followup_count: result.followup_count,
          })
          .eq("id", outreach.id);

        results.push(result);
      } catch (innerErr) {
        console.error(`Error processing followup for outreach ${outreach.id}:`, innerErr);
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error("POST /api/outreach/followup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
