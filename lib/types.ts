export type UUID = string;
export type ISODateString = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type Sport = "basketball";
export type FilmContext = "game_film" | "practice" | "drill";
export type Division = "D1" | "D2" | "D3" | "NAIA";
export type OutreachStatus =
  | "draft"
  | "approved"
  | "sent"
  | "opened"
  | "replied"
  | "followup_sent";
export type AgentFlowStatus = "queued" | "running" | "completed" | "failed";

export interface TimestampFields {
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseFrame {
  frame_index: number;
  timestamp_ms: number;
  keypoints: PoseKeypoint[];
}

export interface MetricMeasurement {
  label: string;
  value: number | string | boolean;
  unit?: string;
  description?: string;
  benchmark?: string;
  confidence?: number;
}

export interface BasketballMetrics {
  sport: "basketball";
  summary?: string;
  measurements: Record<string, MetricMeasurement>;
  raw: JsonObject;
}

export interface Athlete extends TimestampFields {
  id: UUID;
  auth_user_id: UUID | null;
  name: string;
  sport: "basketball";
  position: string;
  graduation_year: number;
  height: string | null;
  weight: number | null;
  gpa: number | null;
  location: string | null;
  target_division: Division | null;
  target_schools: string[];
}

export interface AthleteInsert {
  auth_user_id?: UUID | null;
  name: string;
  sport?: "basketball";
  position: string;
  graduation_year: number;
  height?: string | null;
  weight?: number | null;
  gpa?: number | null;
  location?: string | null;
  target_division?: Division | null;
  target_schools?: string[];
}

export interface AthleteUpdate {
  auth_user_id?: UUID | null;
  name?: string;
  sport?: "basketball";
  position?: string;
  graduation_year?: number;
  height?: string | null;
  weight?: number | null;
  gpa?: number | null;
  location?: string | null;
  target_division?: Division | null;
  target_schools?: string[];
}

export interface Report extends TimestampFields {
  id: UUID;
  athlete_id: UUID;
  sport: "basketball";
  context: FilmContext;
  metrics: BasketballMetrics;
  narrative: string;
  strengths: string[];
  areas_for_improvement: string[];
  recruitability_score: number;
  comparable_level: Division;
  is_featured: boolean;
}

export interface ReportInsert {
  athlete_id: UUID;
  sport?: "basketball";
  context: FilmContext;
  metrics: BasketballMetrics;
  narrative: string;
  strengths: string[];
  areas_for_improvement: string[];
  recruitability_score: number;
  comparable_level: Division;
  is_featured?: boolean;
}

export interface ReportUpdate {
  sport?: "basketball";
  context?: FilmContext;
  metrics?: BasketballMetrics;
  narrative?: string;
  strengths?: string[];
  areas_for_improvement?: string[];
  recruitability_score?: number;
  comparable_level?: Division;
  is_featured?: boolean;
}

export interface SchoolResearchOutput {
  coaching_staff: string[];
  roster_needs: string[];
  contact_points: string[];
  summary: string;
  sources: string[];
  raw_findings: JsonObject;
}

export interface School extends TimestampFields {
  id: UUID;
  athlete_id: UUID;
  name: string;
  sport: "basketball";
  division: Division;
  conference: string | null;
  location: string | null;
  coach_name: string | null;
  coach_email: string | null;
  roster_summary: string | null;
  research_output: SchoolResearchOutput;
}

export interface SchoolInsert {
  athlete_id: UUID;
  name: string;
  sport?: "basketball";
  division: Division;
  conference?: string | null;
  location?: string | null;
  coach_name?: string | null;
  coach_email?: string | null;
  roster_summary?: string | null;
  research_output: SchoolResearchOutput;
}

export interface SchoolUpdate {
  name?: string;
  sport?: "basketball";
  division?: Division;
  conference?: string | null;
  location?: string | null;
  coach_name?: string | null;
  coach_email?: string | null;
  roster_summary?: string | null;
  research_output?: SchoolResearchOutput;
}

export interface Outreach extends TimestampFields {
  id: UUID;
  athlete_id: UUID;
  school_id: UUID;
  report_id: UUID;
  subject: string;
  body: string;
  status: OutreachStatus;
  resend_email_id: string | null;
  sent_at: ISODateString | null;
  opened_at: ISODateString | null;
  replied_at: ISODateString | null;
  followup_count: number;
}

export interface OutreachInsert {
  athlete_id: UUID;
  school_id: UUID;
  report_id: UUID;
  subject: string;
  body: string;
  status?: OutreachStatus;
  resend_email_id?: string | null;
  sent_at?: ISODateString | null;
  opened_at?: ISODateString | null;
  replied_at?: ISODateString | null;
  followup_count?: number;
}

export interface OutreachUpdate {
  subject?: string;
  body?: string;
  status?: OutreachStatus;
  resend_email_id?: string | null;
  sent_at?: ISODateString | null;
  opened_at?: ISODateString | null;
  replied_at?: ISODateString | null;
  followup_count?: number;
}

export interface Profile extends TimestampFields {
  id: UUID;
  athlete_id: UUID;
  is_public: boolean;
  headline: string | null;
  featured_report_id: UUID | null;
  slug: string;
}

export interface ProfileInsert {
  athlete_id: UUID;
  is_public?: boolean;
  headline?: string | null;
  featured_report_id?: UUID | null;
  slug: string;
}

export interface ProfileUpdate {
  is_public?: boolean;
  headline?: string | null;
  featured_report_id?: UUID | null;
  slug?: string;
}

// R wraps each Row/Insert/Update with Record<string,unknown> so they satisfy
// GenericTable's constraint — required for SupabaseClient generic to resolve.
type R<T> = T & Record<string, unknown>;

export interface Database {
  public: {
    Tables: {
      athletes: {
        Row: R<Athlete>;
        Insert: R<AthleteInsert>;
        Update: R<AthleteUpdate>;
        Relationships: [];
      };
      reports: {
        Row: R<Report>;
        Insert: R<ReportInsert>;
        Update: R<ReportUpdate>;
        Relationships: [];
      };
      schools: {
        Row: R<School>;
        Insert: R<SchoolInsert>;
        Update: R<SchoolUpdate>;
        Relationships: [];
      };
      outreach: {
        Row: R<Outreach>;
        Insert: R<OutreachInsert>;
        Update: R<OutreachUpdate>;
        Relationships: [];
      };
      profiles: {
        Row: R<Profile>;
        Insert: R<ProfileInsert>;
        Update: R<ProfileUpdate>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}

export interface FilmAnalysisRequest {
  athlete_id: UUID;
  sport: "basketball";
  context: FilmContext;
  source_file_name: string;
}

export interface FilmAnalysisResult {
  athlete_id: UUID;
  sport: "basketball";
  context: FilmContext;
  status: AgentFlowStatus;
  analyzed_at: ISODateString;
  frame_count: number;
  keypoint_frames: PoseFrame[];
  metrics: BasketballMetrics;
}

export interface ReportGenerationRequest {
  athlete: Athlete;
  analysis: FilmAnalysisResult;
}

export interface ReportGenerationResult {
  status: AgentFlowStatus;
  report: ReportInsert;
}

export interface SchoolResearchRequest {
  athlete: Athlete;
  target_schools: string[];
}

export interface SchoolResearchResult {
  athlete_id: UUID;
  status: AgentFlowStatus;
  schools: SchoolInsert[];
}

export interface EmailDraftPersonalization {
  roster_need_references: string[];
  metric_references: string[];
  profile_highlights: string[];
}

export interface EmailDraft {
  school_id: UUID;
  subject: string;
  body: string;
  personalization: EmailDraftPersonalization;
}

export interface EmailDraftRequest {
  athlete: Athlete;
  featured_report: Report;
  schools: School[];
}

export interface EmailDraftResult {
  athlete_id: UUID;
  status: AgentFlowStatus;
  drafts: Array<
    OutreachInsert & {
      personalization: EmailDraftPersonalization;
    }
  >;
}

export interface OutreachSendRequest {
  outreach_ids: UUID[];
}

export interface OutreachSendReceipt {
  outreach_id: UUID;
  resend_email_id: string;
  sent_at: ISODateString;
  status: "sent";
}

export interface OutreachSendResult {
  athlete_id: UUID;
  status: AgentFlowStatus;
  receipts: OutreachSendReceipt[];
}

export type ResendWebhookEventType = "delivered" | "opened" | "replied";

export interface ResendWebhookEvent {
  type: ResendWebhookEventType;
  resend_email_id: string;
  occurred_at: ISODateString;
  provider_payload: JsonObject;
}

export interface OutreachTrackingUpdate {
  outreach_id: UUID;
  status: "sent" | "opened" | "replied";
  sent_at?: ISODateString | null;
  opened_at?: ISODateString | null;
  replied_at?: ISODateString | null;
}

export interface FollowupRequest {
  athlete: Athlete;
  school: School;
  report: Report;
  outreach: Outreach;
  days_since_sent: number;
}

export interface FollowupDraft {
  subject: string;
  body: string;
  rationale: string;
}

export interface FollowupResult {
  outreach_id: UUID;
  status: "followup_sent";
  sent_at: ISODateString;
  followup_count: number;
  followup: FollowupDraft;
}

export interface PublicProfileView {
  profile: Profile;
  athlete: Athlete;
  featured_report: Report | null;
}
