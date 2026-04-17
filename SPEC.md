# Pathways Waitlist Conversion Product — Spec

Version: 3.0

---

## Product Scope

Pathways is intentionally narrowed to a single-purpose launch funnel:

1. Visitor lands on homepage.
2. Visitor submits waitlist form.
3. Entry is validated and upserted into Supabase.
4. Visitor sees immediate success confirmation.

No recruiting dashboards, outreach workflows, report generation, or agent automation are in scope.

---

## User Experience

- Keep the existing Pathways visual identity (bold typography, high-contrast monochrome UI).
- Homepage communicates pre-launch value proposition.
- Form captures:
  - `email` (required)
  - `user_type` (optional: athlete, coach, parent)
  - `skill_level` (optional, accepted by UI payload)

---

## Technical Architecture

### Frontend

- `app/page.tsx` renders landing page and waitlist CTA.
- `components/WaitlistForm.tsx` handles client-side submission state and errors.

### Backend

- `app/api/waitlist/route.ts` validates payload and upserts into `waitlist` table.
- `lib/supabase.ts` provides typed Supabase clients.
- `lib/types.ts` defines waitlist-centric database types.

### Database

- Primary table: `waitlist`
- Unique constraint on `email` supports idempotent upserts.

---

## Non-Goals

- CRM automation
- Coach outreach sequences
- Film/video analysis
- Metrics or scouting reports
- Webhook-driven email tracking
