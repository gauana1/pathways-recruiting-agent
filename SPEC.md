# Athlete Recruiting Agent Platform v2 — Spec

Version 2.0 | Owner: Gautam | Status: Ready for agent handoff

---

## Core Concept

Athlete uploads film → AI analyzes technique → Agent researches target schools → Agent sends personalized outreach emails to coaches on the athlete's behalf → tracks responses → follows up automatically.

The moat: emails are personalized using real roster data and verified biomechanics metrics. Not a highlight reel blast — a targeted, credible pitch.

---

## Tech Stack

- **Hosting + API**: Vercel (Next.js App Router, serverless functions)
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth
- **File Storage**: Cloudflare R2
- **Background Jobs**: Vercel Cron + Upstash Redis
- **Pose Estimation**: MediaPipe WASM — runs entirely client-side in the browser
- **Web Research**: Claude API with web search tool
- **LLM / Agent**: Claude API (claude-sonnet-4)
- **Email Sending**: Resend
- **Email Tracking**: Resend webhooks

Target monthly cost at MVP scale: $0–20

---

## Key Architectural Decision: Client-Side Pose Estimation

MediaPipe runs in the browser via WASM. This means no GPU server is needed, no raw video is stored or sent to the backend, and processing is faster, cheaper, and more private.

The flow is:
1. Athlete selects a video file in the browser
2. MediaPipe WASM runs pose estimation locally on the device
3. Keypoints are extracted frame by frame
4. Metrics are computed client-side
5. Only the metrics JSON is sent to the backend — not the raw video
6. Backend stores metrics in Supabase
7. Claude generates a report narrative from the metrics
8. The agent outreach flow is kicked off

---

## Repository Structure

The project uses Next.js App Router. Key directories:

**App Routes**
- auth: login and signup pages
- dashboard: home page showing reports and outreach status, plus upload page for the analysis flow
- report/[reportId]: view a single analysis report
- profile/[athleteId]: public recruiting profile page
- outreach: outreach dashboard showing emails sent, responses, status

**API Routes**
- reports: save and fetch reports
- agent/research: research target schools
- agent/draft: draft outreach emails
- agent/send: send approved emails
- outreach: get outreach history, trigger followups via cron
- webhooks/resend: handle Resend delivery, open, and reply webhooks

**Components**
- VideoAnalyzer: client-side MediaPipe component
- MetricsDisplay: show extracted metrics
- ReportCard: display analysis report
- OutreachQueue: email approval UI
- EmailDraftCard: review and edit email before sending
- ProgramCard: display school/program info

**Lib**
- mediapipe.ts: MediaPipe setup and keypoint extraction
- metrics/basketball.ts, soccer.ts, football.ts: sport-specific metric computation
- agent/researcher.ts: school research agent
- agent/drafter.ts: email drafting agent
- agent/followup.ts: followup agent
- supabase.ts: Supabase client
- resend.ts: Resend client
- types.ts: all shared TypeScript types

---

## Database Schema

### athletes
Stores athlete profile data including name, sport, position, graduation year, height, weight, GPA, location, target division (D1/D2/D3/NAIA), and a list of target school names.

### reports
Stores the output of each film analysis. Includes the sport, context (game film, practice, drill), raw metrics as JSON, a Claude-generated narrative, strengths, areas for improvement, a recruitability score from 0–100, and a comparable level (D1/D2/D3/NAIA). One report can be marked as featured.

### schools
Stores schools researched by the agent. Includes name, sport, division, conference, location, coach name, coach email, a summary of roster needs, and the full agent research output.

### outreach
Stores each outreach email. Tracks the athlete, school, and report it's tied to, the subject and body, and a status that progresses through: draft → approved → sent → opened → replied → followup_sent. Also tracks sent/opened/replied timestamps, the Resend email ID for tracking, and followup count.

### profiles
Stores public recruiting profiles. Each athlete has one profile with a public/private toggle, a headline, a featured report, and a custom URL slug.

---

## Core Agent Flows

### Flow 1: Film Analysis (Client-Side)
The VideoAnalyzer component runs in the browser. It initializes MediaPipe WASM, processes the video file locally, extracts pose keypoints frame by frame, computes sport-specific metrics, and returns a metrics JSON object. No video is uploaded — only the metrics JSON is sent to the backend.

Sport-specific metric libraries handle the computation for basketball, soccer, and football. Each returns a structured metrics object that Claude can interpret.

### Flow 2: Report Generation
The backend receives the metrics JSON and athlete context. Claude is prompted to generate a narrative report including strengths, areas for improvement, a recruitability score, and a comparable division level.

### Flow 3: School Research Agent
The researcher agent takes the athlete's profile and target school list. For each school it uses Claude with web search to find the coaching staff, current roster, recent recruiting needs, and contact information. Results are stored in the schools table.

### Flow 4: Email Drafting Agent
The drafter agent takes the athlete profile, the featured report, and the school research for each target. It drafts a personalized outreach email referencing specific roster needs and verified biomechanics metrics. Emails are saved as drafts for athlete approval before sending.

### Flow 5: Send + Track
Once the athlete approves emails in the OutreachQueue UI, emails are sent via Resend. Resend webhooks update the outreach table when emails are delivered, opened, or replied to.

### Flow 6: Followup Agent
A Vercel Cron job runs on a schedule and triggers the followup agent. It checks for outreach emails that were sent but not replied to within a set window, drafts a followup, and sends it automatically. Followup count is tracked per outreach record.

---

## Public Profile
Each athlete can enable a public profile with a custom URL slug. The profile displays their headline and featured report. This can be shared directly with coaches as a recruiting page.

---
## Environment Variables Needed
- Supabase URL and anon key
- Anthropic API key
- Resend API key
- Cloudflare R2 credentials
- Upstash Redis URL and token