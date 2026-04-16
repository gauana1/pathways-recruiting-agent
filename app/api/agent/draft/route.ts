import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { draftEmails } from "@/lib/agent/drafter";
import type { Athlete, Report, School, EmailDraftResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { athlete_id, report_id } = await request.json();

    if (!athlete_id) {
      return NextResponse.json({ error: "athlete_id is required" }, { status: 400 });
    }

    const db = createServerClient();

    const { data: athlete, error: athleteError } = await db
      .from("athletes")
      .select("*")
      .eq("id", athlete_id)
      .single();

    if (athleteError || !athlete) {
      return NextResponse.json({ error: "Athlete not found" }, { status: 404 });
    }

    let reportQuery = db.from("reports").select("*").eq("athlete_id", athlete_id);
    if (report_id) {
      reportQuery = reportQuery.eq("id", report_id);
    } else {
      reportQuery = reportQuery.eq("is_featured", true);
    }

    const { data: report, error: reportError } = await reportQuery.single();

    if (reportError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { data: schools, error: schoolsError } = await db
      .from("schools")
      .select("*")
      .eq("athlete_id", athlete_id);

    if (schoolsError) throw schoolsError;

    const result: EmailDraftResult = await draftEmails({
      athlete: athlete as Athlete,
      featured_report: report as Report,
      schools: (schools ?? []) as School[],
    });

    for (const draft of result.drafts) {
      const { personalization: _personalization, ...outreachInsert } = draft;
      await db.from("outreach").insert({ ...outreachInsert, status: "draft" });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/agent/draft error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
