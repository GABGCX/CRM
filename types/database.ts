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
      audit_log: {
        Row: {
          id: string
          org_id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          payload: Json | null
          ip: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          payload?: Json | null
          ip?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          payload?: Json | null
          ip?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cadence_steps: {
        Row: {
          id: string
          cadence_id: string
          step_order: number
          day_offset: number
          channel: string
          instruction: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cadence_id: string
          step_order: number
          day_offset: number
          channel: string
          instruction?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cadence_id?: string
          step_order?: number
          day_offset?: number
          channel?: string
          instruction?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          }
        ]
      }
      cadences: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_diary: {
        Row: {
          id: string
          org_id: string
          user_id: string
          date: string
          ce: number
          rm: number
          rr: number
          fr: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          date: string
          ce?: number
          rm?: number
          rr?: number
          fr?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          date?: string
          ce?: number
          rm?: number
          rr?: number
          fr?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_diary_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_diary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      followups: {
        Row: {
          id: string
          lead_id: string
          org_id: string
          attempt_index: number
          completed_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          org_id: string
          attempt_index: number
          completed_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          org_id?: string
          attempt_index?: number
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          org_id: string
          user_id: string | null
          type: string
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          org_id: string
          user_id?: string | null
          type: string
          payload?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          org_id?: string
          user_id?: string | null
          type?: string
          payload?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          org_id: string
          user_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          org_id: string
          user_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          org_id?: string
          user_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          org_id: string
          owner_id: string
          decisor: string
          telefone: string | null
          negocio: string | null
          instagram: string | null
          num_vendedores: number | null
          nome_ponte: string | null
          resultado: string
          data_retorno: string | null
          reuniao_agendada: boolean
          turno: string | null
          horario: string | null
          info: string | null
          created_at: string
          updated_at: string
          fonte: string | null
          segmento: string | null
          cidade: string | null
          estado: string | null
          porte: string | null
          proposta_url: string | null
          cadence_id: string | null
          cadence_started_at: string | null
          motivo_perda: string | null
          valor_estimado: number | null
          tag_ids: string[]
        }
        Insert: {
          id?: string
          org_id: string
          owner_id: string
          decisor?: string
          telefone?: string | null
          negocio?: string | null
          instagram?: string | null
          num_vendedores?: number | null
          nome_ponte?: string | null
          resultado?: string
          data_retorno?: string | null
          reuniao_agendada?: boolean
          turno?: string | null
          horario?: string | null
          info?: string | null
          created_at?: string
          updated_at?: string
          fonte?: string | null
          segmento?: string | null
          cidade?: string | null
          estado?: string | null
          porte?: string | null
          proposta_url?: string | null
          cadence_id?: string | null
          cadence_started_at?: string | null
          motivo_perda?: string | null
          valor_estimado?: number | null
          tag_ids?: string[]
        }
        Update: {
          id?: string
          org_id?: string
          owner_id?: string
          decisor?: string
          telefone?: string | null
          negocio?: string | null
          instagram?: string | null
          num_vendedores?: number | null
          nome_ponte?: string | null
          resultado?: string
          data_retorno?: string | null
          reuniao_agendada?: boolean
          turno?: string | null
          horario?: string | null
          info?: string | null
          created_at?: string
          updated_at?: string
          fonte?: string | null
          segmento?: string | null
          cidade?: string | null
          estado?: string | null
          porte?: string | null
          proposta_url?: string | null
          cadence_id?: string | null
          cadence_started_at?: string | null
          motivo_perda?: string | null
          valor_estimado?: number | null
          tag_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "leads_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      management_notes: {
        Row: {
          id: string
          org_id: string
          bdr_id: string
          author_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          bdr_id: string
          author_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          bdr_id?: string
          author_id?: string | null
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      bdr_goals: {
        Row: {
          id: string
          org_id: string
          user_id: string
          meta_mensal: number
          ticket_medio: number
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          meta_mensal?: number
          ticket_medio?: number
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          meta_mensal?: number
          ticket_medio?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          org_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          color?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      message_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          channel: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          channel?: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          channel?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          slug: string
          name: string
          custom_domain: string | null
          plan: string
          theme: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          custom_domain?: string | null
          plan?: string
          theme?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          custom_domain?: string | null
          plan?: string
          theme?: Json
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          org_id: string
          name: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id: string
          name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      rate_limit_buckets: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: {
          key: string
          count?: number
          window_start?: string
        }
        Update: {
          key?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      monthly_summary: {
        Row: {
          org_id: string | null
          user_id: string | null
          month: string | null
          total_ce: number | null
          total_rm: number | null
          total_rr: number | null
          total_fr: number | null
          days_recorded: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {}
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
