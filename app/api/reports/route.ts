import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Report, ReportInsert } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const athlete_id = searchParams.get("athlete_id");

  if (!athlete_id) {
    return NextResponse.json({ error: "athlete_id is required" }, { status: 400 });
  }

  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("reports")
      .select("*")
      .eq("athlete_id", athlete_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: (data ?? []) as Report[] });
  } catch (err) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportInsert = await request.json();

    if (!body.athlete_id) {
      return NextResponse.json({ error: "athlete_id is required" }, { status: 400 });
    }

    const db = createServerClient();

    if (body.is_featured) {
      await db
        .from("reports")
        .update({ is_featured: false })
        .eq("athlete_id", body.athlete_id)
        .eq("is_featured", true);
    }

    const { data, error } = await db
      .from("reports")
      .insert(body as ReportInsert & Record<string, unknown>)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ report: data as Report }, { status: 201 });
  } catch (err) {
    console.error("POST /api/reports error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
