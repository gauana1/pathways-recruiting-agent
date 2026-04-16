import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { OutreachStatus } from "@/lib/types";

interface ResendWebhookPayload {
  type: string;
  data: {
    email_id: string;
    created_at: string;
    [key: string]: unknown;
  };
}

function resolveStatus(eventType: string): OutreachStatus | null {
  switch (eventType) {
    case "email.delivered":
      return "sent";
    case "email.opened":
      return "opened";
    case "email.replied":
    case "email.clicked":
      return "replied";
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: ResendWebhookPayload = await request.json();
    const { type, data } = payload;

    if (!data?.email_id) {
      return NextResponse.json({ received: true });
    }

    const status = resolveStatus(type);
    if (!status) {
      return NextResponse.json({ received: true });
    }

    const db = createServerClient();

    const { data: outreach, error } = await db
      .from("outreach")
      .select("id, status, opened_at")
      .eq("resend_email_id", data.email_id)
      .single();

    if (error || !outreach) {
      return NextResponse.json({ received: true });
    }

    const update: Record<string, string> = { status };

    if (status === "opened" && !outreach.opened_at) {
      update.opened_at = data.created_at ?? new Date().toISOString();
    } else if (status === "replied") {
      update.replied_at = data.created_at ?? new Date().toISOString();
    }

    await db.from("outreach").update(update).eq("id", outreach.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("POST /api/webhooks/resend error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
