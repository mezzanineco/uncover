import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          username: string | null
          avatar: string | null
          email_verified: boolean
          created_at: string
          last_login_at: string | null
          status: 'active' | 'suspended' | 'pending'
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          username?: string | null
          avatar?: string | null
          email_verified?: boolean
          created_at?: string
          last_login_at?: string | null
          status?: 'active' | 'suspended' | 'pending'
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          username?: string | null
          avatar?: string | null
          email_verified?: boolean
          created_at?: string
          last_login_at?: string | null
          status?: 'active' | 'suspended' | 'pending'
        }
      }
      organisations: {
        Row: {
          id: string
          name: string
          slug: string
          logo: string | null
          industry: string | null
          size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          created_at: string
          created_by: string
          settings: {
            allowGuestParticipants: boolean
            requireConsent: boolean
            dataRetentionDays: number
          }
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo?: string | null
          industry?: string | null
          size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          created_at?: string
          created_by: string
          settings?: {
            allowGuestParticipants: boolean
            requireConsent: boolean
            dataRetentionDays: number
          }
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo?: string | null
          industry?: string | null
          size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
          created_at?: string
          created_by?: string
          settings?: {
            allowGuestParticipants: boolean
            requireConsent: boolean
            dataRetentionDays: number
          }
        }
      }
      organisation_members: {
        Row: {
          id: string
          user_id: string
          organisation_id: string
          role: 'super_admin' | 'facilitator' | 'user_admin' | 'participant'
          status: 'active' | 'invited' | 'suspended'
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          last_active_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          organisation_id: string
          role: 'super_admin' | 'facilitator' | 'user_admin' | 'participant'
          status?: 'active' | 'invited' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          last_active_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          organisation_id?: string
          role?: 'super_admin' | 'facilitator' | 'user_admin' | 'participant'
          status?: 'active' | 'invited' | 'suspended'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          last_active_at?: string | null
        }
      }
      assessments: {
        Row: {
          id: string
          name: string
          description: string | null
          project_id: string | null
          organisation_id: string
          template_id: string
          status: 'draft' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
          invite_link: string | null
          room_code: string | null
          room_code_expiry: string | null
          max_participants: number | null
          require_consent: boolean
          allow_anonymous: boolean
          stats: {
            totalInvited: number
            totalStarted: number
            totalCompleted: number
            averageCompletionTime: number | null
          }
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          project_id?: string | null
          organisation_id: string
          template_id: string
          status?: 'draft' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
          invite_link?: string | null
          room_code?: string | null
          room_code_expiry?: string | null
          max_participants?: number | null
          require_consent?: boolean
          allow_anonymous?: boolean
          stats?: {
            totalInvited: number
            totalStarted: number
            totalCompleted: number
            averageCompletionTime: number | null
          }
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          project_id?: string | null
          organisation_id?: string
          template_id?: string
          status?: 'draft' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived'
          created_by?: string
          created_at?: string
          updated_at?: string
          invite_link?: string | null
          room_code?: string | null
          room_code_expiry?: string | null
          max_participants?: number | null
          require_consent?: boolean
          allow_anonymous?: boolean
          stats?: {
            totalInvited: number
            totalStarted: number
            totalCompleted: number
            averageCompletionTime: number | null
          }
        }
      }
      assessment_responses: {
        Row: {
          id: string
          assessment_id: string
          user_id: string | null
          participant_token: string | null
          question_id: string
          response_value: any
          response_timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          user_id?: string | null
          participant_token?: string | null
          question_id: string
          response_value: any
          response_timestamp: string
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          user_id?: string | null
          participant_token?: string | null
          question_id?: string
          response_value?: any
          response_timestamp?: string
          created_at?: string
        }
      }
      assessment_results: {
        Row: {
          id: string
          assessment_id: string
          user_id: string | null
          participant_token: string | null
          primary_archetype: string
          secondary_archetype: string
          all_scores: any
          confidence: number
          completed_at: string
          section_scores: any
        }
        Insert: {
          id?: string
          assessment_id: string
          user_id?: string | null
          participant_token?: string | null
          primary_archetype: string
          secondary_archetype: string
          all_scores: any
          confidence: number
          completed_at: string
          section_scores: any
        }
        Update: {
          id?: string
          assessment_id?: string
          user_id?: string | null
          participant_token?: string | null
          primary_archetype?: string
          secondary_archetype?: string
          all_scores?: any
          confidence?: number
          completed_at?: string
          section_scores?: any
        }
      }
      invites: {
        Row: {
          id: string
          email: string
          organisation_id: string
          assessment_id: string | null
          role: 'user_admin' | 'participant'
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by: string
          invited_at: string
          expires_at: string
          token: string
        }
        Insert: {
          id?: string
          email: string
          organisation_id: string
          assessment_id?: string | null
          role: 'user_admin' | 'participant'
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by: string
          invited_at: string
          expires_at: string
          token: string
        }
        Update: {
          id?: string
          email?: string
          organisation_id?: string
          assessment_id?: string | null
          role?: 'user_admin' | 'participant'
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          invited_by?: string
          invited_at?: string
          expires_at?: string
          token?: string
        }
      }
    }
  }
}