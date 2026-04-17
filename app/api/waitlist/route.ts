import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { WaitlistEntry, WaitlistInsert } from "@/lib/types";

interface WaitlistRequestBody {
  email?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body: WaitlistRequestBody = await request.json();
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("waitlist")
      .upsert({ email } as WaitlistInsert & Record<string, unknown>, {
        onConflict: "email",
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ waitlist: data as WaitlistEntry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/waitlist error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
