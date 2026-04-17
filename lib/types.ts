export type UUID = string;
export type ISODateString = string;

export type WaitlistUserType = "athlete" | "coach" | "parent";

export interface WaitlistEntry {
  id: UUID;
  email: string;
  user_type: WaitlistUserType | null;
  created_at: ISODateString;
}

export interface WaitlistInsert {
  email: string;
  user_type?: WaitlistUserType | null;
}

export interface WaitlistUpdate {
  email?: string;
  user_type?: WaitlistUserType | null;
}

// R wraps each Row/Insert/Update with Record<string,unknown> so they satisfy
// GenericTable's constraint — required for SupabaseClient generic to resolve.
type R<T> = T & Record<string, unknown>;

export interface Database {
  public: {
    Tables: {
      waitlist: {
        Row: R<WaitlistEntry>;
        Insert: R<WaitlistInsert>;
        Update: R<WaitlistUpdate>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
}
