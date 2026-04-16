import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Outreach, School, OutreachStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const athlete_id = searchParams.get("athlete_id");
  const status = searchParams.get("status") as OutreachStatus | null;

  if (!athlete_id) {
    return NextResponse.json({ error: "athlete_id is required" }, { status: 400 });
  }

  try {
    const db = createServerClient();

    let query = db
      .from("outreach")
      .select("*, school:schools(*)")
      .eq("athlete_id", athlete_id);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      outreach: (data ?? []) as unknown as Array<Outreach & { school: School }>,
    });
  } catch (err) {
    console.error("GET /api/outreach error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
