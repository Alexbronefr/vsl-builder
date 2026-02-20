export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'admin' | 'editor' | 'viewer'
          invited_email: string | null
          accepted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'admin' | 'editor' | 'viewer'
          invited_email?: string | null
          accepted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'admin' | 'editor' | 'viewer'
          invited_email?: string | null
          accepted?: boolean
          created_at?: string
        }
      }
      landers: {
        Row: {
          id: string
          team_id: string
          slug: string
          name: string
          status: 'draft' | 'published' | 'archived'
          content: Record<string, any>
          video_config: Record<string, any>
          form_config: Record<string, any>
          tricks_config: Record<string, any>
          style_config: Record<string, any>
          geo_lang: Record<string, any>
          analytics_config: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          slug: string
          name: string
          status?: 'draft' | 'published' | 'archived'
          content?: Record<string, any>
          video_config?: Record<string, any>
          form_config?: Record<string, any>
          tricks_config?: Record<string, any>
          style_config?: Record<string, any>
          geo_lang?: Record<string, any>
          analytics_config?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          slug?: string
          name?: string
          status?: 'draft' | 'published' | 'archived'
          content?: Record<string, any>
          video_config?: Record<string, any>
          form_config?: Record<string, any>
          tricks_config?: Record<string, any>
          style_config?: Record<string, any>
          geo_lang?: Record<string, any>
          analytics_config?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          team_id: string
          name: string
          original_storage_path: string | null
          hls_manifest_url: string | null
          encryption_key: string | null
          status: 'uploading' | 'queued' | 'converting' | 'ready' | 'error'
          conversion_progress: number
          duration_seconds: number | null
          qualities: string[]
          file_size_bytes: number | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          original_storage_path?: string | null
          hls_manifest_url?: string | null
          encryption_key?: string | null
          status?: 'uploading' | 'queued' | 'converting' | 'ready' | 'error'
          conversion_progress?: number
          duration_seconds?: number | null
          qualities?: string[]
          file_size_bytes?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          original_storage_path?: string | null
          hls_manifest_url?: string | null
          encryption_key?: string | null
          status?: 'uploading' | 'queued' | 'converting' | 'ready' | 'error'
          conversion_progress?: number
          duration_seconds?: number | null
          qualities?: string[]
          file_size_bytes?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          lander_id: string
          data: Record<string, any>
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          ip_address: string | null
          country: string | null
          city: string | null
          user_agent: string | null
          video_watched_seconds: number
          video_total_duration: number
          video_completed: boolean
          referrer: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lander_id: string
          data: Record<string, any>
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          ip_address?: string | null
          country?: string | null
          city?: string | null
          user_agent?: string | null
          video_watched_seconds?: number
          video_total_duration?: number
          video_completed?: boolean
          referrer?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lander_id?: string
          data?: Record<string, any>
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          ip_address?: string | null
          country?: string | null
          city?: string | null
          user_agent?: string | null
          video_watched_seconds?: number
          video_total_duration?: number
          video_completed?: boolean
          referrer?: string | null
          session_id?: string | null
          created_at?: string
        }
      }
      analytics_events: {
        Row: {
          id: string
          lander_id: string
          session_id: string
          event_type: string
          event_data: Record<string, any>
          ip_address: string | null
          country: string | null
          city: string | null
          device_type: string | null
          browser: string | null
          os: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lander_id: string
          session_id: string
          event_type: string
          event_data?: Record<string, any>
          ip_address?: string | null
          country?: string | null
          city?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lander_id?: string
          session_id?: string
          event_type?: string
          event_data?: Record<string, any>
          ip_address?: string | null
          country?: string | null
          city?: string | null
          device_type?: string | null
          browser?: string | null
          os?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          created_at?: string
        }
      }
    }
  }
}
