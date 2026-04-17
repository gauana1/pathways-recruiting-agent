import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { WaitlistEntry, WaitlistInsert, WaitlistUserType } from "@/lib/types";

interface WaitlistRequestBody {
  email?: unknown;
  user_type?: unknown;
  skill_level?: unknown;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_USER_TYPES: ReadonlySet<WaitlistUserType> = new Set(["athlete", "coach", "parent"]);

interface PostgrestErrorLike {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
}

function isWaitlistUserType(value: string): value is WaitlistUserType {
  return WAITLIST_USER_TYPES.has(value as WaitlistUserType);
}

function normalizeWaitlistUserType(value: unknown): WaitlistUserType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isWaitlistUserType(normalized) ? normalized : null;
}

function isUserTypeSchemaMismatchError(error: PostgrestErrorLike): boolean {
  const code = error.code?.toUpperCase();
  const combinedMessage = [error.message, error.details, error.hint]
    .filter((segment): segment is string => typeof segment === "string" && segment.length > 0)
    .join(" ")
    .toLowerCase();

  if (!combinedMessage.includes("user_type")) return false;

  if (code === "PGRST204" || code === "42703") return true;

  return (
    combinedMessage.includes("schema cache") ||
    combinedMessage.includes("could not find") ||
    combinedMessage.includes("column") ||
    combinedMessage.includes("does not exist")
  );
}

function getErrorDiagnostics(error: unknown): Record<string, unknown> {
  if (!(error && typeof error === "object")) {
    return { type: typeof error, value: String(error) };
  }

  const errorRecord = error as Record<string, unknown>;
  return {
    name: errorRecord.name,
    message: errorRecord.message,
    code: errorRecord.code,
    details: errorRecord.details,
    hint: errorRecord.hint,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawBody: unknown = await request.json();
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }

    const body = rawBody as WaitlistRequestBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    let userType: WaitlistUserType | null = null;
    if (body.user_type != null) {
      if (typeof body.user_type !== "string") {
        return NextResponse.json(
          { error: "user_type must be one of: athlete, coach, parent" },
          { status: 400 }
        );
      }

      const normalizedUserType = body.user_type.trim().toLowerCase();
      if (!isWaitlistUserType(normalizedUserType)) {
        return NextResponse.json(
          { error: "user_type must be one of: athlete, coach, parent" },
          { status: 400 }
        );
      }

      userType = normalizedUserType;
    }

    const db = createServerClient();
    const waitlistInsertWithUserType: WaitlistInsert & Record<string, unknown> = userType
      ? { email, user_type: userType }
      : { email };

    let { data, error } = await db
      .from("waitlist")
      .upsert(waitlistInsertWithUserType, {
        onConflict: "email",
      })
      .select("*")
      .single();

    if (error && userType && isUserTypeSchemaMismatchError(error as PostgrestErrorLike)) {
      console.warn("POST /api/waitlist user_type schema mismatch, retrying without user_type", {
        code: (error as PostgrestErrorLike).code,
        details: (error as PostgrestErrorLike).details,
        hint: (error as PostgrestErrorLike).hint,
        message: (error as PostgrestErrorLike).message,
      });

      ({ data, error } = await db
        .from("waitlist")
        .upsert({ email } satisfies WaitlistInsert & Record<string, unknown>, {
          onConflict: "email",
        })
        .select("*")
        .single());
    }

    if (error) throw error;

    const waitlist = {
      ...(data as Record<string, unknown>),
      user_type: normalizeWaitlistUserType((data as Record<string, unknown>)?.user_type),
    } as WaitlistEntry;

    return NextResponse.json({ waitlist }, { status: 201 });
  } catch (err) {
    console.error("POST /api/waitlist error:", getErrorDiagnostics(err));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
