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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_actions: {
        Row: {
          action_type: string
          created_at: string
          id: string
          pod_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          pod_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          pod_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_responses: {
        Row: {
          answers: Json
          assessment_id: string
          id: string
          score: number | null
          student_name: string | null
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          assessment_id: string
          id?: string
          score?: number | null
          student_name?: string | null
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          assessment_id?: string
          id?: string
          score?: number | null
          student_name?: string | null
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "nexus_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title: string
          updated_at?: string
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
          user_role?: string
        }
        Relationships: []
      }
      educator_messages: {
        Row: {
          created_at: string | null
          educator_id: string
          id: string
          is_read: boolean | null
          learner_id: string
          message: string
          replied_at: string | null
          reply: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          educator_id: string
          id?: string
          is_read?: boolean | null
          learner_id: string
          message: string
          replied_at?: string | null
          reply?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          educator_id?: string
          id?: string
          is_read?: boolean | null
          learner_id?: string
          message?: string
          replied_at?: string | null
          reply?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      flashcard_cards: {
        Row: {
          card_order: number
          content: string
          created_at: string | null
          flashcard_set_id: string
          hint: string
          id: string
        }
        Insert: {
          card_order: number
          content: string
          created_at?: string | null
          flashcard_set_id: string
          hint: string
          id?: string
        }
        Update: {
          card_order?: number
          content?: string
          created_at?: string | null
          flashcard_set_id?: string
          hint?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_cards_flashcard_set_id_fkey"
            columns: ["flashcard_set_id"]
            isOneToOne: false
            referencedRelation: "pod_flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_recordings: {
        Row: {
          attempt_number: number
          created_at: string
          duration_seconds: number | null
          id: string
          question_index: number
          question_text: string
          session_id: string
          time_limit_seconds: number
          video_url: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          question_index: number
          question_text: string
          session_id: string
          time_limit_seconds: number
          video_url: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_seconds?: number | null
          id?: string
          question_index?: number
          question_text?: string
          session_id?: string
          time_limit_seconds?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          id: string
          job_description: string | null
          job_role_link: string | null
          num_questions: number
          questions: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_description?: string | null
          job_role_link?: string | null
          num_questions?: number
          questions?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_description?: string | null
          job_role_link?: string | null
          num_questions?: number
          questions?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_chats: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "learning_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      live_meetings: {
        Row: {
          ended_at: string | null
          id: string
          pod_id: string
          started_at: string
          started_by: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          pod_id: string
          started_at?: string
          started_by: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          pod_id?: string
          started_at?: string
          started_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_meetings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      material_submissions: {
        Row: {
          file_name: string
          file_type: string
          file_url: string
          id: string
          material_id: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          file_name: string
          file_type: string
          file_url: string
          id?: string
          material_id: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          material_id?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_submissions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "pod_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string
          file_type: string
          file_url: string
          id: string
          pod_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          pod_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          pod_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean
          meeting_link: string
          pod_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean
          meeting_link: string
          pod_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean
          meeting_link?: string
          pod_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_assessments: {
        Row: {
          assessment_type: string
          created_at: string
          curriculum: string
          id: string
          num_questions: number
          public_link_code: string
          questions: Json
          subject: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at: string
          year_level: string
        }
        Insert: {
          assessment_type: string
          created_at?: string
          curriculum: string
          id?: string
          num_questions: number
          public_link_code?: string
          questions?: Json
          subject: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at?: string
          year_level: string
        }
        Update: {
          assessment_type?: string
          created_at?: string
          curriculum?: string
          id?: string
          num_questions?: number
          public_link_code?: string
          questions?: Json
          subject?: string
          teacher_id?: string
          title?: string
          total_marks?: number
          updated_at?: string
          year_level?: string
        }
        Relationships: []
      }
      personal_flashcard_cards: {
        Row: {
          card_order: number
          content: string
          created_at: string | null
          flashcard_set_id: string
          hint: string
          id: string
        }
        Insert: {
          card_order: number
          content: string
          created_at?: string | null
          flashcard_set_id: string
          hint: string
          id?: string
        }
        Update: {
          card_order?: number
          content?: string
          created_at?: string | null
          flashcard_set_id?: string
          hint?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_flashcard_cards_flashcard_set_id_fkey"
            columns: ["flashcard_set_id"]
            isOneToOne: false
            referencedRelation: "personal_flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_flashcards: {
        Row: {
          archived: boolean
          card_count: number
          created_at: string | null
          curriculum: string
          id: string
          subtopic: string | null
          title: string
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          card_count?: number
          created_at?: string | null
          curriculum: string
          id?: string
          subtopic?: string | null
          title: string
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean
          card_count?: number
          created_at?: string | null
          curriculum?: string
          id?: string
          subtopic?: string | null
          title?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          additional_details: string | null
          archived: boolean
          content: string
          created_at: string
          curriculum: string
          id: string
          subtopic: string | null
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_details?: string | null
          archived?: boolean
          content: string
          created_at?: string
          curriculum: string
          id?: string
          subtopic?: string | null
          title: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_details?: string | null
          archived?: boolean
          content?: string
          created_at?: string
          curriculum?: string
          id?: string
          subtopic?: string | null
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      personal_quizzes: {
        Row: {
          archived: boolean
          created_at: string | null
          curriculum: string | null
          id: string
          questions: Json
          quiz_type: string
          subject: string | null
          subtopic: string | null
          title: string
          topic: string | null
          user_id: string
          year_level: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          curriculum?: string | null
          id?: string
          questions?: Json
          quiz_type: string
          subject?: string | null
          subtopic?: string | null
          title: string
          topic?: string | null
          user_id: string
          year_level?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          curriculum?: string | null
          id?: string
          questions?: Json
          quiz_type?: string
          subject?: string | null
          subtopic?: string | null
          title?: string
          topic?: string | null
          user_id?: string
          year_level?: string | null
        }
        Relationships: []
      }
      phoenix_sessions: {
        Row: {
          created_at: string | null
          id: string
          session_transcript: Json | null
          title: string
          updated_at: string | null
          user_id: string
          whiteboard_state: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_transcript?: Json | null
          title?: string
          updated_at?: string | null
          user_id: string
          whiteboard_state?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          session_transcript?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
          whiteboard_state?: Json | null
        }
        Relationships: []
      }
      pod_flashcards: {
        Row: {
          card_count: number
          created_at: string | null
          created_by: string
          curriculum: string
          id: string
          pod_id: string
          subtopic: string | null
          title: string
          topic: string
          updated_at: string | null
        }
        Insert: {
          card_count?: number
          created_at?: string | null
          created_by: string
          curriculum: string
          id?: string
          pod_id: string
          subtopic?: string | null
          title: string
          topic: string
          updated_at?: string | null
        }
        Update: {
          card_count?: number
          created_at?: string | null
          created_by?: string
          curriculum?: string
          id?: string
          pod_id?: string
          subtopic?: string | null
          title?: string
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_flashcards_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_materials: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          pod_id: string
          title: string
          uploaded_by: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          pod_id: string
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          pod_id?: string
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_materials_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_members: {
        Row: {
          id: string
          joined_at: string
          pod_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          pod_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          pod_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_members_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          pod_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          pod_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          pod_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_messages_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_notes: {
        Row: {
          additional_details: string | null
          archived: boolean | null
          color: string | null
          content: string
          created_at: string
          curriculum: string
          id: string
          pod_id: string
          subtopic: string | null
          title: string
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_details?: string | null
          archived?: boolean | null
          color?: string | null
          content: string
          created_at?: string
          curriculum: string
          id?: string
          pod_id: string
          subtopic?: string | null
          title: string
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_details?: string | null
          archived?: boolean | null
          color?: string | null
          content?: string
          created_at?: string
          curriculum?: string
          id?: string
          pod_id?: string
          subtopic?: string | null
          title?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pod_notes_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pod_quizzes: {
        Row: {
          archived: boolean
          created_at: string
          created_by: string
          curriculum: string | null
          id: string
          pod_id: string
          questions: Json
          quiz_type: string
          subject: string | null
          subtopic: string | null
          title: string
          topic: string | null
          year_level: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          created_by: string
          curriculum?: string | null
          id?: string
          pod_id: string
          questions?: Json
          quiz_type: string
          subject?: string | null
          subtopic?: string | null
          title: string
          topic?: string | null
          year_level?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          created_by?: string
          curriculum?: string | null
          id?: string
          pod_id?: string
          questions?: Json
          quiz_type?: string
          subject?: string | null
          subtopic?: string | null
          title?: string
          topic?: string | null
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pod_quizzes_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      pods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          pod_code: string
          subject: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          pod_code: string
          subject: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          pod_code?: string
          subject?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_submissions: {
        Row: {
          ai_feedback: string | null
          id: string
          project_id: string
          submission_text: string | null
          submission_url: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          id?: string
          project_id: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          id?: string
          project_id?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          pod_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          id?: string
          pod_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          pod_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          quiz_id: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: Json
          id: string
          quiz_id: string
          score: number | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          quiz_id: string
          score?: number | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          id?: string
          quiz_id?: string
          score?: number | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "pod_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          pod_id: string
          published: boolean | null
          questions: Json
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          pod_id: string
          published?: boolean | null
          questions: Json
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          pod_id?: string
          published?: boolean | null
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_curriculums: {
        Row: {
          created_at: string
          curriculum_content: string
          duration: string
          grade_level: string
          id: string
          learning_goals: string | null
          subject: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_content: string
          duration: string
          grade_level: string
          id?: string
          learning_goals?: string | null
          subject: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_content?: string
          duration?: string
          grade_level?: string
          id?: string
          learning_goals?: string | null
          subject?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_lessons: {
        Row: {
          created_at: string
          curriculum: string
          duration: string
          grade_level: string
          id: string
          lesson_content: string
          subject: string
          teacher_id: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum: string
          duration: string
          grade_level: string
          id?: string
          lesson_content: string
          subject: string
          teacher_id: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum?: string
          duration?: string
          grade_level?: string
          id?: string
          lesson_content?: string
          subject?: string
          teacher_id?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          ai_recap: string | null
          created_at: string
          ended_at: string | null
          id: string
          pod_id: string
          started_at: string
          title: string
        }
        Insert: {
          ai_recap?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          pod_id: string
          started_at?: string
          title: string
        }
        Update: {
          ai_recap?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          pod_id?: string
          started_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          qualifications: Json | null
          subjects_expertise: string[] | null
          teaching_experience: string | null
          updated_at: string
          user_id: string
          years_experience: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          qualifications?: Json | null
          subjects_expertise?: string[] | null
          teaching_experience?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          qualifications?: Json | null
          subjects_expertise?: string[] | null
          teaching_experience?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number
        }
        Relationships: []
      }
      teaching_resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          download_count: number | null
          external_link: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          download_count?: number | null
          external_link?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          download_count?: number | null
          external_link?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      whiteboards: {
        Row: {
          created_at: string
          created_by: string
          id: string
          pod_id: string
          title: string
          updated_at: string
          whiteboard_data: Json | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          pod_id: string
          title: string
          updated_at?: string
          whiteboard_data?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          pod_id?: string
          title?: string
          updated_at?: string
          whiteboard_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whiteboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whiteboards_pod_id_fkey"
            columns: ["pod_id"]
            isOneToOne: false
            referencedRelation: "pods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_pod_limit: { Args: { _user_id: string }; Returns: boolean }
      check_quiz_limit: {
        Args: { pod_id: string; teacher_id: string }
        Returns: boolean
      }
      has_pod_access: {
        Args: { _pod_id: string; _user_id: string }
        Returns: boolean
      }
      is_pod_member: {
        Args: { _pod_id: string; _user_id: string }
        Returns: boolean
      }
      is_pod_teacher: {
        Args: { _pod_id: string; _user_id: string }
        Returns: boolean
      }
      is_teach_plus_educator: { Args: { _user_id: string }; Returns: boolean }
      join_pod_with_code: { Args: { code: string }; Returns: string }
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
