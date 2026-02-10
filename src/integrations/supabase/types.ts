export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_themes: {
        Row: {
          context: string
          created_at: string
          date: string
          guiding_questions: Json
          id: string
          is_ai_generated: boolean
          motivating_text: string
          sources: Json | null
          structure_guide: Json
          title: string
        }
        Insert: {
          context: string
          created_at?: string
          date: string
          guiding_questions?: Json
          id?: string
          is_ai_generated?: boolean
          motivating_text: string
          sources?: Json | null
          structure_guide?: Json
          title: string
        }
        Update: {
          context?: string
          created_at?: string
          date?: string
          guiding_questions?: Json
          id?: string
          is_ai_generated?: boolean
          motivating_text?: string
          sources?: Json | null
          structure_guide?: Json
          title?: string
        }
        Relationships: []
      }
      essays: {
        Row: {
          analysis: Json | null
          analyzed_at: string | null
          blocks: Json
          created_at: string
          id: string
          theme: string
          total_score: number | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          analyzed_at?: string | null
          blocks?: Json
          created_at?: string
          id?: string
          theme: string
          total_score?: number | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          analyzed_at?: string | null
          blocks?: Json
          created_at?: string
          id?: string
          theme?: string
          total_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          rating: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          rating: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          rating?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          area: string | null
          back: string
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          next_review: string
          review_count: number
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          area?: string | null
          back: string
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          review_count?: number
          source_id?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          area?: string | null
          back?: string
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          review_count?: number
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          flexible_quota: boolean
          id: string
          name: string | null
          plan_started_at: string
          plan_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          flexible_quota?: boolean
          id: string
          name?: string | null
          plan_started_at?: string
          plan_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          flexible_quota?: boolean
          id?: string
          name?: string | null
          plan_started_at?: string
          plan_type?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          response_time_ms: number | null
          selected_answer: string | null
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          response_time_ms?: number | null
          selected_answer?: string | null
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          response_time_ms?: number | null
          selected_answer?: string | null
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          alternatives: Json
          area: string
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          number: number
          statement: string
          tags: Json
          user_id: string
          year: number
        }
        Insert: {
          alternatives?: Json
          area: string
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          number: number
          statement: string
          tags?: Json
          user_id: string
          year: number
        }
        Update: {
          alternatives?: Json
          area?: string
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          number?: number
          statement?: string
          tags?: Json
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          area: string
          correct_answers: number
          created_at: string
          duration_minutes: number
          flashcards_reviewed: number
          id: string
          questions_answered: number
          session_date: string
          user_id: string
        }
        Insert: {
          area: string
          correct_answers?: number
          created_at?: string
          duration_minutes?: number
          flashcards_reviewed?: number
          id?: string
          questions_answered?: number
          session_date?: string
          user_id: string
        }
        Update: {
          area?: string
          correct_answers?: number
          created_at?: string
          duration_minutes?: number
          flashcards_reviewed?: number
          id?: string
          questions_answered?: number
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          block_type: string | null
          completion_tokens: number
          created_at: string | null
          estimated_cost_usd: number
          id: string
          operation_type: string
          prompt_tokens: number
          total_tokens: number
        }
        Insert: {
          block_type?: string | null
          completion_tokens: number
          created_at?: string | null
          estimated_cost_usd: number
          id?: string
          operation_type: string
          prompt_tokens: number
          total_tokens: number
        }
        Update: {
          block_type?: string | null
          completion_tokens?: number
          created_at?: string | null
          estimated_cost_usd?: number
          id?: string
          operation_type?: string
          prompt_tokens?: number
          total_tokens?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
