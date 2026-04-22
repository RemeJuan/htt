export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_claimed: boolean;
          name: string;
          platform: string;
          slug: string;
          status: Database["public"]["Enums"]["listing_status"];
          updated_at: string;
          url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_claimed?: boolean;
          name: string;
          platform: string;
          slug: string;
          status?: Database["public"]["Enums"]["listing_status"];
          updated_at?: string;
          url: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_claimed?: boolean;
          name?: string;
          platform?: string;
          slug?: string;
          status?: Database["public"]["Enums"]["listing_status"];
          updated_at?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Enums: {
      listing_status: "draft" | "published";
    };
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ListingStatus = Database["public"]["Enums"]["listing_status"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type ListingRow = Database["public"]["Tables"]["listings"]["Row"];
export type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
export type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
