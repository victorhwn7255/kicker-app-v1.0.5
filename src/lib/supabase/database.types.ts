/**
 * A deliberately permissive schema for the Supabase client. Content rows are
 * stored as validated JSONB and re-validated with zod at the loader boundary, so
 * the client itself does not need generated per-table types - it only needs to
 * stop inferring `never` for insert/upsert payloads. If we ever want column-level
 * type safety we can replace this with `supabase gen types`.
 */
type LooseTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: { [table: string]: LooseTable };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
