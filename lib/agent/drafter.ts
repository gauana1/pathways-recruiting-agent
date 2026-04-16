import Anthropic from "@anthropic-ai/sdk";
import type {
  EmailDraftRequest,
  EmailDraftResult,
  EmailDraftPersonalization,
  OutreachInsert,
  School,
  MetricMeasurement,
} from "../types";

const SYSTEM_PROMPT = `You are an expert college recruiting email writer. You write personalized, compelling outreach emails from athletes to college coaches. Your emails are concise, professional, and reference specific program needs and verified athletic metrics. Always respond with JSON.`;

function formatMetrics(measurements: Record<string, MetricMeasurement>): string {
  return Object.entries(measurements)
    .map(([key, m]) => {
      const val = `${m.value}${m.unit ? ` ${m.unit}` : ""}`;
      return `- ${m.label || key}: ${val}${m.benchmark ? ` (benchmark: ${m.benchmark})` : ""}`;
    })
    .join("\n");
}

function buildUserPrompt(
  school: School,
  request: EmailDraftRequest,
  metricsText: string
): string {
  const { athlete, featured_report } = request;
  return `Draft a recruiting outreach email for this athlete to send to ${school.coach_name || "the coaching staff"} at ${school.name}.

ATHLETE PROFILE:
Name: ${athlete.name}
Sport: ${athlete.sport}
Position: ${athlete.position}
Graduation Year: ${athlete.graduation_year}
Height/Weight: ${athlete.height} / ${athlete.weight}lbs
GPA: ${athlete.gpa}
Location: ${athlete.location}
Target Division: ${athlete.target_division}

PERFORMANCE METRICS:
${metricsText}

REPORT HIGHLIGHTS:
Recruitability Score: ${featured_report.recruitability_score}/100
Comparable Level: ${featured_report.comparable_level}
Strengths: ${featured_report.strengths.join(", ")}

PROGRAM RESEARCH:
School: ${school.name}
Division: ${school.division}
Conference: ${school.conference}
Roster Needs: ${school.research_output.roster_needs.join(", ")}
Program Summary: ${school.research_output.summary}

Write a personalized email that:
1. Opens with a specific reference to the program's needs
2. Introduces the athlete with key stats
3. References 2-3 specific biomechanics metrics that match their needs
4. Includes a clear call to action
5. Is under 250 words

Respond with this JSON:
{
  "subject": "Email subject line",
  "body": "Full email body",
  "personalization": {
    "roster_need_references": ["specific need referenced"],
    "metric_references": ["specific metric referenced"],
    "profile_highlights": ["key highlight used"]
  }
}`;
}

function extractJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

export async function draftEmails(
  request: EmailDraftRequest
): Promise<EmailDraftResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const metricsText = formatMetrics(request.featured_report.metrics.measurements);
  const drafts: Array<OutreachInsert & { personalization: EmailDraftPersonalization }> = [];

  for (const school of request.schools) {
    try {
      const response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(school, request, metricsText),
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      const parsed = extractJson(textContent.text);

      const personalization: EmailDraftPersonalization = {
        roster_need_references: Array.isArray(
          (parsed.personalization as Record<string, unknown>)?.roster_need_references
        )
          ? ((parsed.personalization as Record<string, unknown>).roster_need_references as string[])
          : [],
        metric_references: Array.isArray(
          (parsed.personalization as Record<string, unknown>)?.metric_references
        )
          ? ((parsed.personalization as Record<string, unknown>).metric_references as string[])
          : [],
        profile_highlights: Array.isArray(
          (parsed.personalization as Record<string, unknown>)?.profile_highlights
        )
          ? ((parsed.personalization as Record<string, unknown>).profile_highlights as string[])
          : [],
      };

      drafts.push({
        athlete_id: request.athlete.id,
        school_id: school.id,
        report_id: request.featured_report.id,
        subject: typeof parsed.subject === "string" ? parsed.subject : "",
        body: typeof parsed.body === "string" ? parsed.body : "",
        status: "draft",
        personalization,
      });
    } catch {
      drafts.push({
        athlete_id: request.athlete.id,
        school_id: school.id,
        report_id: request.featured_report.id,
        subject: `Recruiting Inquiry - ${request.athlete.name}`,
        body: "",
        status: "draft",
        personalization: {
          roster_need_references: [],
          metric_references: [],
          profile_highlights: [],
        },
      });
    }
  }

  return {
    athlete_id: request.athlete.id,
    status: "completed",
    drafts,
  };
}
