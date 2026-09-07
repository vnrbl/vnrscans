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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          id: string
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_pages: {
        Row: {
          chapter_id: string
          id: string
          image_url: string
          page_number: number
        }
        Insert: {
          chapter_id: string
          id?: string
          image_url: string
          page_number: number
        }
        Update: {
          chapter_id?: string
          id?: string
          image_url?: string
          page_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "chapter_pages_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          chapter_type: Database["public"]["Enums"]["chapter_type"]
          created_at: string
          id: string
          novel_content: string | null
          scheduled_at: string | null
          series_id: string
          slug: string
          status: Database["public"]["Enums"]["chapter_status"]
          title: string | null
          updated_at: string
          view_count: number
          uploaded_by: string | null
          scanlation_group: string | null
          source_url: string | null
        }
        Insert: {
          chapter_number: number
          chapter_type?: Database["public"]["Enums"]["chapter_type"]
          created_at?: string
          id?: string
          novel_content?: string | null
          scheduled_at?: string | null
          series_id: string
          slug: string
          status?: Database["public"]["Enums"]["chapter_status"]
          title?: string | null
          updated_at?: string
          view_count?: number
          uploaded_by?: string | null
          scanlation_group?: string | null
          source_url?: string | null
        }
        Update: {
          chapter_number?: number
          chapter_type?: Database["public"]["Enums"]["chapter_type"]
          created_at?: string
          id?: string
          novel_content?: string | null
          scheduled_at?: string | null
          series_id?: string
          slug?: string
          status?: Database["public"]["Enums"]["chapter_status"]
          title?: string | null
          updated_at?: string
          view_count?: number
          uploaded_by?: string | null
          scanlation_group?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          chapter_id: string | null
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          series_id: string | null
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          series_id?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          series_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          experience_points: number
          id: string
          reading_streak: number | null
          last_read_date: string | null
          user_id: string
          username: string
          user_level: number
          banner_url: string | null
          accent_color: string | null
          social_discord: string | null
          social_instagram: string | null
          social_twitter: string | null
          social_mal: string | null
          social_anilist: string | null
          social_website: string | null
          is_vip: boolean
          avatar_frame: string | null
          is_banned: boolean | null
          ban_reason: string | null
          banned_at: string | null
          profile_visibility: string | null
          show_reading_history: boolean | null
          show_achievements: boolean | null
          show_statistics: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          reading_streak?: number | null
          last_read_date?: string | null
          user_id: string
          username: string
          user_level?: number
          banner_url?: string | null
          accent_color?: string | null
          social_discord?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_mal?: string | null
          social_anilist?: string | null
          social_website?: string | null
          is_vip?: boolean
          avatar_frame?: string | null
          is_banned?: boolean | null
          ban_reason?: string | null
          banned_at?: string | null
          profile_visibility?: string | null
          show_reading_history?: boolean | null
          show_achievements?: boolean | null
          show_statistics?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          experience_points?: number
          id?: string
          reading_streak?: number | null
          last_read_date?: string | null
          user_id?: string
          username?: string
          user_level?: number
          banner_url?: string | null
          accent_color?: string | null
          social_discord?: string | null
          social_instagram?: string | null
          social_twitter?: string | null
          social_mal?: string | null
          social_anilist?: string | null
          social_website?: string | null
          is_vip?: boolean
          avatar_frame?: string | null
          is_banned?: boolean | null
          ban_reason?: string | null
          banned_at?: string | null
          profile_visibility?: string | null
          show_reading_history?: boolean | null
          show_achievements?: boolean | null
          show_statistics?: boolean | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_history: {
        Row: {
          chapter_id: string
          id: string
          progress: number
          series_id: string
          updated_at: string
          user_id: string
          xp_awarded: boolean
        }
        Insert: {
          chapter_id: string
          id?: string
          progress?: number
          series_id: string
          updated_at?: string
          user_id: string
          xp_awarded?: boolean
        }
        Update: {
          chapter_id?: string
          id?: string
          progress?: number
          series_id?: string
          updated_at?: string
          user_id?: string
          xp_awarded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reading_history_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_history_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      series_covers: {
        Row: {
          id: string
          series_id: string
          image_url: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          series_id: string
          image_url: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          series_id?: string
          image_url?: string
          position?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_covers_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          alternative_titles: string | null
          artist: string | null
          author: string | null
          cover_url: string | null
          content_rating: Database["public"]["Enums"]["content_rating"]
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_hidden: boolean
          is_trending: boolean
          rating_average: number
          release_year: number | null
          slug: string
          status: Database["public"]["Enums"]["series_status"]
          title: string
          type: Database["public"]["Enums"]["series_type"]
          updated_at: string
          view_count: number
          chapter_count: number | null
          estimated_next_release_at: string | null
          release_cadence: string | null
          universe: string | null
          universe_role: string | null
        }
        Insert: {
          alternative_titles?: string | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          content_rating?: Database["public"]["Enums"]["content_rating"]
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_trending?: boolean
          rating_average?: number
          release_year?: number | null
          slug: string
          status?: Database["public"]["Enums"]["series_status"]
          title: string
          type?: Database["public"]["Enums"]["series_type"]
          updated_at?: string
          view_count?: number
          chapter_count?: number | null
          estimated_next_release_at?: string | null
          release_cadence?: string | null
          universe?: string | null
          universe_role?: string | null
        }
        Update: {
          alternative_titles?: string | null
          artist?: string | null
          author?: string | null
          cover_url?: string | null
          content_rating?: Database["public"]["Enums"]["content_rating"]
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_hidden?: boolean
          is_trending?: boolean
          rating_average?: number
          release_year?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["series_status"]
          title?: string
          type?: Database["public"]["Enums"]["series_type"]
          updated_at?: string
          view_count?: number
          chapter_count?: number | null
          estimated_next_release_at?: string | null
          release_cadence?: string | null
          universe?: string | null
          universe_role?: string | null
        }
        Relationships: []
      }
      series_genres: {
        Row: {
          genre_id: string
          id: string
          series_id: string
        }
        Insert: {
          genre_id: string
          id?: string
          series_id: string
        }
        Update: {
          genre_id?: string
          id?: string
          series_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_genres_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      role_permissions: {
        Row: {
          id: string
          role_name: string
          resource_type: string
          can_read: boolean
          can_write: boolean
          can_delete: boolean
          can_publish: boolean
          can_moderate: boolean
          can_manage_users: boolean
          can_manage_roles: boolean
          can_view_analytics: boolean
          can_manage_settings: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          role_name: string
          resource_type: string
          can_read?: boolean
          can_write?: boolean
          can_delete?: boolean
          can_publish?: boolean
          can_moderate?: boolean
          can_manage_users?: boolean
          can_manage_roles?: boolean
          can_view_analytics?: boolean
          can_manage_settings?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          role_name?: string
          resource_type?: string
          can_read?: boolean
          can_write?: boolean
          can_delete?: boolean
          can_publish?: boolean
          can_moderate?: boolean
          can_manage_users?: boolean
          can_manage_roles?: boolean
          can_view_analytics?: boolean
          can_manage_settings?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      moderation_queue: {
        Row: {
          id: string
          priority: string
          content_type: string
          content_id: string
          auto_flagged: boolean | null
          flag_score: number | null
          status: string
          reason: string | null
          reported_by: string | null
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          review_notes: string | null
          action_taken: string | null
          updated_at: string | null
          source_report_id: string | null
        }
        Insert: {
          id?: string
          priority: string
          content_type: string
          content_id: string
          auto_flagged?: boolean | null
          flag_score?: number | null
          status?: string
          reason?: string | null
          reported_by?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: string | null
          updated_at?: string | null
          source_report_id?: string | null
        }
        Update: {
          id?: string
          priority?: string
          content_type?: string
          content_id?: string
          auto_flagged?: boolean | null
          flag_score?: number | null
          status?: string
          reason?: string | null
          reported_by?: string | null
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          review_notes?: string | null
          action_taken?: string | null
          updated_at?: string | null
          source_report_id?: string | null
        }
        Relationships: []
      }
      admin_activity_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: string | null
          priority: number | null
          show_banner: boolean | null
          banner_color: string | null
          icon: string | null
          target_audience: string | null
          starts_at: string | null
          expires_at: string | null
          is_active: boolean | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: string | null
          priority?: number | null
          show_banner?: boolean | null
          banner_color?: string | null
          icon?: string | null
          target_audience?: string | null
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: string | null
          priority?: number | null
          show_banner?: boolean | null
          banner_color?: string | null
          icon?: string | null
          target_audience?: string | null
          starts_at?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_announcements: {
        Row: {
          id: string
          user_id: string
          announcement_id: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          announcement_id: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          announcement_id?: string
          read_at?: string | null
        }
        Relationships: []
      }
      carousel_items: {
        Row: {
          id: string
          series_id: string
          position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          series_id: string
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          series_id?: string
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carousel_items_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          }
        ]
      }
      user_notifications: {
        Row: {
          id: string
          user_id: string
          notification_type: string
          title: string
          message: string | null
          link_url: string | null
          icon: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          notification_type: string
          title: string
          message?: string | null
          link_url?: string | null
          icon?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          notification_type?: string
          title?: string
          message?: string | null
          link_url?: string | null
          icon?: string | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      profile_badges: {
        Row: {
          id: string
          name: string
          description: string | null
          icon: string | null
          badge_color: string | null
          requirement_type: string
          requirement_value: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon?: string | null
          badge_color?: string | null
          requirement_type: string
          requirement_value?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon?: string | null
          badge_color?: string | null
          requirement_type?: string
          requirement_value?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string | null
          is_equipped: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          earned_at?: string | null
          is_equipped?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          earned_at?: string | null
          is_equipped?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "profile_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      chapter_reactions: {
        Row: {
          id: string
          chapter_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          reaction_type: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          reaction_type: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          reaction_type?: string
          created_at?: string
        }
        Relationships: []
      }
      series_follows: {
        Row: {
          id: string
          user_id: string
          series_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          series_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          series_id?: string
          created_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          id: string
          date: string
          total_users: number | null
          new_users: number | null
          active_users: number | null
          vip_users: number | null
          total_series: number | null
          new_series: number | null
          total_chapters: number | null
          new_chapters: number | null
          total_views: number | null
          total_bookmarks: number | null
          total_comments: number | null
          total_ratings: number | null
          chapters_read: number | null
          unique_readers: number | null
          avg_reading_time_minutes: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          date: string
          total_users?: number | null
          new_users?: number | null
          active_users?: number | null
          vip_users?: number | null
          total_series?: number | null
          new_series?: number | null
          total_chapters?: number | null
          new_chapters?: number | null
          total_views?: number | null
          total_bookmarks?: number | null
          total_comments?: number | null
          total_ratings?: number | null
          chapters_read?: number | null
          unique_readers?: number | null
          avg_reading_time_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          date?: string
          total_users?: number | null
          new_users?: number | null
          active_users?: number | null
          vip_users?: number | null
          total_series?: number | null
          new_series?: number | null
          total_chapters?: number | null
          new_chapters?: number | null
          total_views?: number | null
          total_bookmarks?: number | null
          total_comments?: number | null
          total_ratings?: number | null
          chapters_read?: number | null
          unique_readers?: number | null
          avg_reading_time_minutes?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      series_analytics: {
        Row: {
          id: string
          series_id: string
          date: string
          views_today: number | null
          bookmarks_today: number | null
          comments_today: number | null
          chapters_read_today: number | null
          unique_readers_today: number | null
          total_views: number | null
          total_bookmarks: number | null
          total_comments: number | null
          avg_rating: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          series_id: string
          date: string
          views_today?: number | null
          bookmarks_today?: number | null
          comments_today?: number | null
          chapters_read_today?: number | null
          unique_readers_today?: number | null
          total_views?: number | null
          total_bookmarks?: number | null
          total_comments?: number | null
          avg_rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          series_id?: string
          date?: string
          views_today?: number | null
          bookmarks_today?: number | null
          comments_today?: number | null
          chapters_read_today?: number | null
          unique_readers_today?: number | null
          total_views?: number | null
          total_bookmarks?: number | null
          total_comments?: number | null
          avg_rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_sessions: {
        Row: {
          id: string
          user_id: string | null
          series_id: string
          chapter_id: string
          started_at: string | null
          ended_at: string | null
          duration_seconds: number | null
          pages_read: number | null
          completed: boolean | null
          device_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          series_id: string
          chapter_id: string
          started_at?: string | null
          ended_at?: string | null
          duration_seconds?: number | null
          pages_read?: number | null
          completed?: boolean | null
          device_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          series_id?: string
          chapter_id?: string
          started_at?: string | null
          ended_at?: string | null
          duration_seconds?: number | null
          pages_read?: number | null
          completed?: boolean | null
          device_type?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          icon: string | null
          usage_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          icon?: string | null
          usage_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          icon?: string | null
          usage_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      series_tags: {
        Row: {
          id: string
          series_id: string
          tag_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          series_id: string
          tag_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          series_id?: string
          tag_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_tags_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          target_type: string
          target_value: number
          current_value: number | null
          start_date: string
          end_date: string | null
          is_active: boolean | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          target_type: string
          target_value: number
          current_value?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          target_type?: string
          target_value?: number
          current_value?: number | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reading_collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          is_public: boolean | null
          cover_url: string | null
          item_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          is_public?: boolean | null
          cover_url?: string | null
          item_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          is_public?: boolean | null
          cover_url?: string | null
          item_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          id: string
          collection_id: string
          series_id: string
          added_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          collection_id: string
          series_id: string
          added_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          collection_id?: string
          series_id?: string
          added_at?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          id: string
          user_id: string
          milestone_type: string
          milestone_value: number
          title: string
          description: string | null
          icon: string | null
          achieved_at: string | null
          is_celebrated: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          milestone_type: string
          milestone_value: number
          title: string
          description?: string | null
          icon?: string | null
          achieved_at?: string | null
          is_celebrated?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          milestone_type?: string
          milestone_value?: number
          title?: string
          description?: string | null
          icon?: string | null
          achieved_at?: string | null
          is_celebrated?: boolean | null
        }
        Relationships: []
      }
      profile_widgets: {
        Row: {
          id: string
          user_id: string
          widget_type: string
          theme: string | null
          embed_code: string | null
          view_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          widget_type: string
          theme?: string | null
          embed_code?: string | null
          view_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          widget_type?: string
          theme?: string | null
          embed_code?: string | null
          view_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      series_import_sources: {
        Row: {
          id: string
          series_id: string
          source_name?: string
          source_url: string
          source_site?: string | null
          scanlation_group?: string | null
          image_url_example?: string | null
          enabled?: boolean
          auto_publish?: boolean
          check_interval_minutes?: number
          last_checked_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          last_scraped_at?: string | null
          is_active?: boolean | null
          estimated_next_release_at?: string | null
          release_cadence?: string | null
          last_scanned_timing_at?: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          series_id: string
          source_name?: string
          source_url: string
          source_site?: string | null
          scanlation_group?: string | null
          image_url_example?: string | null
          enabled?: boolean
          auto_publish?: boolean
          check_interval_minutes?: number
          last_checked_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          last_scraped_at?: string | null
          is_active?: boolean | null
          estimated_next_release_at?: string | null
          release_cadence?: string | null
          last_scanned_timing_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          series_id?: string
          source_name?: string
          source_url?: string
          source_site?: string | null
          scanlation_group?: string | null
          image_url_example?: string | null
          enabled?: boolean
          auto_publish?: boolean
          check_interval_minutes?: number
          last_checked_at?: string | null
          last_success_at?: string | null
          last_error?: string | null
          last_scraped_at?: string | null
          is_active?: boolean | null
          estimated_next_release_at?: string | null
          release_cadence?: string | null
          last_scanned_timing_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      series_import_logs: {
        Row: {
          id: string
          source_id: string | null
          status: string
          message: string | null
          duration_seconds: number | null
          chapters_added: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          source_id?: string | null
          status: string
          message?: string | null
          duration_seconds?: number | null
          chapters_added?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          source_id?: string | null
          status?: string
          message?: string | null
          duration_seconds?: number | null
          chapters_added?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          link_url: string | null
          link_text: string | null
          position: string
          priority: number
          background_color: string | null
          text_color: string | null
          starts_at: string | null
          expires_at: string | null
          target_series_id: string | null
          is_active: boolean
          view_count: number
          click_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          link_text?: string | null
          position?: string
          priority?: number
          background_color?: string | null
          text_color?: string | null
          starts_at?: string | null
          expires_at?: string | null
          target_series_id?: string | null
          is_active?: boolean
          view_count?: number
          click_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          link_url?: string | null
          link_text?: string | null
          position?: string
          priority?: number
          background_color?: string | null
          text_color?: string | null
          starts_at?: string | null
          expires_at?: string | null
          target_series_id?: string | null
          is_active?: boolean
          view_count?: number
          click_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_target_series_id_fkey"
            columns: ["target_series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          }
        ]
      }
      user_library: {
        Row: {
          created_at: string
          id: string
          reading_status: Database["public"]["Enums"]["reading_status"]
          series_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reading_status?: Database["public"]["Enums"]["reading_status"]
          series_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reading_status?: Database["public"]["Enums"]["reading_status"]
          series_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          }
        ]
      }
      user_recommendations: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          score: number
          series_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          score?: number
          series_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          score?: number
          series_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendations_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          }
        ]
      }
      xp_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string
          reference_id: string | null
          reference_type: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source: string
          reference_id?: string | null
          reference_type?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source?: string
          reference_id?: string | null
          reference_type?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_most_followed_series: {
        Args: {
          limit_count?: number
        }
        Returns: {
          id: string
          slug: string
          title: string
          cover_url: string | null
          type: string
          rating_average: number | null
          view_count: number | null
          status: string
          follower_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chapter_view: {
        Args: {
          _chapter_id: string
        }
        Returns: undefined
      }
      increment_series_view: {
        Args: {
          _series_id: string
        }
        Returns: undefined
      }
      generate_user_recommendations: {
        Args: {
          target_user_id: string
        }
        Returns: undefined
      }
      award_chapter_completion_xp: {
        Args: {
          _chapter_id: string
        }
        Returns: {
          xp_gained: number
          source: string
          description: string | null
          total_xp: number | null
          new_level: number | null
          leveled_up: boolean | null
        }[]
      }
      get_chapter_reader_counts: {
        Args: {
          _series_id: string
        }
        Returns: {
          chapter_id: string
          reader_count: number
        }[]
      }
      get_series_top_cultivators: {
        Args: {
          _series_id: string
          _limit?: number
        }
        Returns: {
          user_id: string
          username: string
          avatar_url: string | null
          avatar_frame: string | null
          accent_color: string | null
          user_level: number
          total_user_qi: number
          series_qi_collected: number
          chapters_read: number
        }[]
      }
      get_series_with_latest_chapters: {
        Args: {
          limit_count: number
          offset_count?: number
        }
        Returns: {
          id: string
          slug: string
          title: string
          cover_url: string | null
          type: string
          latest_chapter_created_at: string
          recent_chapters: any
        }[]
      }
      get_user_reading_history_series: {
        Args: {
          _user_id: string
          _cutoff?: string | null
        }
        Returns: {
          id: string
          updated_at: string
          progress: number
          series_id: string
          series_slug: string
          series_title: string
          series_cover_url: string | null
          chapter_id: string
          chapter_slug: string
          chapter_number: number
          chapter_title: string | null
        }[]
      }
      get_user_reading_history_chapters: {
        Args: {
          _user_id: string
          _cutoff?: string | null
          _limit?: number
        }
        Returns: {
          id: string
          updated_at: string
          progress: number
          series_id: string
          series_slug: string
          series_title: string
          series_cover_url: string | null
          chapter_id: string
          chapter_slug: string
          chapter_number: number
          chapter_title: string | null
        }[]
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "uploader"
      chapter_status: "draft" | "published" | "scheduled"
      chapter_type: "image" | "novel"
      content_rating: "safe" | "suggestive" | "nsfw" | "pornographic"
      reading_status: "reading" | "completed" | "plan_to_read" | "dropped"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      series_status: "ongoing" | "completed" | "hiatus"
      series_type: "manga" | "manhwa" | "manhua" | "novel"
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
      app_role: ["user", "moderator", "admin", "uploader"],
      chapter_status: ["draft", "published", "scheduled"],
      chapter_type: ["image", "novel"],
      content_rating: ["safe", "suggestive", "nsfw", "pornographic"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      series_status: ["ongoing", "completed", "hiatus"],
      series_type: ["manga", "manhwa", "manhua", "novel"],
    },
  },
} as const
