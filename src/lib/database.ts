export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          retailcrm_order_id: string;
          customer_name: string;
          phone: string | null;
          email: string | null;
          city: string | null;
          status: string;
          order_method: string | null;
          utm_source: string | null;
          total_amount: number;
          currency: string;
          item_count: number;
          items_summary: string[];
          created_at: string;
          updated_at: string;
          imported_at: string;
          last_synced_at: string;
          raw_payload: Json;
        };
        Insert: {
          retailcrm_order_id: string;
          customer_name: string;
          phone?: string | null;
          email?: string | null;
          city?: string | null;
          status: string;
          order_method?: string | null;
          utm_source?: string | null;
          total_amount: number;
          currency?: string;
          item_count?: number;
          items_summary?: string[];
          created_at: string;
          updated_at: string;
          imported_at?: string;
          last_synced_at?: string;
          raw_payload?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      sync_runs: {
        Row: {
          id: string;
          source: string;
          mode: string;
          status: string;
          started_at: string;
          finished_at: string | null;
          processed_count: number;
          inserted_count: number;
          updated_count: number;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          source?: string;
          mode: string;
          status: string;
          started_at?: string;
          finished_at?: string | null;
          processed_count?: number;
          inserted_count?: number;
          updated_count?: number;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["sync_runs"]["Insert"]>;
        Relationships: [];
      };
      order_alerts: {
        Row: {
          id: string;
          retailcrm_order_id: string;
          threshold_code: string;
          threshold_amount: number;
          telegram_chat_id: string;
          telegram_message_id: string | null;
          sent_at: string;
          payload: Json;
        };
        Insert: {
          id?: string;
          retailcrm_order_id: string;
          threshold_code: string;
          threshold_amount: number;
          telegram_chat_id: string;
          telegram_message_id?: string | null;
          sent_at?: string;
          payload?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["order_alerts"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
