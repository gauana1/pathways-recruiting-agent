import Anthropic from "@anthropic-ai/sdk";
import type {
  FollowupRequest,
  FollowupResult,
  FollowupDraft,
  MetricMeasurement,
} from "../types";

const SYSTEM_PROMPT = `You are an expert college recruiting email writer specializing in follow-up communications. Write concise, respectful followup emails that add value without being pushy. Always respond with JSON.`;

function formatMetrics(measurements: Record<string, MetricMeasurement>): string {
  return Object.entries(measurements)
    .map(([key, m]) => {
      const val = `${m.value}${m.unit ? ` ${m.unit}` : ""}`;
      return `- ${m.label || key}: ${val}${m.benchmark ? ` (benchmark: ${m.benchmark})` : ""}`;
    })
    .join("\n");
}

function buildUserPrompt(request: FollowupRequest, metricsText: string): string {
  const { athlete, school, outreach } = request;
  return `Draft a followup email for this recruiting outreach that hasn't received a response after ${request.days_since_sent} days.

ORIGINAL CONTEXT:
Athlete: ${athlete.name}, ${athlete.position}, Class of ${athlete.graduation_year}
School: ${school.name} (${school.division})
Coach: ${school.coach_name || "Coaching Staff"}
Original subject: ${outreach.subject}
Followup count: ${outreach.followup_count} (this is followup #${outreach.followup_count + 1})

ATHLETE METRICS SUMMARY:
${metricsText}

Write a brief, professional followup that:
1. References the previous email briefly
2. Adds one new piece of value (a new metric, achievement, or update)
3. Is under 150 words
4. Is appropriate for followup #${outreach.followup_count + 1}

Respond with JSON:
{
  "subject": "Re: [original subject or new subject]",
  "body": "Followup email body",
  "rationale": "Why this followup approach was chosen"
}`;
}

function extractJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

export async function draftFollowup(
  request: FollowupRequest
): Promise<FollowupResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const metricsText = formatMetrics(request.report.metrics.measurements);

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(request, metricsText),
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in response");
  }

  const parsed = extractJson(textContent.text);

  const followup: FollowupDraft = {
    subject: typeof parsed.subject === "string" ? parsed.subject : `Re: ${request.outreach.subject}`,
    body: typeof parsed.body === "string" ? parsed.body : "",
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : "",
  };

  return {
    outreach_id: request.outreach.id,
    status: "followup_sent",
    sent_at: new Date().toISOString(),
    followup_count: request.outreach.followup_count + 1,
    followup,
  };
}
