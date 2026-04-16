import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Report, ReportUpdate } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: data as Report });
  } catch (err) {
    console.error("GET /api/reports/[reportId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  try {
    const body: ReportUpdate = await request.json();
    const db = createServerClient();

    if (body.is_featured) {
      const { data: existing } = await db
        .from("reports")
        .select("athlete_id")
        .eq("id", reportId)
        .single();

      if (existing) {
        await db
          .from("reports")
          .update({ is_featured: false })
          .eq("athlete_id", existing.athlete_id)
          .eq("is_featured", true);
      }
    }

    const { data, error } = await db
      .from("reports")
      .update(body as ReportUpdate & Record<string, unknown>)
      .eq("id", reportId)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ report: data as Report });
  } catch (err) {
    console.error("PATCH /api/reports/[reportId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  try {
    const db = createServerClient();
    const { error } = await db.from("reports").delete().eq("id", reportId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/reports/[reportId] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
