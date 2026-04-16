import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/resend";
import type {
  Outreach,
  School,
  OutreachSendRequest,
  OutreachSendResult,
  OutreachSendReceipt,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: OutreachSendRequest = await request.json();
    const { outreach_ids } = body;

    if (!outreach_ids?.length) {
      return NextResponse.json({ error: "outreach_ids is required" }, { status: 400 });
    }

    const db = createServerClient();
    const receipts: OutreachSendReceipt[] = [];
    let athlete_id = "";

    for (const outreach_id of outreach_ids) {
      const { data: outreach, error: outreachError } = await db
        .from("outreach")
        .select("*")
        .eq("id", outreach_id)
        .single();

      if (outreachError || !outreach) {
        console.warn(`Outreach ${outreach_id} not found, skipping`);
        continue;
      }

      const { data: school, error: schoolError } = await db
        .from("schools")
        .select("*")
        .eq("id", (outreach as Outreach).school_id)
        .single();

      if (schoolError || !school) {
        console.warn(`School for outreach ${outreach_id} not found, skipping`);
        continue;
      }

      if (!(school as School).coach_email) {
        console.warn(`No coach email for school ${(school as School).name}, skipping`);
        continue;
      }

      athlete_id = (outreach as Outreach).athlete_id;

      const emailResult = await sendEmail({
        to: (school as School).coach_email!,
        subject: (outreach as Outreach).subject,
        html: (outreach as Outreach).body,
      });

      const sent_at = new Date().toISOString();

      await db
        .from("outreach")
        .update({
          status: "sent",
          sent_at,
          resend_email_id: emailResult.data?.id ?? null,
        })
        .eq("id", outreach_id);

      receipts.push({
        outreach_id,
        resend_email_id: emailResult.data?.id ?? "",
        sent_at,
        status: "sent",
      });
    }

    const result: OutreachSendResult = {
      athlete_id,
      status: "completed",
      receipts,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("POST /api/agent/send error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
