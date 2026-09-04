export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address_line: string
          city: string
          country: string
          created_at: string
          created_by: string | null
          elevator_count: number
          id: string
          location: unknown
          metro_code: string
          name: string
          postal_code: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line: string
          city: string
          country?: string
          created_at?: string
          created_by?: string | null
          elevator_count?: number
          id?: string
          location: unknown
          metro_code: string
          name: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string
          city?: string
          country?: string
          created_at?: string
          created_by?: string | null
          elevator_count?: number
          id?: string
          location?: unknown
          metro_code?: string
          name?: string
          postal_code?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buildings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          id: string
          issued_at: string
          metro_code: string
          rating_id: string
          render_path: string | null
          sequence: number
          serial: string
          share_count: number
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          issued_at?: string
          metro_code: string
          rating_id: string
          render_path?: string | null
          sequence: number
          serial: string
          share_count?: number
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          issued_at?: string
          metro_code?: string
          rating_id?: string
          render_path?: string | null
          sequence?: number
          serial?: string
          share_count?: number
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "certificates_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: true
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: true
            referencedRelation: "visible_ratings"
            referencedColumns: ["id"]
          },
        ]
      }
      elevators: {
        Row: {
          building_id: string
          capacity_lb: number | null
          created_at: string
          created_by: string | null
          current_band: string | null
          floors_served: number | null
          id: string
          install_year: string | null
          label: string
          manufacturer: string | null
          model: string | null
          rating_count: number
          score_avg: number | null
          updated_at: string
        }
        Insert: {
          building_id: string
          capacity_lb?: number | null
          created_at?: string
          created_by?: string | null
          current_band?: string | null
          floors_served?: number | null
          id?: string
          install_year?: string | null
          label: string
          manufacturer?: string | null
          model?: string | null
          rating_count?: number
          score_avg?: number | null
          updated_at?: string
        }
        Update: {
          building_id?: string
          capacity_lb?: number | null
          created_at?: string
          created_by?: string | null
          current_band?: string | null
          floors_served?: number | null
          id?: string
          install_year?: string | null
          label?: string
          manufacturer?: string | null
          model?: string | null
          rating_count?: number
          score_avg?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elevators_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elevators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metro_sequences: {
        Row: {
          created_at: string
          last_value: number
          metro_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          last_value?: number
          metro_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          last_value?: number
          metro_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          blurhash: string | null
          caption: string | null
          created_at: string
          elevator_id: string
          height: number | null
          id: string
          is_hidden: boolean
          moderation_status: string
          rating_id: string | null
          storage_path: string
          updated_at: string
          uploader_id: string | null
          width: number | null
        }
        Insert: {
          blurhash?: string | null
          caption?: string | null
          created_at?: string
          elevator_id: string
          height?: number | null
          id?: string
          is_hidden?: boolean
          moderation_status?: string
          rating_id?: string | null
          storage_path: string
          updated_at?: string
          uploader_id?: string | null
          width?: number | null
        }
        Update: {
          blurhash?: string | null
          caption?: string | null
          created_at?: string
          elevator_id?: string
          height?: number | null
          id?: string
          is_hidden?: boolean
          moderation_status?: string
          rating_id?: string | null
          storage_path?: string
          updated_at?: string
          uploader_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_elevator_id_fkey"
            columns: ["elevator_id"]
            isOneToOne: false
            referencedRelation: "elevators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "visible_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          handle: string
          home_metro: string
          id: string
          inspection_count: number
          is_suspended: boolean
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          handle: string
          home_metro?: string
          id: string
          inspection_count?: number
          is_suspended?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          handle?: string
          home_metro?: string
          id?: string
          inspection_count?: number
          is_suspended?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          author_id: string | null
          band: string | null
          character: number
          created_at: string
          elevator_id: string
          id: string
          inspected_on: string
          is_hidden: boolean
          moderation_reason: string | null
          moderation_status: string
          remark_1: string | null
          remark_2: string | null
          score: number | null
          smooth: number
          speedy: number
          spotless: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          band?: string | null
          character: number
          created_at?: string
          elevator_id: string
          id?: string
          inspected_on?: string
          is_hidden?: boolean
          moderation_reason?: string | null
          moderation_status?: string
          remark_1?: string | null
          remark_2?: string | null
          score?: number | null
          smooth: number
          speedy: number
          spotless: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          band?: string | null
          character?: number
          created_at?: string
          elevator_id?: string
          id?: string
          inspected_on?: string
          is_hidden?: boolean
          moderation_reason?: string | null
          moderation_status?: string
          remark_1?: string | null
          remark_2?: string | null
          score?: number | null
          smooth?: number
          speedy?: number
          spotless?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_elevator_id_fkey"
            columns: ["elevator_id"]
            isOneToOne: false
            referencedRelation: "elevators"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          rating_id: string
          updated_at: string
          value: number
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating_id: string
          updated_at?: string
          value?: number
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating_id?: string
          updated_at?: string
          value?: number
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "visible_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      visible_ratings: {
        Row: {
          address_line: string | null
          author_display_name: string | null
          author_handle: string | null
          author_id: string | null
          band: string | null
          building_id: string | null
          building_name: string | null
          capacity_lb: number | null
          character: number | null
          city: string | null
          created_at: string | null
          elevator_id: string | null
          elevator_label: string | null
          floors_served: number | null
          id: string | null
          inspected_on: string | null
          is_hidden: boolean | null
          issued_at: string | null
          manufacturer: string | null
          metro_code: string | null
          model: string | null
          moderation_reason: string | null
          moderation_status: string | null
          remark_1: string | null
          remark_2: string | null
          render_path: string | null
          score: number | null
          serial: string | null
          smooth: number | null
          speedy: number | null
          spotless: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "elevators_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_elevator_id_fkey"
            columns: ["elevator_id"]
            isOneToOne: false
            referencedRelation: "elevators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      band_for_score: { Args: { p_score: number }; Returns: string }
      building_detail: {
        Args: { p_building_id: string }
        Returns: {
          address_line: string
          building_avg: number
          building_id: string
          building_name: string
          capacity_lb: number
          city: string
          current_band: string
          elevator_id: string
          floors_served: number
          label: string
          manufacturer: string
          metro_code: string
          model: string
          rating_count: number
          region: string
          score_avg: number
        }[]
      }
      certificate_by_serial: {
        Args: { p_serial: string }
        Returns: {
          address_line: string | null
          author_display_name: string | null
          author_handle: string | null
          author_id: string | null
          band: string | null
          building_id: string | null
          building_name: string | null
          capacity_lb: number | null
          character: number | null
          city: string | null
          created_at: string | null
          elevator_id: string | null
          elevator_label: string | null
          floors_served: number | null
          id: string | null
          inspected_on: string | null
          is_hidden: boolean | null
          issued_at: string | null
          manufacturer: string | null
          metro_code: string | null
          model: string | null
          moderation_reason: string | null
          moderation_status: string | null
          remark_1: string | null
          remark_2: string | null
          render_path: string | null
          score: number | null
          serial: string | null
          smooth: number | null
          speedy: number | null
          spotless: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "visible_ratings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      compute_rating_score: {
        Args: {
          p_character: number
          p_smooth: number
          p_speedy: number
          p_spotless: number
        }
        Returns: number
      }
      elevator_photos: {
        Args: { limit_n?: number; p_elevator_id: string }
        Returns: {
          caption: string
          created_at: string
          height: number
          id: string
          storage_path: string
          uploader_id: string
          width: number
        }[]
      }
      is_blocked: { Args: { p_other: string }; Returns: boolean }
      next_serial: { Args: { p_metro: string }; Returns: string }
      recent_certificates: {
        Args: { limit_n?: number }
        Returns: {
          address_line: string | null
          author_display_name: string | null
          author_handle: string | null
          author_id: string | null
          band: string | null
          building_id: string | null
          building_name: string | null
          capacity_lb: number | null
          character: number | null
          city: string | null
          created_at: string | null
          elevator_id: string | null
          elevator_label: string | null
          floors_served: number | null
          id: string | null
          inspected_on: string | null
          is_hidden: boolean | null
          issued_at: string | null
          manufacturer: string | null
          metro_code: string | null
          model: string | null
          moderation_reason: string | null
          moderation_status: string | null
          remark_1: string | null
          remark_2: string | null
          render_path: string | null
          score: number | null
          serial: string | null
          smooth: number | null
          speedy: number | null
          spotless: number | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "visible_ratings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      search_elevators: {
        Args: { limit_n?: number; q: string }
        Returns: {
          address_line: string
          building_id: string
          building_name: string
          capacity_lb: number
          city: string
          current_band: string
          distance_m: number
          elevator_id: string
          floors_served: number
          label: string
          manufacturer: string
          metro_code: string
          model: string
          rating_count: number
          score_avg: number
        }[]
      }
      search_nearby_elevators: {
        Args: { lat: number; lng: number; radius_m?: number }
        Returns: {
          address_line: string
          building_id: string
          building_name: string
          capacity_lb: number
          city: string
          current_band: string
          distance_m: number
          elevator_id: string
          floors_served: number
          label: string
          manufacturer: string
          metro_code: string
          model: string
          rating_count: number
          score_avg: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

