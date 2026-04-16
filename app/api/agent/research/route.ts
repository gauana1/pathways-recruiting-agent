import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { researchSchools } from "@/lib/agent/researcher";
import type { Athlete, SchoolInsert, SchoolResearchResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { athlete_id } = await request.json();

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

    const result: SchoolResearchResult = await researchSchools({
      athlete: athlete as Athlete,
      target_schools: (athlete as Athlete).target_schools,
    });

    for (const school of result.schools) {
      await db
        .from("schools")
        .upsert(school as SchoolInsert & Record<string, unknown>, { onConflict: "athlete_id,name" });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/agent/research error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
