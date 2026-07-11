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
          cota_ufu: string | null
          created_at: string
          curso_ufu: string | null
          diagnostico_feito_at: string | null
          email: string
          enem_target_date: string | null
          flexible_quota: boolean
          id: string
          name: string | null
          onboarding_completed: boolean
          phone: string | null
          placar_estimado: number | null
          placar_fonte: string | null
          plan_started_at: string
          plan_type: string
          ufu_passe_ativo: boolean
          ufu_passe_expira_em: string | null
        }
        Insert: {
          avatar_url?: string | null
          cota_ufu?: string | null
          created_at?: string
          curso_ufu?: string | null
          diagnostico_feito_at?: string | null
          email: string
          enem_target_date?: string | null
          flexible_quota?: boolean
          id: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          placar_estimado?: number | null
          placar_fonte?: string | null
          plan_started_at?: string
          plan_type?: string
          ufu_passe_ativo?: boolean
          ufu_passe_expira_em?: string | null
        }
        Update: {
          avatar_url?: string | null
          cota_ufu?: string | null
          created_at?: string
          curso_ufu?: string | null
          diagnostico_feito_at?: string | null
          email?: string
          enem_target_date?: string | null
          flexible_quota?: boolean
          id?: string
          name?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          placar_estimado?: number | null
          placar_fonte?: string | null
          plan_started_at?: string
          plan_type?: string
          ufu_passe_ativo?: boolean
          ufu_passe_expira_em?: string | null
        }
        Relationships: []
      }
      push_log: {
        Row: {
          id: string
          sent_at: string
          tipo: string
          user_id: string
        }
        Insert: {
          id?: string
          sent_at?: string
          tipo: string
          user_id: string
        }
        Update: {
          id?: string
          sent_at?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          created_at: string
          extra_session: boolean
          id: string
          is_correct: boolean
          question_id: string
          response_time_ms: number | null
          selected_answer: string | null
          session_date: string
          simulado_session: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          extra_session?: boolean
          id?: string
          is_correct?: boolean
          question_id: string
          response_time_ms?: number | null
          selected_answer?: string | null
          session_date?: string
          simulado_session?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          extra_session?: boolean
          id?: string
          is_correct?: boolean
          question_id?: string
          response_time_ms?: number | null
          selected_answer?: string | null
          session_date?: string
          simulado_session?: boolean
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
      question_flashcard_cache: {
        Row: {
          back: string
          created_at: string
          front: string
          id: string
          question_id: string
        }
        Insert: {
          back: string
          created_at?: string
          front: string
          id?: string
          question_id: string
        }
        Update: {
          back?: string
          created_at?: string
          front?: string
          id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_flashcard_cache_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_pedagogy: {
        Row: {
          cognitive_pattern: string | null
          created_at: string
          deep_lesson: string | null
          id: string
          pre_concept: Json | null
          question_id: string
          video_suggestions: Json | null
        }
        Insert: {
          cognitive_pattern?: string | null
          created_at?: string
          deep_lesson?: string | null
          id?: string
          pre_concept?: Json | null
          question_id: string
          video_suggestions?: Json | null
        }
        Update: {
          cognitive_pattern?: string | null
          created_at?: string
          deep_lesson?: string | null
          id?: string
          pre_concept?: Json | null
          question_id?: string
          video_suggestions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "question_pedagogy_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          alternatives: Json
          area: string
          classified_at: string | null
          classifier_version: string | null
          cognitive_level: string | null
          command: string | null
          confidence: number | null
          content: Json | null
          correct_answer: string
          created_at: string
          day: number | null
          difficulty: number
          disciplina: string | null
          exam: string
          explanation: string | null
          foreign_language: string | null
          id: string
          image_url: string | null
          images: Json
          needs_review: boolean
          number: number
          skills: Json
          statement: string
          subtopic: string
          tags: Json
          topic: string
          topics: string[] | null
          user_id: string
          year: number
        }
        Insert: {
          alternatives?: Json
          area: string
          classified_at?: string | null
          classifier_version?: string | null
          cognitive_level?: string | null
          command?: string | null
          confidence?: number | null
          content?: Json | null
          correct_answer: string
          created_at?: string
          day?: number | null
          difficulty?: number
          disciplina?: string | null
          exam?: string
          explanation?: string | null
          foreign_language?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          needs_review?: boolean
          number: number
          skills?: Json
          statement: string
          subtopic?: string
          tags?: Json
          topic?: string
          topics?: string[] | null
          user_id: string
          year: number
        }
        Update: {
          alternatives?: Json
          area?: string
          classified_at?: string | null
          classifier_version?: string | null
          cognitive_level?: string | null
          command?: string | null
          confidence?: number | null
          content?: Json | null
          correct_answer?: string
          created_at?: string
          day?: number | null
          difficulty?: number
          disciplina?: string | null
          exam?: string
          explanation?: string | null
          foreign_language?: string | null
          id?: string
          image_url?: string | null
          images?: Json
          needs_review?: boolean
          number?: number
          skills?: Json
          statement?: string
          subtopic?: string
          tags?: Json
          topic?: string
          topics?: string[] | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      streak_freezes: {
        Row: {
          created_at: string
          id: string
          iso_week: string
          used_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          iso_week: string
          used_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          iso_week?: string
          used_on?: string
          user_id?: string
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
          is_extra: boolean
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
          is_extra?: boolean
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
          is_extra?: boolean
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
      trilha_itens: {
        Row: {
          created_at: string
          id: string
          needs_review: boolean
          nivel: number
          no_id: string
          ordem: number
          payload: Json
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          needs_review?: boolean
          nivel: number
          no_id: string
          ordem: number
          payload: Json
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          needs_review?: boolean
          nivel?: number
          no_id?: string
          ordem?: number
          payload?: Json
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilha_itens_no_id_fkey"
            columns: ["no_id"]
            isOneToOne: false
            referencedRelation: "trilha_nos"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_nos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          disciplina: string
          id: string
          nivel_max: number
          ordem: number
          peso_info: Json | null
          pre_requisitos: string[]
          titulo: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          disciplina: string
          id: string
          nivel_max?: number
          ordem?: number
          peso_info?: Json | null
          pre_requisitos?: string[]
          titulo: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          disciplina?: string
          id?: string
          nivel_max?: number
          ordem?: number
          peso_info?: Json | null
          pre_requisitos?: string[]
          titulo?: string
        }
        Relationships: []
      }
      trilha_progresso: {
        Row: {
          dourado: boolean
          nivel_atual: number
          no_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          dourado?: boolean
          nivel_atual?: number
          no_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          dourado?: boolean
          nivel_atual?: number
          no_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilha_progresso_no_id_fkey"
            columns: ["no_id"]
            isOneToOne: false
            referencedRelation: "trilha_nos"
            referencedColumns: ["id"]
          },
        ]
      }
      trilha_respostas: {
        Row: {
          acertou_primeira: boolean
          created_at: string
          id: string
          item_id: string
          tentativas: number
          user_id: string
        }
        Insert: {
          acertou_primeira: boolean
          created_at?: string
          id?: string
          item_id: string
          tentativas?: number
          user_id: string
        }
        Update: {
          acertou_primeira?: boolean
          created_at?: string
          id?: string
          item_id?: string
          tentativas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trilha_respostas_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "trilha_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      ufu_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ufu_correcoes_uso: {
        Row: {
          created_at: string
          id: string
          user_id: string
          via_passe: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          via_passe?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          via_passe?: boolean
        }
        Relationships: []
      }
      ufu_creditos: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          qtd: number
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          qtd: number
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          qtd?: number
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ufu_diagnostico_questoes: {
        Row: {
          alternativas: Json
          ano: number | null
          area: string
          ativo: boolean
          correta: string
          created_at: string
          gabarito_comentado: string | null
          id: string
          prova: string | null
          statement: string
          updated_at: string
        }
        Insert: {
          alternativas: Json
          ano?: number | null
          area: string
          ativo?: boolean
          correta: string
          created_at?: string
          gabarito_comentado?: string | null
          id?: string
          prova?: string | null
          statement: string
          updated_at?: string
        }
        Update: {
          alternativas?: Json
          ano?: number | null
          area?: string
          ativo?: boolean
          correta?: string
          created_at?: string
          gabarito_comentado?: string | null
          id?: string
          prova?: string | null
          statement?: string
          updated_at?: string
        }
        Relationships: []
      }
      ufu_events: {
        Row: {
          created_at: string
          event: string
          id: string
          payload: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ufu_leads: {
        Row: {
          created_at: string
          curso: string | null
          email: string
          id: string
          origem: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          curso?: string | null
          email: string
          id?: string
          origem?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          curso?: string | null
          email?: string
          id?: string
          origem?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_mastery: {
        Row: {
          attempts: number
          avg_time_sec: number | null
          correct: number
          dimension_id: string
          dimension_type: string
          id: string
          mastery_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          avg_time_sec?: number | null
          correct?: number
          dimension_id: string
          dimension_type: string
          id?: string
          mastery_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          avg_time_sec?: number | null
          correct?: number
          dimension_id?: string
          dimension_type?: string
          id?: string
          mastery_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          daily_minutes_target: number
          daily_questions_target: number | null
          day_schedule: Json | null
          focus_areas: string[] | null
          foreign_language: string | null
          id: string
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_minutes_target?: number
          daily_questions_target?: number | null
          day_schedule?: Json | null
          focus_areas?: string[] | null
          foreign_language?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_minutes_target?: number
          daily_questions_target?: number | null
          day_schedule?: Json | null
          focus_areas?: string[] | null
          foreign_language?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_question_history: {
        Row: {
          answer: string
          attempted_at: string
          id: string
          is_correct: boolean
          question_id: string
          time_spent_sec: number | null
          user_id: string
        }
        Insert: {
          answer: string
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          time_spent_sec?: number | null
          user_id: string
        }
        Update: {
          answer?: string
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          time_spent_sec?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_history_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
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
      user_topic_profile: {
        Row: {
          area: string
          attempts: number
          correct: number
          correct_streak: number
          dont_know: number
          id: string
          last_attempt_at: string | null
          level: number
          next_review_at: string | null
          priority_score: number
          subtopic: string
          topic: string
          updated_at: string
          user_id: string
          wrong: number
        }
        Insert: {
          area: string
          attempts?: number
          correct?: number
          correct_streak?: number
          dont_know?: number
          id?: string
          last_attempt_at?: string | null
          level?: number
          next_review_at?: string | null
          priority_score?: number
          subtopic?: string
          topic: string
          updated_at?: string
          user_id: string
          wrong?: number
        }
        Update: {
          area?: string
          attempts?: number
          correct?: number
          correct_streak?: number
          dont_know?: number
          id?: string
          last_attempt_at?: string | null
          level?: number
          next_review_at?: string | null
          priority_score?: number
          subtopic?: string
          topic?: string
          updated_at?: string
          user_id?: string
          wrong?: number
        }
        Relationships: []
      }
      vip_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      ufu_celebracao: {
        Row: {
          pct_pulo: number | null
          puladas: number | null
          tela: string | null
          vistas: number | null
        }
        Relationships: []
      }
      ufu_funil_sessao: {
        Row: {
          abandonos: number | null
          dia: string | null
          fins: number | null
          inicios: number | null
          media_pct_primeira: number | null
          pct_conclusao: number | null
        }
        Relationships: []
      }
      ufu_push_eficacia: {
        Row: {
          cliques: number | null
          destinatarios: number | null
          dia: string | null
          enviados: number | null
          tipo: string | null
        }
        Relationships: []
      }
      ufu_retencao_d1: {
        Row: {
          dia: string | null
          pct: number | null
          retornaram: number | null
          usuarios: number | null
        }
        Relationships: []
      }
      ufu_retencao_d7: {
        Row: {
          dia: string | null
          pct: number | null
          retornaram: number | null
          usuarios: number | null
        }
        Relationships: []
      }
      ufu_share_rate: {
        Row: {
          card_generated: number | null
          card_shares: number | null
          share_rate_pct: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ufu_correcoes_saldo: { Args: { p_user: string }; Returns: number }
      ufu_leads_count: { Args: never; Returns: number }
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
