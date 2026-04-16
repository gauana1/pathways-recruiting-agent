import Anthropic from "@anthropic-ai/sdk";
import type {
  SchoolResearchRequest,
  SchoolResearchResult,
  SchoolInsert,
  SchoolResearchOutput,
  Division,
} from "../types";

const SYSTEM_PROMPT = `You are an expert college recruiting researcher. Your job is to research college athletic programs and find detailed information about coaching staff, roster needs, and contact information. Always respond with accurate, current information. Format your final answer as JSON.`;

function buildUserPrompt(schoolName: string, sport: string): string {
  return `Research the ${sport} program at ${schoolName}. Find:
1. Current coaching staff (head coach and assistants) with names and titles
2. Current roster composition and likely recruiting needs by position
3. Coach contact information (email if available)
4. Division level and conference
5. Location (city, state)
6. A brief summary of the program's current state and needs

Respond with this exact JSON structure:
{
  "coaching_staff": ["Head Coach: Name - Title", ...],
  "roster_needs": ["Need description", ...],
  "contact_points": ["coach@school.edu", ...],
  "division": "D1|D2|D3|NAIA",
  "conference": "Conference name",
  "location": "City, State",
  "coach_name": "Primary coach name",
  "coach_email": "email or null",
  "roster_summary": "Brief roster summary",
  "summary": "Program summary",
  "sources": ["URL or source description", ...]
}`;
}

function extractJson(text: string): Record<string, unknown> {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");
  return JSON.parse(jsonMatch[0]);
}

const VALID_DIVISIONS = new Set<Division>(["D1", "D2", "D3", "NAIA"]);

function isValidDivision(value: unknown): value is Division {
  return typeof value === "string" && VALID_DIVISIONS.has(value as Division);
}

export async function researchSchools(
  request: SchoolResearchRequest
): Promise<SchoolResearchResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const schools: SchoolInsert[] = [];

  for (const schoolName of request.target_schools) {
    try {
      const response = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(schoolName, request.athlete.sport),
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content in response");
      }

      const parsed = extractJson(textContent.text);

      const researchOutput: SchoolResearchOutput = {
        coaching_staff: Array.isArray(parsed.coaching_staff)
          ? (parsed.coaching_staff as string[])
          : [],
        roster_needs: Array.isArray(parsed.roster_needs)
          ? (parsed.roster_needs as string[])
          : [],
        contact_points: Array.isArray(parsed.contact_points)
          ? (parsed.contact_points as string[])
          : [],
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        sources: Array.isArray(parsed.sources)
          ? (parsed.sources as string[])
          : [],
        raw_findings: {},
      };

      const division = isValidDivision(parsed.division)
        ? parsed.division
        : "D1";

      const school: SchoolInsert = {
        athlete_id: request.athlete.id,
        name: schoolName,
        sport: "basketball",
        division,
        conference:
          typeof parsed.conference === "string" ? parsed.conference : null,
        location:
          typeof parsed.location === "string" ? parsed.location : null,
        coach_name:
          typeof parsed.coach_name === "string" ? parsed.coach_name : null,
        coach_email:
          typeof parsed.coach_email === "string" &&
          parsed.coach_email !== "null"
            ? parsed.coach_email
            : null,
        roster_summary:
          typeof parsed.roster_summary === "string"
            ? parsed.roster_summary
            : null,
        research_output: researchOutput,
      };

      schools.push(school);
    } catch {
      schools.push({
        athlete_id: request.athlete.id,
        name: schoolName,
        sport: "basketball",
        division: "D1",
        conference: null,
        location: null,
        coach_name: null,
        coach_email: null,
        roster_summary: null,
        research_output: {
          coaching_staff: [],
          roster_needs: [],
          contact_points: [],
          summary: "",
          sources: [],
          raw_findings: {},
        },
      });
    }
  }

  return {
    athlete_id: request.athlete.id,
    status: "completed",
    schools,
  };
}
